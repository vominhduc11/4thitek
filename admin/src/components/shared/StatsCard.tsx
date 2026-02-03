import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: LucideIcon;
  iconColor: string;
}

export function StatsCard({ title, value, change, icon: Icon, iconColor }: StatsCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="flex items-center text-sm">
            <span className={`font-medium ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.value}
            </span>
            <span className="text-muted-foreground ml-1">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
