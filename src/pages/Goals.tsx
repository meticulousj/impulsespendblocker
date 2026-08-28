import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Target, Trash2, Pencil, Star, StarOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  useSavingsGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useSetActiveGoal,
  GOAL_TYPES,
  type GoalType,
  type SavingsGoalWithProgress,
} from "@/hooks/useSavingsGoals";
import { useUserProfile, useSaveEmergencyFundTarget } from "@/hooks/useUserProfile";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const inputClass = "field-input";

function GoalDialog({
  trigger,
  initial,
  onSubmit,
  title,
}: {
  trigger: React.ReactNode;
  initial?: { name: string; target_amount: number; deadline: string | null; goal_type: GoalType };
  onSubmit: (v: {
    name: string;
    target_amount: number;
    deadline: string | null;
    goal_type: GoalType;
  }) => Promise<void> | void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial ? String(initial.target_amount) : "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [goalType, setGoalType] = useState<GoalType>(initial?.goal_type ?? "vacation");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(target);
    if (!name.trim() || !amount || amount <= 0) return;
    await onSubmit({
      name: name.trim(),
      target_amount: amount,
      deadline: deadline || null,
      goal_type: goalType,
    });
    setOpen(false);
    if (!initial) {
      setName("");
      setTarget("");
      setDeadline("");
      setGoalType("vacation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Link your skipped purchases to something you actually want.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Goal type
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setGoalType(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    goalType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Goal name
            </label>
            <input
              className={inputClass}
              placeholder="Japan trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Target ($)
              </label>
              <input
                type="number"
                className={`${inputClass} font-mono`}
                placeholder="5000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                min="1"
                step="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Deadline (optional)
              </label>
              <input
                type="date"
                className={`${inputClass} font-mono`}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-xl w-full sm:w-auto">
              Save goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal }: { goal: SavingsGoalWithProgress }) {
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const setActive = useSetActiveGoal();

  return (
    <div
      className={`bento-tile bento-tile-hover space-y-4 ${
        goal.is_active ? "border-verdict-buy/30 bg-accent" : ""
      }`}
    >
      <GoalProgressBar goal={goal} />
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
        <button
          onClick={() => {
            setActive.mutate(goal.is_active ? null : goal.id, {
              onSuccess: () =>
                toast.success(goal.is_active ? "Goal deactivated" : `Now tracking "${goal.name}"`),
            });
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            goal.is_active
              ? "text-verdict-buy hover:bg-verdict-buy/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title={goal.is_active ? "Deactivate" : "Set as active goal"}
        >
          {goal.is_active ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
          {goal.is_active ? "Active" : "Set active"}
        </button>
        <GoalDialog
          title="Edit goal"
          initial={{
            name: goal.name,
            target_amount: goal.target_amount,
            deadline: goal.deadline,
            goal_type: goal.goal_type ?? "other",
          }}
          onSubmit={async (v) => {
            await update.mutateAsync({ id: goal.id, patch: v });
            toast.success("Goal updated");
          }}
          trigger={
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-verdict-skip transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{goal.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Past contributions stay in your history but won't be tracked anywhere.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl"
                onClick={() => del.mutate(goal.id, { onSuccess: () => toast.success("Goal deleted") })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function EmergencyFundCard() {
  const { data: profile } = useUserProfile();
  const save = useSaveEmergencyFundTarget();
  const [value, setValue] = useState<string | null>(null);
  const current = profile?.emergency_fund_target ?? null;
  const shown = value ?? (current !== null ? String(current) : "");

  return (
    <div className="bento-tile space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="font-display text-sm font-bold">Emergency fund target</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Used in the "If you don't buy this…" panel to show how close each skip gets you to a full safety net.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = shown.trim() === "" ? null : parseFloat(shown);
          if (parsed !== null && (!isFinite(parsed) || parsed <= 0)) return;
          save.mutate(parsed, { onSuccess: () => toast.success("Emergency fund target saved") });
        }}
      >
        <input
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          placeholder="10000"
          className={`${inputClass} font-mono`}
          value={shown}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" className="rounded-xl shrink-0" disabled={save.isPending}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default function Goals() {
  const { user, loading } = useAuth();
  const { data: goals, isLoading } = useSavingsGoals();
  const create = useCreateGoal();

  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="underline">Sign in</Link> to track savings goals.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="w-full max-w-md mx-auto space-y-6">
        <PageHeader
          eyebrow="Goals"
          icon={Target}
          title="Savings goals"
          description="Every SKIP you honor stacks toward what you actually want."
          backTo="/"
          action={
            <GoalDialog
              title="New savings goal"
              onSubmit={async (v) => {
                await create.mutateAsync(v);
                toast.success(`"${v.name}" created`);
              }}
              trigger={
                <Button size="sm" className="rounded-2xl shadow-[var(--shadow-glow)]">
                  <Plus className="w-4 h-4" />
                  New
                </Button>
              }
            />
          }
        />

        <EmergencyFundCard />

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : !goals || goals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No goals yet. Add your first — a trip, an emergency fund, anything.
            </p>
            <GoalDialog
              title="New savings goal"
              onSubmit={async (v) => {
                await create.mutateAsync(v);
                toast.success(`"${v.name}" created`);
              }}
              trigger={
                <Button className="rounded-xl">
                  <Plus className="w-4 h-4" />
                  Create a goal
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}