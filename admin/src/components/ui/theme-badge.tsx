import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ThemeBadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  secondary: "bg-muted text-muted-foreground"
}

export function ThemeBadge({ variant = 'secondary', children, className }: ThemeBadgeProps) {
  return (
    <Badge className={cn(variantStyles[variant], className)}>
      {children}
    </Badge>
  )
}