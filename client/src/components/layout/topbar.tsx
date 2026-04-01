// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TransactionWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch pending transfer requests for admin users only
  const { data: pendingTransfers = [] } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions/pending-transfers"],
    enabled: user?.role === "admin", // Only admins can see pending transfers
  });

  const pendingCount = pendingTransfers.length;

  const handleLogout = () => {
    logout();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu size={20} />
          </Button>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="البحث في المخزن..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          
          {/* Notifications - Only for transfer requests */}
          {user?.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell size={20} />
                  {pendingCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>طلبات النقل المعلقة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pendingTransfers.length === 0 ? (
                  <DropdownMenuItem disabled>
                    لا توجد طلبات نقل معلقة
                  </DropdownMenuItem>
                ) : (
                  pendingTransfers.map((transfer) => (
                    <DropdownMenuItem key={transfer.id} className="flex flex-col items-start p-3">
                      <div className="font-medium">{transfer.item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        من: {transfer.sourceWarehouse?.name} → إلى: {transfer.destinationWarehouse?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الكمية: {transfer.quantity} • {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 p-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {user ? getInitials(user.firstName, user.lastName) : "U"}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : "المستخدم"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role === "admin" ? "مدير" : "إدخال بيانات"}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}