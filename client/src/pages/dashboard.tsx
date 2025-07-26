import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { TransferModal } from "@/components/modals/transfer-modal";
import { 
  Building2, 
  Tags, 
  Package, 
  Users, 
  Truck, 
  AlertTriangle,
  ArrowLeftRight,
  Plus,
  ArrowUpDown,
  BarChart3,
  UserPlus
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import type { 
  DashboardMetrics, 
  TransactionWithDetails, 
  InventoryWithDetails 
} from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedItemForReorder, setSelectedItemForReorder] = useState<InventoryWithDetails | null>(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<InventoryWithDetails | null>(null);

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/dashboard/recent-activities"],
  });

  const { data: lowStockItems = [], isLoading: lowStockLoading } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/dashboard/low-stock"],
  });

  const { data: inventoryData = [] } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/inventory"],
  });

  // Handle reorder action
  const handleReorder = (item: InventoryWithDetails) => {
    setSelectedItemForReorder(item);
    setTransactionModalOpen(true);
  };

  // Handle transfer action
  const handleTransfer = (item: InventoryWithDetails) => {
    setSelectedItemForTransfer(item);
    setTransferModalOpen(true);
  };

  // Prepare chart data
  const chartData = inventoryData
    .reduce((acc: any[], item) => {
      const existingWarehouse = acc.find(w => w.warehouse === item.warehouse.name);
      if (existingWarehouse) {
        existingWarehouse.items += 1;
        existingWarehouse.quantity += item.quantity;
        existingWarehouse.lowStock += item.quantity <= item.item.minStockLevel ? 1 : 0;
      } else {
        acc.push({
          warehouse: item.warehouse.name,
          items: 1,
          quantity: item.quantity,
          lowStock: item.quantity <= item.item.minStockLevel ? 1 : 0,
        });
      }
      return acc;
    }, [])
    .slice(0, 8); // Show top 8 warehouses

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setLocation("/warehouses")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="إجمالي المستودعات"
            value={metrics?.warehouses || 0}
            icon={<Building2 className="text-blue-600" size={24} />}
            iconBgColor="bg-blue-100"
          />
        </div>
        
        <div 
          onClick={() => setLocation("/categories")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="إجمالي الفئات"
            value={metrics?.categories || 0}
            icon={<Tags className="text-green-600" size={24} />}
            iconBgColor="bg-green-100"
          />
        </div>
        
        <div 
          onClick={() => setLocation("/transactions")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="إجمالي العناصر"
            value={metrics?.items || 0}
            icon={<Package className="text-orange-600" size={24} />}
            iconBgColor="bg-orange-100"
          />
        </div>
        
        <div 
          onClick={() => setLocation("/users")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="إجمالي المستخدمين"
            value={metrics?.users || 0}
            icon={<Users className="text-purple-600" size={24} />}
            iconBgColor="bg-purple-100"
          />
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setLocation("/suppliers")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="إجمالي الموردين"
            value={metrics?.suppliers || 0}
            icon={<Truck className="text-indigo-600" size={20} />}
            iconBgColor="bg-indigo-100"
          />
        </div>
        
        <div 
          onClick={() => setLocation("/reports")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="العناصر منخفضة المخزون"
            value={metrics?.lowStockItems || 0}
            icon={<AlertTriangle className="text-red-600" size={20} />}
            iconBgColor="bg-red-100"
          />
        </div>
        
        <div 
          onClick={() => setLocation("/transactions")}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <MetricsCard
            title="معاملات اليوم"
            value={metrics?.todayTransactions || 0}
            icon={<ArrowLeftRight className="text-teal-600" size={20} />}
            iconBgColor="bg-teal-100"
          />
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity 
          activities={activitiesLoading ? [] : recentActivities} 
        />
        
        {/* Inventory Levels Chart */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">مستويات المخزون حسب المستودع</h3>
            <div className="flex items-center space-x-2">
              <BarChart3 className="text-primary" size={20} />
              <span className="text-sm text-muted-foreground">المخزون الحالي</span>
            </div>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="warehouse" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [
                      value,
                      name === 'quantity' ? 'إجمالي الكمية' : 
                      name === 'items' ? 'عدد العناصر' :
                      'عناصر منخفضة المخزون'
                    ]}
                    labelFormatter={(label) => `المستودع: ${label}`}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'quantity' ? 'إجمالي الكمية' : 
                      value === 'items' ? 'عدد العناصر' :
                      'عناصر منخفضة المخزون'
                    }
                  />
                  <Bar dataKey="quantity" fill="#3b82f6" name="quantity" />
                  <Bar dataKey="lowStock" fill="#ef4444" name="lowStock" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 size={48} className="mx-auto mb-4" />
                  <p>لا توجد بيانات مخزون</p>
                  <p className="text-sm">قم بإضافة عناصر للمستودعات لعرض المخطط</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-6">الإجراءات السريعة</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => setTransactionModalOpen(true)}
          >
            <Plus className="text-primary" size={24} />
            <span className="font-medium text-primary">إضافة معاملة</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-orange-500 hover:bg-orange-50"
            onClick={() => setTransferModalOpen(true)}
          >
            <ArrowUpDown className="text-orange-500" size={24} />
            <span className="font-medium text-orange-500">نقل العناصر</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-amber-500 hover:bg-amber-50"
            onClick={() => setLocation('/reports')}
          >
            <BarChart3 className="text-amber-500" size={24} />
            <span className="font-medium text-amber-500">إنشاء تقرير</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-purple-500 hover:bg-purple-50"
            onClick={() => setLocation('/suppliers')}
          >
            <UserPlus className="text-purple-500" size={24} />
            <span className="font-medium text-purple-500">إضافة مورد</span>
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <LowStockTable 
        lowStockItems={lowStockLoading ? [] : lowStockItems}
        onReorder={handleReorder}
        onTransfer={handleTransfer}
      />

      {/* Modals */}
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
