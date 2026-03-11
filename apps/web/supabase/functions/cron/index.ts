// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));

    const { data: getData } = await supabase.from('cron').select("*").eq('id', 1);
    const { data: upsertData } = await supabase.from('cron').upsert({ id: 1, last_received: new Date().toISOString(), request_count: getData[0].request_count + 1 }).select();

    return new Response(
      JSON.stringify(upsertData),
      { headers: { "Content-Type": "application/json" },
      status: 200},
    )
  } catch (err) {
    console.log("errror: " + error);
    return new Response(
      JSON.stringify({error: "Edge function is broken, check it"}),
      { headers: { "Content-Type": "application/json" },
      status: 500},
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cron' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
