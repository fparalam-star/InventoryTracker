import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, 
  Boxes, 
  Building2, 
  Truck, 
  ArrowLeftRight,
  FileBarChart,
  Users,
  LayoutDashboard,
  Tags
} from "lucide-react";
import itiLogo from "@assets/iti_logo_1751453860420.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Warehouses", href: "/warehouses", icon: Building2 },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Reports", href: "/reports", icon: FileBarChart },
];

const adminNavigation = [
  { name: "User Management", href: "/users", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-sidebar-background shadow-lg border-r border-sidebar-border fixed h-full z-10">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src={itiLogo} alt="ITI Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-sidebar-foreground">ITI Inventory</h1>
            <p className="text-sm text-sidebar-foreground/70">
              {user?.role === "admin" ? "Admin User" : "Data Entry"}
            </p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "text-sidebar-primary bg-sidebar-primary/10"
                      : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
                  )}>
                    <Icon size={20} />
                    <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
          
          {user?.role === "admin" && (
            <>
              <li className="pt-4 border-t border-sidebar-border">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
              </li>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "text-sidebar-primary bg-sidebar-primary/10"
                          : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
                      )}>
                        <Icon size={20} />
                        <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                      </a>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
