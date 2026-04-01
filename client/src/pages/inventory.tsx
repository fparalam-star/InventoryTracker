// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddItemModal } from "@/components/modals/add-item-modal";
import { Package, Search, Filter, Plus } from "lucide-react";
import type { ItemWithDetails, Warehouse } from "@shared/schema";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items"],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Filter items based on search and warehouse selection
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedWarehouse === "all") return matchesSearch;
    
    return matchesSearch && item.inventory.some(inv => 
      inv.warehouseId === parseInt(selectedWarehouse)
    );
  });

  const getStockStatus = (item: ItemWithDetails) => {
    if (item.totalQuantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (item.totalQuantity <= item.minStockLevel) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your inventory items and stock levels</p>
        </div>
        <Button onClick={() => setAddItemModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by item name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedWarehouse !== "all" 
                  ? "No items match your search criteria" 
                  : "No inventory items found"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warehouse Distribution</TableHead>
                    <TableHead>Min. Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                              <Package className="text-muted-foreground" size={16} />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.category.name}</TableCell>
                        <TableCell className="font-medium">{item.totalQuantity}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {item.inventory.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No stock</span>
                            ) : (
                              item.inventory.map((inv) => (
                                <div key={inv.id} className="text-sm">
                                  <span className="font-medium">{inv.warehouse.name}</span>: {inv.quantity}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.minStockLevel}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddItemModal 
        open={addItemModalOpen} 
        onOpenChange={setAddItemModalOpen} 
      />
    </div>
  );
}
