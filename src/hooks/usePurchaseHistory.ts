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
    },
  });
}
