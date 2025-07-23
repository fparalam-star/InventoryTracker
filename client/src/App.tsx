import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

import Categories from "@/pages/categories";
import Warehouses from "@/pages/warehouses";
import Suppliers from "@/pages/suppliers";
import Transactions from "@/pages/transactions";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import itiLogoPath from "@assets/iti_logo_1751453860420.png";

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(username, password);
    } catch (error) {
      setError("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={itiLogoPath} 
                alt="ITI Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl">نظام إدارة المخزون ITI</CardTitle>
          <p className="text-muted-foreground">تسجيل الدخول إلى حسابك</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">بيانات الدخول غير صحيحة</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>حسابات تجريبية:</p>
            <p>مدير: admin / admin123</p>
            <p>إدخال بيانات: dataentry / dataentry123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user } = useAuth();
  
  if (adminOnly && user?.role !== "admin") {
    return <NotFound />;
  }
  
  return <Component />;
}

function AppRouter() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect data entry users from restricted pages
  useEffect(() => {
    if (user?.role === "data_entry") {
      if (location === "/" || location === "/categories" || location === "/users") {
        navigate("/warehouses");
      }
    }
  }, [user, location, navigate]);
  
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} adminOnly={true} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={Categories} adminOnly={true} />} />
      <Route path="/warehouses" component={Warehouses} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/reports" component={Reports} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} adminOnly={true} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
