import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success:
    "bg-success-100 text-success-800 border border-success-200 dark:bg-success-900/30 dark:text-success-100 dark:border-success-800",
  warning:
    "bg-warning-100 text-warning-900 border border-warning-200 dark:bg-warning-900/30 dark:text-warning-50 dark:border-warning-800",
  danger:
    "bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/20 dark:text-destructive-foreground/90 dark:border-destructive/30",
  info:
    "bg-info-50 text-info-900 border border-info-200 dark:bg-info-900/30 dark:text-info-50 dark:border-info-800",
  neutral:
    "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700",
};

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  className?: string;
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge className={cn(toneStyles[tone], "font-medium", className)}>
      {label}
    </Badge>
  );
}
