import { useMemo } from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { getSuggestedPeriod } from "@/lib/waitPeriod";

interface SyncedHold {
  id: string;
  item: string;
  price: number;
  readyAt: number;
}

export function ExtensionHoldSync() {
  const { user, loading: authLoading } = useAuth();
  const { data: history, isLoading } = usePurchaseHistory();
  const { data: profile } = useUserProfile();

  const payload = useMemo(() => {
    const holds: SyncedHold[] = (history ?? [])
      .filter((decision) => decision.verdict === "WAIT" && !decision.overridden)
      .map((decision) => {
        const hours = getSuggestedPeriod(
          decision.price,
          decision.income,
          "WAIT",
          profile?.archetype ?? null,
        );
        return {
          id: decision.id,
          item: decision.item,
          price: decision.price,
          readyAt: new Date(decision.created_at).getTime() + hours * 60 * 60 * 1000,
        };
      });

    return JSON.stringify({ version: 1, syncedAt: Date.now(), holds });
  }, [history, profile?.archetype]);

  if (authLoading || (user && isLoading)) return null;

  return (
    <script
      id="isb-extension-holds"
      type="application/json"
      data-updated-at={Date.now()}
      dangerouslySetInnerHTML={{ __html: payload.replace(/</g, "\\u003c") }}
    />
  );
}