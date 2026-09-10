export interface PendingDecision {
  item: string;
  price: number;
  income: number;
  savings: number;
  goal: string;
  verdict: string;
  overridden: boolean;
  reason: string;
  tip: string;
  category?: string | null;
  goal_id?: string | null;
  contributed_amount?: number;
}

const KEY = "isb_pending_decision";

export function savePendingDecision(decision: PendingDecision) {
  try {
    localStorage.setItem(KEY, JSON.stringify(decision));
  } catch {
    /* ignore */
  }
}

export function readPendingDecision(): PendingDecision | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDecision;
    if (!parsed?.item || typeof parsed.price !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingDecision() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
