import { Sparkles } from "lucide-react";

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
      <Sparkles className="w-2.5 h-2.5" />
      Pro
    </span>
  );
}
