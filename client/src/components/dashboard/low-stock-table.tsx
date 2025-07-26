import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, ArrowUpDown } from "lucide-react";
import type { InventoryWithDetails } from "@shared/schema";

interface LowStockTableProps {
  lowStockItems: InventoryWithDetails[];
  onReorder: (item: InventoryWithDetails) => void;
  onTransfer: (item: InventoryWithDetails) => void;
}

export function LowStockTable({ lowStockItems, onReorder, onTransfer }: LowStockTableProps) {
  const getStockBadgeVariant = (current: number, min: number) => {
    if (current === 0) return "destructive";
    if (current <= min / 2) return "destructive";
    if (current <= min) return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>تنبيهات نقص المخزون</CardTitle>
        <Badge variant="destructive">{lowStockItems.length} عنصر</Badge>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد عناصر منخفضة المخزون</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنصر</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المستودع</TableHead>
                  <TableHead>المخزون الحالي</TableHead>
                  <TableHead>الحد الأدنى المطلوب</TableHead>
                  <TableHead>الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={`${item.itemId}-${item.warehouseId}`}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                          <Package className="text-muted-foreground" size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{item.item.name}</div>

                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.item.category.name}</TableCell>
                    <TableCell className="text-sm">{item.warehouse.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStockBadgeVariant(item.quantity, item.item.minStockLevel)}>
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.item.minStockLevel}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onReorder(item)}
                          className="flex items-center gap-1"
                        >
                          <Plus size={14} />
                          إعادة طلب
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onTransfer(item)}
                          className="flex items-center gap-1"
                        >
                          <ArrowUpDown size={14} />
                          نقل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
