import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
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
import { TransactionModal } from "@/components/modals/transaction-modal";
import { TransferModal } from "@/components/modals/transfer-modal";
import { EditTransactionModal } from "@/components/modals/edit-transaction-modal";
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  User,
  Edit2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TransactionWithDetails } from "@shared/schema";

export default function Transactions() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);

  const { data: transactions = [], isLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on search, type, date range, and user role
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || transaction.type === selectedType;
    
    let matchesDateRange = true;
    if (startDate && endDate) {
      const transactionDate = new Date(transaction.transactionDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      matchesDateRange = transactionDate >= start && transactionDate <= end;
    }
    
    // For data entry users, only show transactions from their assigned warehouse
    let matchesWarehouse = true;
    if (user?.role === "data_entry" && user?.warehouseId) {
      matchesWarehouse = transaction.sourceWarehouseId === user.warehouseId || 
                        transaction.destinationWarehouseId === user.warehouseId;
    }
    
    return matchesSearch && matchesType && matchesDateRange && matchesWarehouse;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <ArrowDown className="text-green-600" size={16} />;
      case "outgoing":
        return <ArrowUp className="text-red-600" size={16} />;
      case "transfer":
        return <ArrowLeftRight className="text-orange-600" size={16} />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "incoming":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">وارد</Badge>;
      case "outgoing":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">صادر</Badge>;
      case "transfer":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">نقل</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getTransactionDescription = (transaction: TransactionWithDetails) => {
    switch (transaction.type) {
      case "incoming":
        return `من ${transaction.supplier?.name || "مورد غير معروف"} إلى ${transaction.destinationWarehouse?.name}`;
      case "outgoing":
        return `من ${transaction.sourceWarehouse?.name} للاستخدام الداخلي`;
      case "transfer":
        return `من ${transaction.sourceWarehouse?.name} إلى ${transaction.destinationWarehouse?.name}`;
      default:
        return "معاملة غير معروفة";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل المعاملات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تاريخ المعاملات</h1>
          <p className="text-muted-foreground">تتبع جميع حركات المخزون والمعاملات</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setTransactionModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            إضافة معاملة
          </Button>
          <Button variant="outline" onClick={() => setTransferModalOpen(true)}>
            <ArrowLeftRight size={16} className="mr-2" />
            نقل العناصر
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            المرشحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="البحث في المعاملات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="incoming">وارد</SelectItem>
                <SelectItem value="outgoing">صادر</SelectItem>
                <SelectItem value="transfer">نقل</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="date"
                placeholder="تاريخ البداية"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="date"
                placeholder="تاريخ النهاية"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>المعاملات ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== "all" || startDate || endDate
                  ? "لا توجد معاملات تطابق معايير البحث" 
                  : "لم يتم العثور على معاملات"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>العنصر</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>التفاصيل</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الملاحظات</TableHead>
                    {user?.role === "admin" && <TableHead>الإجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          {getTransactionBadge(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.item.name}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.type === "outgoing" ? "-" : "+"}{transaction.quantity}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getTransactionDescription(transaction)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-muted-foreground" />
                          <span className="text-sm">
                            {transaction.user.firstName} {transaction.user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(transaction.transactionDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.notes && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {transaction.notes}
                          </div>
                        )}
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setEditModalOpen(true);
                            }}
                            className="gap-1"
                          >
                            <Edit2 size={14} />
                            تعديل
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionModal 
        open={transactionModalOpen} 
        onOpenChange={setTransactionModalOpen} 
      />
      
      <TransferModal 
        open={transferModalOpen} 
        onOpenChange={setTransferModalOpen} 
      />
      
      <EditTransactionModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
}
