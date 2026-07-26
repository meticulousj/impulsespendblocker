import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Gavel, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { useCustomRules, useSaveRule, useToggleRule, useDeleteRule } from "@/hooks/useCustomRules";
import { describeRule, DAY_LABELS, HOUR_OPTIONS, type CustomRule } from "@/lib/customRules";
import { CATEGORIES } from "@/lib/categoryClassifier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Draft = {
  name: string;
  verdict: "BUY" | "WAIT" | "SKIP";
  min_price: string;
  max_price: string;
  start_hour: string;
  end_hour: string;
  category: string;
  days: number[];
};

const emptyDraft: Draft = {
  name: "",
  verdict: "SKIP",
  min_price: "",
  max_price: "",
  start_hour: "",
  end_hour: "",
  category: "",
  days: [],
};

const PRESETS: { label: string; draft: Draft }[] = [
  {
    label: "Always SKIP anything >$50 after 10pm",
    draft: { ...emptyDraft, name: "Late-night big spends", verdict: "SKIP", min_price: "50", start_hour: "22", end_hour: "6" },
  },
  {
    label: "Always WAIT on gadgets over $200",
    draft: { ...emptyDraft, name: "Gadget cooling-off", verdict: "WAIT", min_price: "200", category: "Gadgets" },
  },
  {
    label: "Always BUY food under $20",
    draft: { ...emptyDraft, name: "Cheap eats are fine", verdict: "BUY", max_price: "20", category: "Food" },
  },
];

const verdictStyles: Record<string, string> = {
  BUY: "text-verdict-buy border-verdict-buy/30 bg-verdict-buy/10",
  WAIT: "text-verdict-wait border-verdict-wait/30 bg-verdict-wait/10",
  SKIP: "text-verdict-skip border-verdict-skip/30 bg-verdict-skip/10",
};

export default function Rules() {
  const { user } = useAuth();
  const { data: rules, isLoading } = useCustomRules();
  const saveRule = useSaveRule();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();
  const [draft, setDraft] = useState<Draft | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  const handleSave = () => {
    if (!draft) return;
    const min_price = num(draft.min_price);
    const max_price = num(draft.max_price);
    const start_hour = num(draft.start_hour);
    const end_hour = num(draft.end_hour);

    if ((start_hour == null) !== (end_hour == null)) {
      toast.error("Set both a start and an end hour, or neither.");
      return;
    }
    if (min_price == null && max_price == null && !draft.category && !draft.days.length && start_hour == null) {
      toast.error("Add at least one condition so the rule can match something.");
      return;
    }
    if (min_price != null && max_price != null && min_price > max_price) {
      toast.error("Minimum price can't be above maximum price.");
      return;
    }

    saveRule.mutate(
      {
        name: draft.name.trim() || "My rule",
        verdict: draft.verdict,
        min_price,
        max_price,
        start_hour,
        end_hour,
        category: draft.category || null,
        days_of_week: draft.days.length ? draft.days : null,
        is_active: true,
        priority: 0,
      },
      {
        onSuccess: () => {
          toast.success("Rule saved — it now overrides verdicts.");
          setDraft(null);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save rule"),
      }
    );
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-semibold">Custom rules</h1>
        <p className="text-sm text-muted-foreground">
          Your own hard limits. Matching purchases get your verdict — no debate.
        </p>
      </header>

      {!user ? (
        <AuthForm />
      ) : (
        <>
          {!draft && (
            <>
              <section className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick start
                </p>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setDraft(p.draft)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                      {p.label}
                    </span>
                    <span className="text-muted-foreground">+</span>
                  </button>
                ))}
              </section>

              <Button onClick={() => setDraft(emptyDraft)} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                New custom rule
              </Button>
            </>
          )}

          {draft && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New rule
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="rule-name">Rule name</Label>
                <Input
                  id="rule-name"
                  value={draft.name}
                  placeholder="Late-night big spends"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Force verdict</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["BUY", "WAIT", "SKIP"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("verdict", v)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                        draft.verdict === v ? verdictStyles[v] : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min-price">Price over ($)</Label>
                  <Input id="min-price" inputMode="decimal" value={draft.min_price}
                    onChange={(e) => set("min_price", e.target.value)} placeholder="50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-price">Price under ($)</Label>
                  <Input id="max-price" inputMode="decimal" value={draft.max_price}
                    onChange={(e) => set("max_price", e.target.value)} placeholder="any" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-hour">From</Label>
                  <select
                    id="start-hour"
                    value={draft.start_hour}
                    onChange={(e) => set("start_hour", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any time</option>
                    {HOUR_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-hour">Until</Label>
                  <select
                    id="end-hour"
                    value={draft.end_hour}
                    onChange={(e) => set("end_hour", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any time</option>
                    {HOUR_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule-category">Category</Label>
                <select
                  id="rule-category"
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Any category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Days</Label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((d, i) => {
                    const on = draft.days.includes(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          set("days", on ? draft.days.filter((x) => x !== i) : [...draft.days, i])
                        }
                        className={`flex-1 rounded-lg border px-1 py-1.5 text-[10px] font-medium transition-colors ${
                          on ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">Leave blank for every day.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSave} disabled={saveRule.isPending} className="flex-1">
                  {saveRule.isPending ? "Saving…" : "Save rule"}
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your rules
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !rules?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-2">
                <Gavel className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No rules yet. Add one above and it will override every verdict it matches.
                </p>
              </div>
            ) : (
              rules.map((rule: CustomRule) => (
                <div key={rule.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{describeRule(rule)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${verdictStyles[rule.verdict]}`}>
                      {rule.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, is_active: v })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {rule.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteRule.mutate(rule.id, { onSuccess: () => toast.success("Rule deleted") })}
                      className="text-muted-foreground hover:text-verdict-skip transition-colors"
                      aria-label={`Delete rule ${rule.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      <p className="text-center">
        <Link to="/profile" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to profile
        </Link>
      </p>
    </div>
  );
}
