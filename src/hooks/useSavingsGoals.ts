import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  is_active: boolean;
  goal_type: GoalType;
  created_at: string;
  updated_at: string;
}

export type GoalType = "vacation" | "house" | "debt" | "emergency" | "other";

export const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "vacation", label: "Vacation" },
  { value: "house", label: "House" },
  { value: "debt", label: "Debt payoff" },
  { value: "emergency", label: "Emergency fund" },
  { value: "other", label: "Other" },
];

export interface GoalProgress {
  saved: number;
  count: number;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  progress: GoalProgress;
  percent: number;
}

export function useSavingsGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savings_goals", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavingsGoalWithProgress[]> => {
      const [{ data: goals, error: gErr }, { data: contribs, error: cErr }] = await Promise.all([
        supabase
          .from("savings_goals")
          .select("*")
          .order("is_active", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("purchase_decisions")
          .select("goal_id, contributed_amount")
          .not("goal_id", "is", null)
          .gt("contributed_amount", 0),
      ]);
      if (gErr) throw gErr;
      if (cErr) throw cErr;

      const byGoal = new Map<string, GoalProgress>();
      (contribs ?? []).forEach((row: any) => {
        const id = row.goal_id as string;
        const amt = Number(row.contributed_amount) || 0;
        const cur = byGoal.get(id) ?? { saved: 0, count: 0 };
        cur.saved += amt;
        cur.count += 1;
        byGoal.set(id, cur);
      });

      return (goals ?? []).map((g: any) => {
        const progress = byGoal.get(g.id) ?? { saved: 0, count: 0 };
        const target = Number(g.target_amount) || 0;
        const percent = target > 0 ? Math.min(100, (progress.saved / target) * 100) : 0;
        return {
          ...g,
          target_amount: Number(g.target_amount),
          progress,
          percent,
        } as SavingsGoalWithProgress;
      });
    },
  });
}

export function useActiveGoal() {
  const { data } = useSavingsGoals();
  return useMemo(
    () => (data ?? []).find((g) => g.is_active) ?? null,
    [data],
  );
}

export function useCreateGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      target_amount: number;
      deadline?: string | null;
      is_active?: boolean;
      goal_type?: GoalType;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("savings_goals").insert({
        user_id: user.id,
        name: input.name,
        target_amount: input.target_amount,
        deadline: input.deadline ?? null,
        is_active: input.is_active ?? true,
        goal_type: input.goal_type ?? "other",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<SavingsGoal, "name" | "target_amount" | "deadline" | "is_active" | "goal_type">>;
    }) => {
      const { error } = await supabase.from("savings_goals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
  });
}

export function useSetActiveGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | null) => {
      if (!user) throw new Error("Not authenticated");
      // Deactivate all, then activate the chosen one
      const { error: e1 } = await supabase
        .from("savings_goals")
        .update({ is_active: false })
        .eq("user_id", user.id);
      if (e1) throw e1;
      if (id) {
        const { error: e2 } = await supabase
          .from("savings_goals")
          .update({ is_active: true })
          .eq("id", id);
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings_goals"] }),
  });
}