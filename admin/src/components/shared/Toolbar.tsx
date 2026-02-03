import { cn } from "@/lib/utils";

interface ToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function Toolbar({ left, right, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card/80 p-3 sm:p-4 shadow-sm",
        className
      )}
    >
      {left && <div className="flex-1">{left}</div>}
      {right && (
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {right}
        </div>
      )}
    </div>
  );
}
