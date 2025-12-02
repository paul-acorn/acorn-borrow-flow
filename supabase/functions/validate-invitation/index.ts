import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (resets on function cold start)
// For production, consider using Redis or a database table
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5; // 5 attempts per minute

function getRateLimitKey(ip: string): string {
  return `validate_token:${ip}`;
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; resetIn: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      resetIn: record.resetTime - now 
    };
  }

  record.count++;
  rateLimitStore.set(key, record);
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - record.count, 
    resetIn: record.resetTime - now 
  };
}

// Clean up old entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many validation attempts. Please try again later.',
          resetIn: Math.ceil(rateLimitResult.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000))
          } 
        }
      );
    }

    // Parse request body
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      console.log(`Invalid token format from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the secure validation function
    const { data, error } = await supabase.rpc('validate_invitation_token', { _token: token });

    if (error) {
      console.error('Error validating token:', error);
      return new Response(
        JSON.stringify({ error: 'Validation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.length === 0) {
      console.log(`Invalid token attempt from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired invitation',
          remainingAttempts: rateLimitResult.remainingAttempts
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Valid token validated for invitation: ${data[0].id}`);
    
    // Periodically cleanup old rate limit entries
    if (Math.random() < 0.1) {
      cleanupRateLimitStore();
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        invitation: data[0],
        remainingAttempts: rateLimitResult.remainingAttempts
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
