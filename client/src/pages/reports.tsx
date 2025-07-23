import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileBarChart, 
  Download, 
  Calendar,
  Building2,
  Package,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight
} from "lucide-react";
import type { 
  TransactionWithDetails, 
  InventoryWithDetails, 
  ItemWithDetails,
  Warehouse 
} from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("inventory");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Fetch data for reports
  const { data: transactions = [] } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: inventory = [] } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: items = [] } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items"],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Filter data based on selected filters and user role
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      let matchesDateRange = true;
      if (startDate && endDate) {
        const transactionDate = new Date(transaction.transactionDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = transactionDate >= start && transactionDate <= end;
      }
      
      let matchesWarehouse = true;
      
      // For data entry users, only show transactions from their assigned warehouse
      if (user?.role === "data_entry" && user?.assignedWarehouseId) {
        matchesWarehouse = transaction.sourceWarehouseId === user.assignedWarehouseId || 
                          transaction.destinationWarehouseId === user.assignedWarehouseId;
      } else if (selectedWarehouse !== "all") {
        const warehouseId = parseInt(selectedWarehouse);
        matchesWarehouse = transaction.sourceWarehouseId === warehouseId || 
                          transaction.destinationWarehouseId === warehouseId;
      }
      
      return matchesDateRange && matchesWarehouse;
    });
  };

  const getFilteredInventory = () => {
    // For data entry users, only show inventory from their assigned warehouse
    if (user?.role === "data_entry" && user?.assignedWarehouseId) {
      return inventory.filter(inv => inv.warehouseId === user.assignedWarehouseId);
    }
    
    if (selectedWarehouse === "all") return inventory;
    return inventory.filter(inv => inv.warehouseId === parseInt(selectedWarehouse));
  };

  const getFilteredItems = () => {
    // For data entry users, only show items from their assigned warehouse
    if (user?.role === "data_entry" && user?.assignedWarehouseId) {
      return items.filter(item => 
        item.inventory.some(inv => inv.warehouseId === user.assignedWarehouseId)
      );
    }
    
    if (selectedWarehouse === "all") return items;
    return items.filter(item => 
      item.inventory.some(inv => inv.warehouseId === parseInt(selectedWarehouse))
    );
  };

  const generateCSVData = () => {
    switch (reportType) {
      case "inventory":
        const inventoryData = getFilteredInventory();
        return {
          headers: ["اسم العنصر", "الفئة", "المستودع", "الكمية", "الحد الأدنى"],
          rows: inventoryData.map(inv => [
            inv.item.name,
            inv.item.category.name,
            inv.warehouse.name,
            inv.quantity.toString(),
            inv.item.minStockLevel.toString()
          ])
        };

      case "items":
        const itemsData = getFilteredItems();
        return {
          headers: ["اسم العنصر", "الفئة", "إجمالي المخزون", "الحد الأدنى", "الحالة"],
          rows: itemsData.map(item => [
            item.name,
            item.category.name,
            item.totalQuantity.toString(),
            item.minStockLevel.toString(),
            item.totalQuantity <= item.minStockLevel ? "مخزون منخفض" : "متوفر"
          ])
        };
      
      case "transactions":
        const transactionData = getFilteredTransactions();
        return {
          headers: ["التاريخ", "النوع", "العنصر", "الكمية", "المستخدم", "المصدر", "الوجهة", "الملاحظات"],
          rows: transactionData.map(trans => [
            new Date(trans.transactionDate).toLocaleDateString(),
            trans.type,
            trans.item.name,
            trans.quantity.toString(),
            `${trans.user.firstName} ${trans.user.lastName}`,
            trans.sourceWarehouse?.name || "-",
            trans.destinationWarehouse?.name || "-",
            trans.notes || "-"
          ])
        };
      
      case "lowstock":
        const lowStockData = getFilteredInventory().filter(inv => 
          inv.quantity <= inv.item.minStockLevel
        );
        return {
          headers: ["اسم العنصر", "المستودع", "المخزون الحالي", "الحد الأدنى", "النقص"],
          rows: lowStockData.map(inv => [
            inv.item.name,
            inv.warehouse.name,
            inv.quantity.toString(),
            inv.item.minStockLevel.toString(),
            (inv.item.minStockLevel - inv.quantity).toString()
          ])
        };
      
      default:
        return { headers: [], rows: [] };
    }
  };

  const downloadCSV = () => {
    const { headers, rows } = generateCSVData();
    // Add BOM (Byte Order Mark) for proper UTF-8 encoding in Excel and other programs
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReportContent = () => {
    switch (reportType) {
      case "inventory":
        const inventoryData = getFilteredInventory();
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنصر</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData.map((inv) => (
                <TableRow key={`${inv.itemId}-${inv.warehouseId}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{inv.item.name}</div>
                      
                    </div>
                  </TableCell>
                  <TableCell>{inv.item.category.name}</TableCell>
                  <TableCell>{inv.warehouse.name}</TableCell>
                  <TableCell className="font-medium">{inv.quantity}</TableCell>
                  <TableCell>
                    {inv.quantity <= inv.item.minStockLevel ? (
                      <Badge variant="destructive">مخزون منخفض</Badge>
                    ) : (
                      <Badge variant="default">متوفر</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "items":
        const itemsReportData = getFilteredItems();
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنصر</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>إجمالي المخزون</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>عدد المستودعات</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsReportData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{item.category.name}</TableCell>
                  <TableCell className="font-medium">{item.totalQuantity}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>{item.inventory.length}</TableCell>
                  <TableCell>
                    {item.totalQuantity <= item.minStockLevel ? (
                      <Badge variant="destructive">مخزون منخفض</Badge>
                    ) : (
                      <Badge variant="default">متوفر</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "transactions":
        const transactionData = getFilteredTransactions();
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العنصر</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionData
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((trans) => (
                <TableRow key={trans.id}>
                  <TableCell>{new Date(trans.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {trans.type === "incoming" && <ArrowDown className="text-green-600" size={16} />}
                      {trans.type === "outgoing" && <ArrowUp className="text-red-600" size={16} />}
                      {trans.type === "transfer" && <ArrowLeftRight className="text-orange-600" size={16} />}
                      <span className="capitalize">
                        {trans.type === "incoming" ? "وارد" : trans.type === "outgoing" ? "صادر" : "تحويل"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{trans.item.name}</div>
                  </TableCell>
                  <TableCell className="font-medium">{trans.quantity}</TableCell>
                  <TableCell>{trans.user.firstName} {trans.user.lastName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {trans.type === "incoming" && `From ${trans.supplier?.name} to ${trans.destinationWarehouse?.name}`}
                    {trans.type === "outgoing" && `From ${trans.sourceWarehouse?.name}`}
                    {trans.type === "transfer" && `${trans.sourceWarehouse?.name} → ${trans.destinationWarehouse?.name}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "lowstock":
        const lowStockData = getFilteredInventory().filter(inv => 
          inv.quantity <= inv.item.minStockLevel
        );
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنصر</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead>المخزون الحالي</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>النقص</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockData.map((inv) => (
                <TableRow key={`${inv.itemId}-${inv.warehouseId}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{inv.item.name}</div>
                      
                    </div>
                  </TableCell>
                  <TableCell>{inv.warehouse.name}</TableCell>
                  <TableCell className="font-medium">{inv.quantity}</TableCell>
                  <TableCell>{inv.item.minStockLevel}</TableCell>
                  <TableCell className="text-red-600 font-medium">
                    {inv.item.minStockLevel - inv.quantity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.quantity === 0 ? "destructive" : "secondary"}>
                      {inv.quantity === 0 ? "نفد المخزون" : "مخزون منخفض"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return <div>اختر نوع التقرير</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير والتحليلات</h1>
          <p className="text-muted-foreground">إنشاء وتصدير تقارير المخزون</p>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>إعداد التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === "admin" ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">تقرير المخزون</SelectItem>
                  <SelectItem value="items">تقرير العناصر</SelectItem>
                  <SelectItem value="transactions">تاريخ المعاملات</SelectItem>
                  <SelectItem value="lowstock">تقرير المخزون المنخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user?.role === "admin" && (
              <div>
                <Label htmlFor="warehouse">المستودع</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستودعات</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate">تاريخ النهاية</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={downloadCSV} className="w-full">
                <Download size={16} className="mr-2" />
                تصدير CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العناصر</p>
                <p className="text-2xl font-bold">{getFilteredItems().length}</p>
              </div>
              <Package className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                <p className="text-2xl font-bold">{getFilteredTransactions().length}</p>
              </div>
              <ArrowLeftRight className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عناصر المخزون المنخفض</p>
                <p className="text-2xl font-bold text-red-600">
                  {getFilteredInventory().filter(inv => inv.quantity <= inv.item.minStockLevel).length}
                </p>
              </div>
              <FileBarChart className="text-red-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart size={20} />
            {reportType === "inventory" && "تقرير المخزون"}
            {reportType === "items" && "تقرير العناصر"}
            {reportType === "transactions" && "تاريخ المعاملات"}
            {reportType === "lowstock" && "تقرير المخزون المنخفض"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            {renderReportContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
