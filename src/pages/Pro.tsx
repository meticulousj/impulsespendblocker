import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Check, Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { ProBadge } from "@/components/ProBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_CONFIG } from "@/lib/stripeConfig";

const perks = [
  "Unlimited AI verdicts — personalised to your income, savings and goals",
  "AI coaching tuned to your spending personality",
  "Weekly category insights and spending patterns",
  "Weekly recap digest of everything you didn't buy",
  "Receipt scanning and smart wait reminders",
  "Cancel any time from the billing portal",
];

export default function Pro() {
  const { user, isPro, subscriptionEnd, refreshSubscription, checkingSubscription } = useAuth();
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const status = params.get("checkout");
    if (!status) return;
    if (status === "success") {
      toast.success("Welcome to Pro! Unlimited AI verdicts unlocked.");
      refreshSubscription();
    } else if (status === "cancel") {
      toast("Checkout cancelled — no charge was made.");
    }
    params.delete("checkout");
    setParams(params, { replace: true });
  }, [params, setParams, refreshSubscription]);

  const startCheckout = async () => {
    if (!user) {
      toast.error("Sign in first to upgrade.");
      return;
    }
    setBusy("checkout");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error || data?.error) throw new Error(data?.error || "Checkout failed");
      if (data?.url) window.location.href = data.url;
      else throw new Error("Checkout failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || data?.error) throw new Error(data?.error || "Portal failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-6 animate-fade-up">
        <PageHeader
          eyebrow="Pro"
          title="Impulse Blocker Pro"
          description="Unlimited AI verdicts for the price of one skipped coffee run."
          icon={Sparkles}
          backTo="/"
          action={isPro ? <ProBadge /> : undefined}
        />

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)] space-y-5">
          <div className="flex items-end gap-1.5">
            <span className="font-mono text-4xl font-bold tracking-tight">$5</span>
            <span className="pb-1 text-sm text-muted-foreground">/ month</span>
          </div>

          <ul className="space-y-2.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                <span className="leading-snug text-foreground/85">{perk}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-sm text-foreground/85">
                You're on Pro
                {subscriptionEnd
                  ? ` — renews ${new Date(subscriptionEnd).toLocaleDateString()}`
                  : ""}
                .
              </div>
              <Button
                onClick={openPortal}
                disabled={busy !== null}
                variant="outline"
                className="w-full rounded-2xl"
              >
                {busy === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Manage subscription
              </Button>
            </div>
          ) : (
            <Button
              onClick={startCheckout}
              disabled={busy !== null || checkingSubscription}
              className="w-full rounded-2xl bg-gradient-primary py-6 text-base font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
            >
              {busy === "checkout" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {user ? `Upgrade to Pro — ${STRIPE_CONFIG.pro.price}` : "Sign in to upgrade"}
            </Button>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Secure payment. Cancel any time.
          </p>
        </div>

        {!isPro && (
          <p className="text-center text-xs text-muted-foreground">
            Free plan includes 3 AI verdicts and unlimited rule-based verdicts.
          </p>
        )}
      </div>
    </div>
  );
}
