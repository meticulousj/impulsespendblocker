import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  backTo?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  backTo,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex items-start gap-3">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Go back"
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] active:scale-[0.96]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        {eyebrow && (
          <p className="eyebrow flex items-center gap-1.5 text-primary">
            {Icon && <Icon className="h-3 w-3" />}
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-[-0.03em]">{title}</h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}
