import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, documentType } = await req.json();
    console.log('Verifying document:', { documentId, documentType });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('client_documents')
      .select('*, profiles!client_documents_user_id_fkey(first_name, last_name, email)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    console.log('Document retrieved:', document.file_name);

    // Download the document from storage
    const { data: fileData, error: storageError } = await supabaseClient.storage
      .from('client-documents')
      .download(document.file_path);

    if (storageError || !fileData) {
      throw new Error('Failed to download document from storage');
    }

    console.log('Document downloaded, converting to base64...');

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = document.mime_type || 'application/pdf';
    const base64Image = `data:${mimeType};base64,${base64}`;

    // Prepare AI prompt based on document type
    let systemPrompt = '';
    let validationChecks = [];

    switch (documentType) {
      case 'identity':
        systemPrompt = `You are a document verification expert. Analyze this identity document (passport, driver's license, or national ID) and extract key information. Check for:
1. Document type (passport/driver's license/national ID)
2. Full name (first name and last name)
3. Date of birth
4. Document number
5. Expiry date (if visible)
6. Photo quality and visibility
7. Signs of tampering or forgery (misaligned text, inconsistent fonts, poor photo quality, suspicious editing)

Provide a verification result with:
- verified: true/false (true if document appears legitimate)
- confidence: 0-100 (confidence percentage)
- extracted_data: {name, dob, document_number, expiry_date, document_type}
- fraud_indicators: array of any suspicious elements found
- notes: brief explanation of the verification result`;
        break;

      case 'proof_of_address':
        systemPrompt = `You are a document verification expert. Analyze this proof of address document (utility bill, bank statement, or council tax) and extract key information. Check for:
1. Document type (utility bill/bank statement/council tax)
2. Full name on the document
3. Complete address (house number, street, city, postcode)
4. Document date (must be within last 3 months)
5. Issuing organization/company
6. Signs of tampering or forgery (altered dates, inconsistent formatting, suspicious editing)

Provide a verification result with:
- verified: true/false (true if document appears legitimate and recent)
- confidence: 0-100 (confidence percentage)
- extracted_data: {name, address, document_date, issuer, document_type}
- fraud_indicators: array of any suspicious elements found
- notes: brief explanation including whether document is within 3 months`;
        break;

      case 'bank_statement':
        systemPrompt = `You are a document verification expert. Analyze this bank statement and extract key information. Check for:
1. Bank name and logo visibility
2. Account holder name
3. Account number (partially visible)
4. Statement period dates
5. Transaction history visibility
6. Bank contact information
7. Signs of tampering or forgery (altered balances, inconsistent formatting, missing transactions, suspicious editing)

Provide a verification result with:
- verified: true/false (true if document appears legitimate)
- confidence: 0-100 (confidence percentage)
- extracted_data: {bank_name, account_holder, statement_period, account_number_partial}
- fraud_indicators: array of any suspicious elements found
- notes: brief explanation of the verification result`;
        break;

      default:
        throw new Error('Invalid document type');
    }

    console.log('Calling Lovable AI for document verification...');

    // Call Lovable AI for document analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro for better accuracy on document verification
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this ${documentType.replace('_', ' ')} document and provide verification results in JSON format.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI verification complete');

    // Parse AI response
    const verification = JSON.parse(aiResult.choices[0].message.content);
    
    // Update document verification status in database
    const { error: updateError } = await supabaseClient
      .from('client_documents')
      .update({
        verified: verification.verified || false,
        verification_notes: JSON.stringify({
          confidence: verification.confidence,
          extracted_data: verification.extracted_data,
          fraud_indicators: verification.fraud_indicators || [],
          notes: verification.notes,
          verified_at: new Date().toISOString()
        })
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      throw updateError;
    }

    console.log('Document verification updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          verified: verification.verified,
          confidence: verification.confidence,
          extracted_data: verification.extracted_data,
          fraud_indicators: verification.fraud_indicators,
          notes: verification.notes
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Document verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});