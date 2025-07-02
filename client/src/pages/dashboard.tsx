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
import type { 
  DashboardMetrics, 
  TransactionWithDetails, 
  InventoryWithDetails 
} from "@shared/schema";

export default function Dashboard() {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [, setLocation] = useLocation();

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

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Warehouses"
          value={metrics?.warehouses || 0}
          icon={<Building2 className="text-blue-600" size={24} />}
          iconBgColor="bg-blue-100"
        />
        
        <MetricsCard
          title="Total Categories"
          value={metrics?.categories || 0}
          icon={<Tags className="text-green-600" size={24} />}
          iconBgColor="bg-green-100"
        />
        
        <MetricsCard
          title="Total Items"
          value={metrics?.items || 0}
          icon={<Package className="text-orange-600" size={24} />}
          iconBgColor="bg-orange-100"
        />
        
        <MetricsCard
          title="Total Users"
          value={metrics?.users || 0}
          icon={<Users className="text-purple-600" size={24} />}
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Total Suppliers"
          value={metrics?.suppliers || 0}
          icon={<Truck className="text-indigo-600" size={20} />}
          iconBgColor="bg-indigo-100"
        />
        
        <MetricsCard
          title="Low Stock Items"
          value={metrics?.lowStockItems || 0}
          icon={<AlertTriangle className="text-red-600" size={20} />}
          iconBgColor="bg-red-100"
        />
        
        <MetricsCard
          title="Today's Transactions"
          value={metrics?.todayTransactions || 0}
          icon={<ArrowLeftRight className="text-teal-600" size={20} />}
          iconBgColor="bg-teal-100"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity 
          activities={activitiesLoading ? [] : recentActivities} 
        />
        
        {/* Placeholder for future chart */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Inventory Levels</h3>
            <select className="text-sm border border-input rounded-lg px-3 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 size={48} className="mx-auto mb-4" />
              <p>Chart visualization</p>
              <p className="text-sm">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => setTransactionModalOpen(true)}
          >
            <Plus className="text-primary" size={24} />
            <span className="font-medium text-primary">Add Transaction</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-orange-500 hover:bg-orange-50"
            onClick={() => setTransferModalOpen(true)}
          >
            <ArrowUpDown className="text-orange-500" size={24} />
            <span className="font-medium text-orange-500">Transfer Items</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-amber-500 hover:bg-amber-50"
            onClick={() => setLocation('/reports')}
          >
            <BarChart3 className="text-amber-500" size={24} />
            <span className="font-medium text-amber-500">Generate Report</span>
          </Button>

          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 border-dashed border-2 hover:border-purple-500 hover:bg-purple-50"
            onClick={() => setLocation('/suppliers')}
          >
            <UserPlus className="text-purple-500" size={24} />
            <span className="font-medium text-purple-500">Add Supplier</span>
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <LowStockTable lowStockItems={lowStockLoading ? [] : lowStockItems} />

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
