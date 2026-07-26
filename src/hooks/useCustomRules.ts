import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CustomRule } from "@/lib/customRules";

export type NewCustomRule = Omit<CustomRule, "id">;

export function useCustomRules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["custom_rules", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CustomRule[]> => {
      const { data, error } = await supabase
        .from("custom_rules")
        .select("id, name, verdict, min_price, max_price, start_hour, end_hour, category, days_of_week, is_active, priority")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        min_price: r.min_price == null ? null : Number(r.min_price),
        max_price: r.max_price == null ? null : Number(r.max_price),
      })) as CustomRule[];
    },
  });
}

export function useSaveRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: NewCustomRule & { id?: string }) => {
      if (!user) throw new Error("Not signed in");
      const payload = { ...rule, user_id: user.id };
      const { error } = rule.id
        ? await supabase.from("custom_rules").update(payload).eq("id", rule.id)
        : await supabase.from("custom_rules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_rules", user?.id] }),
  });
}

export function useToggleRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("custom_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_rules", user?.id] }),
  });
}

export function useDeleteRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_rules", user?.id] }),
  });
}
