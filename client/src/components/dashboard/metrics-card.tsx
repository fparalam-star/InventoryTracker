import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  iconBgColor?: string;
}

export function MetricsCard({ 
  title, 
  value, 
  icon, 
  trend,
  iconBgColor = "bg-blue-100" 
}: MetricsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
            {trend && (
              <p className={`text-sm mt-2 flex items-center ${
                trend.isPositive ? "text-green-600" : "text-orange-600"
              }`}>
                {trend.isPositive ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : (
                  <TrendingDown size={14} className="mr-1" />
                )}
                <span>{trend.label}</span>
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
