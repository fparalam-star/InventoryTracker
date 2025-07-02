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
import { TransactionModal } from "@/components/modals/transaction-modal";
import { TransferModal } from "@/components/modals/transfer-modal";
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TransactionWithDetails } from "@shared/schema";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on search, type, and date range
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
    
    return matchesSearch && matchesType && matchesDateRange;
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Incoming</Badge>;
      case "outgoing":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Outgoing</Badge>;
      case "transfer":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Transfer</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getTransactionDescription = (transaction: TransactionWithDetails) => {
    switch (transaction.type) {
      case "incoming":
        return `From ${transaction.supplier?.name || "Unknown Supplier"} to ${transaction.destinationWarehouse?.name}`;
      case "outgoing":
        return `From ${transaction.sourceWarehouse?.name} for internal use`;
      case "transfer":
        return `From ${transaction.sourceWarehouse?.name} to ${transaction.destinationWarehouse?.name}`;
      default:
        return "Unknown transaction";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Track all inventory movements and transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setTransactionModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Add Transaction
          </Button>
          <Button variant="outline" onClick={() => setTransferModalOpen(true)}>
            <ArrowLeftRight size={16} className="mr-2" />
            Transfer Items
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="date"
                placeholder="End date"
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
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== "all" || startDate || endDate
                  ? "No transactions match your search criteria" 
                  : "No transactions found"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
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
    </div>
  );
}
