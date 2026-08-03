import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PurchaseDecision {
  id: string;
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
  verdict: string;
  overridden: boolean;
  reason: string;
  tip: string;
  created_at: string;
  category?: string | null;
  decision_hour?: number | null;
  decision_dow?: number | null;
  goal_id?: string | null;
  contributed_amount?: number;
}

export function usePurchaseHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchase_decisions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_decisions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseDecision[];
    },
    enabled: !!user,
  });
}

export function useSaveDecision() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (decision: Omit<PurchaseDecision, "id" | "created_at" | "decision_hour" | "decision_dow">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("purchase_decisions").insert({
        ...decision,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_decisions"] });
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}

export function useDecision(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchase_decision", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<PurchaseDecision | null> => {
      const { data, error } = await supabase
        .from("purchase_decisions")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as PurchaseDecision) ?? null;
    },
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<PurchaseDecision, "verdict" | "overridden">>;
    }) => {
      const { error } = await supabase.from("purchase_decisions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_decisions"] });
      qc.invalidateQueries({ queryKey: ["purchase_decision"] });
    },
  });
}

export function useDeleteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_decisions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_decisions"] });
    },
  });
}
