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
import { Package } from "lucide-react";
import type { InventoryWithDetails } from "@shared/schema";

interface LowStockTableProps {
  lowStockItems: InventoryWithDetails[];
}

export function LowStockTable({ lowStockItems }: LowStockTableProps) {
  const getStockBadgeVariant = (current: number, min: number) => {
    if (current === 0) return "destructive";
    if (current <= min / 2) return "destructive";
    if (current <= min) return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Low Stock Alerts</CardTitle>
        <Badge variant="destructive">{lowStockItems.length} Items</Badge>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No low stock items</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min. Required</TableHead>
                  <TableHead>Action</TableHead>
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
                          <div className="text-sm text-muted-foreground">SKU: {item.item.sku}</div>
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
                        <Button size="sm" variant="outline">
                          Reorder
                        </Button>
                        <Button size="sm" variant="outline">
                          Transfer
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
