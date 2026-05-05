import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Find users with activity in last 7 days
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 7);
    const { data: rows, error } = await admin
      .from("purchase_decisions")
      .select("user_id")
      .gte("created_at", since.toISOString());
    if (error) throw error;

    const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    let processed = 0;
    let failed = 0;

    for (const uid of userIds) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-insights-internal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
            "x-internal-user-id": uid,
          },
          body: JSON.stringify({ userId: uid }),
        });
        if (resp.ok) processed++;
        else failed++;
      } catch (e) {
        console.error("digest user error", uid, e);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed, total: userIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-digest error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});