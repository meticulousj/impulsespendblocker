import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIAL_LIMIT = 3;
const PRO_PRODUCT_ID = "prod_UBaQHnzH7vAT4E";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { item, price, income, savings, goal, archetype } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // --- Auth + free-trial gating -------------------------------------------
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sign in to use AI verdicts." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    const user = userData?.user;
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Sign in to use AI verdicts." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count } = await admin
      .from("ai_trial_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const used = count ?? 0;

    let isPro = false;
    if (used >= TRIAL_LIMIT) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 5,
          });
          isPro = subs.data.some((s) =>
            s.items.data.some((i) => (i.price.product as string) === PRO_PRODUCT_ID)
          );
        }
      }
      if (!isPro) {
        return new Response(
          JSON.stringify({
            error: "You've used your 3 free AI verdicts. Upgrade to Pro for unlimited.",
            trial_exhausted: true,
            trial_used: used,
            trial_limit: TRIAL_LIMIT,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const priceToIncomeRatio = ((price / income) * 100).toFixed(1);
    const savingsAfterPurchase = savings - price;

    const archetypeTone: Record<string, string> = {
      impulse:
        "User is an IMPULSE BUYER. Be firm, protective, and direct. Push back harder on borderline purchases. Use phrases like 'pump the brakes' and 'sleep on it'. Be the friend who stops them from doing something they'll regret. Lean toward WAIT or SKIP when borderline.",
      deal_hunter:
        "User is a DEAL HUNTER. Frame advice around value, cost-per-use, and whether the price represents real savings. Acknowledge their bargain instincts but call out 'fake deals' (buying things they don't need just because discounted).",
      saver:
        "User is a SAVER. Be warm and validating. Remind them money is a tool, not a trophy. For affordable purchases, give explicit permission to enjoy. Only push back hard when something genuinely threatens their goals. Lean toward BUY when borderline.",
    };
    const toneBlock = archetype && archetypeTone[archetype]
      ? `\n\nSPENDING PERSONALITY:\n${archetypeTone[archetype]}`
      : "";

    const systemPrompt = `You are a blunt, no-BS personal finance advisor. The user is about to make a purchase and needs your honest take.

You MUST respond with EXACTLY this JSON structure (no markdown, no code fences):
{"verdict":"BUY|WAIT|SKIP","reason":"2-3 sentences explaining why","tip":"One actionable tip","category":"Gadgets|Clothing|Food|Subscription|Travel|Home|Beauty|Entertainment|Other"}

Pick the single best category for the item.

Verdict rules:
- SKIP: price > 25% of income, or would drain savings below 1 month expenses, or clearly irresponsible
- WAIT: price is 5-25% of income, user has goals that conflict, or timing is bad
- BUY: affordable, won't derail goals, user can handle it

Be specific. Reference their actual numbers. Be warm but honest. Don't sugarcoat.${toneBlock}`;

    const userPrompt = `Item: "${item}"
Price: $${price.toLocaleString()}
Monthly income: $${income.toLocaleString()}
Current savings: $${savings.toLocaleString()}
Price-to-income ratio: ${priceToIncomeRatio}%
Savings after purchase: $${savingsAfterPurchase.toLocaleString()}
${goal ? `Financial goal: "${goal}"` : "No specific financial goal set"}

Should they buy this?`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No AI response");

    // Parse JSON from response (handle possible markdown wrapping)
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);

    // Validate
    if (!["BUY", "WAIT", "SKIP"].includes(parsed.verdict)) {
      throw new Error("Invalid verdict from AI");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-verdict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
