import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { operation, dataType, data: inputData, recordId } = await req.json();

    if (operation === 'save') {
      // Encrypt sensitive fields based on data type
      let updateData: any = {};

      if (dataType === 'personal_details' && inputData.ni_number) {
        updateData.ni_number = await encryptData(inputData.ni_number);
      }

      if (dataType === 'credit_history') {
        if (inputData.ccj_details) updateData.ccj_details = await encryptData(inputData.ccj_details);
        if (inputData.default_details) updateData.default_details = await encryptData(inputData.default_details);
        if (inputData.arrears_details) updateData.arrears_details = await encryptData(inputData.arrears_details);
        if (inputData.additional_notes) updateData.additional_notes = await encryptData(inputData.additional_notes);
        // Copy non-sensitive fields
        Object.keys(inputData).forEach(key => {
          if (!['ccj_details', 'default_details', 'arrears_details', 'additional_notes'].includes(key)) {
            updateData[key] = inputData[key];
          }
        });
      }

      if (dataType === 'two_factor') {
        if (inputData.totp_secret) updateData.totp_secret = await encryptData(inputData.totp_secret);
        if (inputData.sms_phone_number) updateData.sms_phone_number = await encryptData(inputData.sms_phone_number);
        if (inputData.backup_codes) {
          const encryptedCodes = await Promise.all(
            inputData.backup_codes.map((code: string) => encryptData(code))
          );
          updateData.backup_codes = encryptedCodes;
        }
        // Copy non-sensitive fields
        Object.keys(inputData).forEach(key => {
          if (!['totp_secret', 'sms_phone_number', 'backup_codes'].includes(key)) {
            updateData[key] = inputData[key];
          }
        });
      }

      const tableName = dataType === 'personal_details' ? 'client_personal_details' :
                       dataType === 'credit_history' ? 'client_credit_history' :
                       'two_factor_auth';

      let query;
      if (recordId) {
        query = supabaseClient.from(tableName).update(updateData).eq('id', recordId);
      } else {
        updateData.user_id = user.id;
        query = supabaseClient.from(tableName).insert(updateData);
      }

      const { error: saveError } = await query;
      if (saveError) throw saveError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (operation === 'retrieve') {
      const tableName = dataType === 'personal_details' ? 'client_personal_details' :
                       dataType === 'credit_history' ? 'client_credit_history' :
                       'two_factor_auth';

      const { data: records, error: fetchError } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!records) {
        return new Response(
          JSON.stringify({ success: true, data: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt sensitive fields
      const decryptedData: any = { ...records };

      if (dataType === 'personal_details' && records.ni_number) {
        try {
          decryptedData.ni_number = await decryptData(records.ni_number);
        } catch {
          decryptedData.ni_number = records.ni_number; // Fallback if not encrypted
        }
      }

      if (dataType === 'credit_history') {
        const fieldsToDecrypt = ['ccj_details', 'default_details', 'arrears_details', 'additional_notes'];
        for (const field of fieldsToDecrypt) {
          if (records[field]) {
            try {
              decryptedData[field] = await decryptData(records[field]);
            } catch {
              decryptedData[field] = records[field]; // Fallback if not encrypted
            }
          }
        }
      }

      if (dataType === 'two_factor') {
        if (records.totp_secret) {
          try {
            decryptedData.totp_secret = await decryptData(records.totp_secret);
          } catch {
            decryptedData.totp_secret = records.totp_secret;
          }
        }
        if (records.sms_phone_number) {
          try {
            decryptedData.sms_phone_number = await decryptData(records.sms_phone_number);
          } catch {
            decryptedData.sms_phone_number = records.sms_phone_number;
          }
        }
        if (records.backup_codes && Array.isArray(records.backup_codes)) {
          try {
            decryptedData.backup_codes = await Promise.all(
              records.backup_codes.map((code: string) => decryptData(code))
            );
          } catch {
            decryptedData.backup_codes = records.backup_codes;
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: decryptedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in manage-sensitive-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
