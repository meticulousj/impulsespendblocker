import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = ["Gadgets", "Clothing", "Food", "Subscription", "Travel", "Home", "Beauty", "Entertainment", "Other"];

function getWeekRange(d = new Date()) {
  const day = d.getUTCDay(); // 0 Sun
  const diff = (day + 6) % 7; // days since Monday
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function generateForUser(supabase: any, userId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data: decisions, error } = await supabase
    .from("purchase_decisions")
    .select("item,price,verdict,overridden,category,decision_hour,decision_dow,created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  if (!decisions || decisions.length === 0) {
    return { skipped: true, reason: "no_recent_activity" };
  }

  // Build category breakdown
  const breakdown: Record<string, { count: number; total: number; avoided: number }> = {};
  for (const d of decisions) {
    const c = d.category && CATEGORIES.includes(d.category) ? d.category : "Other";
    if (!breakdown[c]) breakdown[c] = { count: 0, total: 0, avoided: 0 };
    breakdown[c].count += 1;
    breakdown[c].total += Number(d.price) || 0;
    if ((d.verdict === "SKIP" || d.verdict === "WAIT") && !d.overridden) {
      breakdown[c].avoided += Number(d.price) || 0;
    }
  }

  // Summary for AI
  const summary = decisions.map((d: any) => ({
    item: d.item,
    price: d.price,
    verdict: d.verdict,
    overridden: d.overridden,
    category: d.category ?? "Other",
    hour: d.decision_hour,
    dow: d.decision_dow,
  }));

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const systemPrompt = `You are a sharp behavioral spending analyst. Given a user's last 30 days of purchase decisions (with verdicts, overrides, hour-of-day, and day-of-week — DOW: 0=Sun..6=Sat), surface 3 to 5 specific, useful patterns.

Return ONLY this JSON (no markdown):
{"insights":[{"headline":"short punchy line","detail":"1-2 sentences with concrete numbers","severity":"info|warn|alert"}]}

Rules:
- Each headline must be specific and reference a real pattern (category, hour, day, or override behavior).
- Use real numbers from the data ("4 attempts this week", "60% of SKIPs overridden").
- severity: alert = problematic pattern, warn = worth watching, info = neutral observation.
- Be concise. No fluff.`;

  const userPrompt = `Last 30 days of decisions:\n${JSON.stringify(summary)}\n\nCategory totals: ${JSON.stringify(breakdown)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded");
    if (resp.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`AI gateway error ${resp.status}`);
  }

  const aiData = await resp.json();
  let content = aiData.choices?.[0]?.message?.content?.trim() || "{}";
  if (content.startsWith("```")) content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  let parsed: any = { insights: [] };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { insights: [{ headline: "Insights unavailable", detail: "Could not parse AI response.", severity: "info" }] };
  }

  const { start, end } = getWeekRange();
  const row = {
    user_id: userId,
    week_start: fmt(start),
    week_end: fmt(end),
    insights: parsed.insights ?? [],
    category_breakdown: breakdown,
    generated_at: new Date().toISOString(),
  };

  const { data: upserted, error: upErr } = await supabase
    .from("weekly_digests")
    .upsert(row, { onConflict: "user_id,week_start" })
    .select()
    .single();
  if (upErr) throw upErr;

  return { skipped: false, digest: upserted };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify caller
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const result = await generateForUser(admin, userData.user.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});