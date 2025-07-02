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
        return `${activity.item.name} added to ${activity.destinationWarehouse?.name} (Qty: ${activity.quantity})`;
      case "outgoing":
        return `${activity.item.name} removed for internal use (Qty: ${activity.quantity})`;
      case "transfer":
        return `${activity.item.name} transferred from ${activity.sourceWarehouse?.name} to ${activity.destinationWarehouse?.name} (Qty: ${activity.quantity})`;
      default:
        return `Unknown transaction type`;
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case "incoming":
        return "Item Added to Inventory";
      case "outgoing":
        return "Item Used Internally";
      case "transfer":
        return "Item Transfer";
      default:
        return "Transaction";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activities</p>
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
