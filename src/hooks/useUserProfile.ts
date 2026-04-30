import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Archetype } from "@/lib/archetypeConfig";

export interface UserProfile {
  user_id: string;
  archetype: Archetype;
  quiz_completed_at: string;
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
        .select("user_id, archetype, quiz_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserProfile | null) ?? null;
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
