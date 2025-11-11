import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  deal_code: string | null;
  assigned_broker: string | null;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google API credentials');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function createOrUpdateSpreadsheet(accessToken: string, deals: Deal[], profiles: Map<string, Profile>) {
  // Create a new spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Acorn Finance Deals Export - ${new Date().toISOString().split('T')[0]}`,
      },
      sheets: [{
        properties: {
          title: 'Deals',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      }],
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create spreadsheet: ${error}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // Prepare the data
  const headers = [
    'Deal ID',
    'Deal Name',
    'Client Name',
    'Client Email',
    'Deal Code',
    'Broker Name',
    'Broker Email',
    'Type',
    'Amount (GBP)',
    'Status',
    'Created Date',
    'Updated Date',
  ];

  const rows = deals.map(deal => {
    const profile = profiles.get(deal.user_id);
    const broker = profile?.assigned_broker ? profiles.get(profile.assigned_broker) : null;
    
    return [
      deal.id,
      deal.name,
      profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
      profile?.email || '',
      profile?.deal_code || '',
      broker ? `${broker.first_name || ''} ${broker.last_name || ''}`.trim() : 'No Broker',
      broker?.email || '',
      deal.type.replace('_', ' '),
      deal.amount || 0,
      deal.status.replace('_', ' '),
      new Date(deal.created_at).toLocaleString('en-GB'),
      new Date(deal.updated_at).toLocaleString('en-GB'),
    ];
  });

  // Update the spreadsheet with data
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Deals!A1:L${rows.length + 1}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers, ...rows],
      }),
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to update spreadsheet: ${error}`);
  }

  // Format the header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 12,
              },
            },
          },
        ],
      }),
    }
  );

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching deals from database...');

    // Fetch all deals
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`);
    }

    console.log(`Fetched ${deals.length} deals`);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    console.log(`Fetched ${profiles.length} profiles`);

    // Create a map for quick lookup
    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    // Get Google Sheets access
    console.log('Getting Google API access token...');
    const accessToken = await getAccessToken();

    // Create and populate spreadsheet
    console.log('Creating spreadsheet...');
    const result = await createOrUpdateSpreadsheet(accessToken, deals, profilesMap);

    console.log('Spreadsheet created successfully:', result.url);

    return new Response(
      JSON.stringify({
        success: true,
        spreadsheetUrl: result.url,
        spreadsheetId: result.spreadsheetId,
        dealsCount: deals.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
