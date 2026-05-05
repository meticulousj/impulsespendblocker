import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InsightItem {
  headline: string;
  detail: string;
  severity: "info" | "warn" | "alert";
}

export interface CategoryStat {
  count: number;
  total: number;
  avoided: number;
}

export interface WeeklyDigest {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  insights: InsightItem[];
  category_breakdown: Record<string, CategoryStat>;
  generated_at: string;
}

export function useLatestDigest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["weekly_digest_latest", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_digests")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as WeeklyDigest | null;
    },
    enabled: !!user,
  });
}

export function useRefreshInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-insights", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly_digest_latest"] });
    },
  });
}