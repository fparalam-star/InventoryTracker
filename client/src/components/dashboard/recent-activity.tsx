import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeftRight, UserPlus } from "lucide-react";
import type { TransactionWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  activities: TransactionWithDetails[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <ArrowDown className="text-green-600" size={16} />;
      case "outgoing":
        return <ArrowUp className="text-red-600" size={16} />;
      case "transfer":
        return <ArrowLeftRight className="text-orange-600" size={16} />;
      default:
        return <UserPlus className="text-blue-600" size={16} />;
    }
  };

  const getActivityDescription = (activity: TransactionWithDetails) => {
    switch (activity.type) {
      case "incoming":
        return `تم إضافة ${activity.item.name} إلى ${activity.destinationWarehouse?.name} (الكمية: ${activity.quantity})`;
      case "outgoing":
        return `تم إخراج ${activity.item.name} للاستخدام الداخلي (الكمية: ${activity.quantity})`;
      case "transfer":
        return `تم نقل ${activity.item.name} من ${activity.sourceWarehouse?.name} إلى ${activity.destinationWarehouse?.name} (الكمية: ${activity.quantity})`;
      default:
        return `نوع معاملة غير معروف`;
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case "incoming":
        return "تم إضافة عنصر للمخزون";
      case "outgoing":
        return "تم استخدام عنصر داخلياً";
      case "transfer":
        return "نقل عنصر";
      default:
        return "معاملة";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>الأنشطة الحديثة</CardTitle>
        <Button variant="ghost" size="sm">
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">لا توجد أنشطة حديثة</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityTitle(activity.type)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
