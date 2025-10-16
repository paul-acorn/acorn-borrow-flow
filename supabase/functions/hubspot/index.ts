import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

async function makeHubSpotRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log('Making HubSpot request:', method, url);
  
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    console.error('HubSpot API error:', response.status, error);
    throw new Error(`HubSpot API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function createDeal(properties: any) {
  return makeHubSpotRequest('/crm/v3/objects/deals', 'POST', { properties });
}

async function updateDeal(dealId: string, properties: any) {
  return makeHubSpotRequest(`/crm/v3/objects/deals/${dealId}`, 'PATCH', { properties });
}

async function getDeal(dealId: string) {
  return makeHubSpotRequest(`/crm/v3/objects/deals/${dealId}`);
}

async function listDeals(limit: number = 10) {
  return makeHubSpotRequest(`/crm/v3/objects/deals?limit=${limit}`);
}

async function createContact(properties: any) {
  return makeHubSpotRequest('/crm/v3/objects/contacts', 'POST', { properties });
}

async function updateContact(contactId: string, properties: any) {
  return makeHubSpotRequest(`/crm/v3/objects/contacts/${contactId}`, 'PATCH', { properties });
}

async function getContact(contactId: string) {
  return makeHubSpotRequest(`/crm/v3/objects/contacts/${contactId}`);
}

async function searchDeals(filterGroups: any, limit: number = 10) {
  return makeHubSpotRequest('/crm/v3/objects/deals/search', 'POST', {
    filterGroups,
    limit,
  });
}

async function searchContacts(filterGroups: any, limit: number = 10) {
  return makeHubSpotRequest('/crm/v3/objects/contacts/search', 'POST', {
    filterGroups,
    limit,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log('HubSpot action:', action, 'params:', params);

    let result;
    switch (action) {
      // Deal operations
      case 'createDeal':
        result = await createDeal(params.properties);
        break;
      case 'updateDeal':
        result = await updateDeal(params.dealId, params.properties);
        break;
      case 'getDeal':
        result = await getDeal(params.dealId);
        break;
      case 'listDeals':
        result = await listDeals(params.limit);
        break;
      
      // Contact operations
      case 'createContact':
        result = await createContact(params.properties);
        break;
      case 'updateContact':
        result = await updateContact(params.contactId, params.properties);
        break;
      case 'getContact':
        result = await getContact(params.contactId);
        break;
      
      // Search operations
      case 'searchDeals':
        result = await searchDeals(params.filterGroups, params.limit);
        break;
      case 'searchContacts':
        result = await searchContacts(params.filterGroups, params.limit);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in hubspot function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
