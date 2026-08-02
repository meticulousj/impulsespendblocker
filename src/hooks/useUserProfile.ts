import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Archetype } from "@/lib/archetypeConfig";

export interface UserProfile {
  user_id: string;
  archetype: Archetype;
  quiz_completed_at: string;
  emergency_fund_target: number | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, archetype, quiz_completed_at, emergency_fund_target")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...(data as any),
        emergency_fund_target:
          (data as any).emergency_fund_target === null ? null : Number((data as any).emergency_fund_target),
      } as UserProfile;
    },
  });
}

export function useSaveEmergencyFundTarget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (target: number | null) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_profiles")
        .upsert({ user_id: user.id, emergency_fund_target: target }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profile", user?.id] });
    },
  });
}

export function useSaveArchetype() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (archetype: Archetype) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_profiles")
        .upsert(
          { user_id: user.id, archetype, quiz_completed_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profile", user?.id] });
    },
  });
}
