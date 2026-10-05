import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, CreditCard, Sparkles, User2, Type, Wand2, Download, Share2, Gavel, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile, useSaveHourlyWage } from "@/hooks/useUserProfile";
import { ARCHETYPES } from "@/lib/archetypeConfig";
import { TextSizeToggle } from "@/components/TextSizeToggle";
import { PersonalityQuiz } from "@/components/PersonalityQuiz";
import { AuthForm } from "@/components/AuthForm";
import { ProBadge } from "@/components/ProBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut, isPro } = useAuth();
  const { data: profile } = useUserProfile();
  const archetype = profile?.archetype ?? null;
  const [quizOpen, setQuizOpen] = useState(false);
  const saveWage = useSaveHourlyWage();
  const [wage, setWage] = useState("");

  useEffect(() => {
    setWage(profile?.hourly_wage != null ? String(profile.hourly_wage) : "");
  }, [profile?.hourly_wage]);

  const handleSaveWage = () => {
    const parsed = wage.trim() === "" ? null : parseFloat(wage);
    if (parsed !== null && (!isFinite(parsed) || parsed <= 0)) {
      toast.error("Enter an hourly wage greater than 0");
      return;
    }
    saveWage.mutate(parsed, {
      onSuccess: () =>
        toast.success(parsed ? `Time cost now uses $${parsed}/hour` : "Back to estimating from your income"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
    });
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error || data?.error) throw new Error(data?.error || "Checkout failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || data?.error) throw new Error(data?.error || "Portal failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open subscription portal");
    }
  };

  const handleDownloadExtension = (browser: "chrome" | "firefox" = "chrome") => {
    const file = browser === "firefox" ? "impulse-blocker-firefox.zip" : "impulse-blocker-extension.zip";
    fetch(`/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(
          browser === "firefox"
            ? "Downloaded. Unzip and load it from about:debugging in Firefox."
            : "Extension downloaded. Unzip and load it in chrome://extensions."
        );
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account, saved settings, and plan.
        </p>
      </header>

      {!user ? (
        <AuthForm />
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {isPro ? "Pro member" : "Free plan"}
                </p>
              </div>
              {isPro && <ProBadge />}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Subscription
            </p>
            {isPro ? (
              <button
                onClick={handleManageSubscription}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Manage subscription
                </span>
                <span className="text-muted-foreground">→</span>
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro — $5/mo
              </button>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Time cost
            </p>
            <label className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4" />
              Your hourly wage
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                  placeholder="28"
                  className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <button
                onClick={handleSaveWage}
                disabled={saveWage.isPending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Used to turn prices into "hours of work". Leave blank to estimate from your monthly income
              (160 h/month).
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Personality
            </p>
            <button
              onClick={() => setQuizOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                {archetype
                  ? `${ARCHETYPES[archetype].emoji} ${ARCHETYPES[archetype].label}`
                  : "Take the quiz"}
              </span>
              <span className="text-muted-foreground">
                {archetype ? "Retake" : "Start"} →
              </span>
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accessibility
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Custom rules
            </p>
            <Link
              to="/rules"
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Manage my rules
              </span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              e.g. "Always SKIP anything over $50 after 10pm." Rules override every verdict they match.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accessibility
            </p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Type className="w-4 h-4" />
                Text size
              </span>
              <TextSizeToggle />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Analyze anywhere
            </p>
            <button
              onClick={() => handleDownloadExtension("chrome")}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Chrome extension
              </span>
              <span className="text-muted-foreground">.zip →</span>
            </button>
            <button
              onClick={() => handleDownloadExtension("firefox")}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Firefox extension
              </span>
              <span className="text-muted-foreground">.zip →</span>
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pops up automatically on product, cart & checkout pages at Amazon, Shopify stores,
              eBay, Etsy, Target, Best Buy & Walmart — with price, hours of work and a
              BUY / WAIT / SKIP verdict. Set your wage and income in the extension popup.
              Chrome: unzip → chrome://extensions → Load unpacked. Firefox: unzip →
              about:debugging → This Firefox → Load Temporary Add-on → pick manifest.json.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
              <Share2 className="w-4 h-4 text-primary shrink-0" />
              <span>
                On iOS/Android: open this app in your browser, tap Share → Add to Home Screen.
                Then share any product page → Impulse Blocker.
              </span>
            </div>
          </section>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </>
      )}

      <p className="text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </p>

      <PersonalityQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}