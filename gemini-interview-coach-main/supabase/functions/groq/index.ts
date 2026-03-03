// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info('Groq function started');

Deno.serve(async (req: Request) => {
  try {
    const endpoint = Deno.env.get('Groq_API_ENDPOINT');
    const apiKey = Deno.env.get('Groq_API_KEY');

    if (!endpoint || !apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: Groq_API_ENDPOINT or Groq_API_KEY missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => null);

    // Forward the request to the configured Groq endpoint
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use Authorization Bearer by default; some endpoints may accept x-api-key instead — configure accordingly
        'Authorization': `Bearer ${apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await resp.text();

    return new Response(text, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' },
    });
  } catch (err) {
    console.error('Groq function error', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
