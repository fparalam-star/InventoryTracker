// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Users as UsersIcon, Plus, Mail, Shield, User, Trash2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, type User as UserType, type Warehouse } from "@shared/schema";

const userFormSchema = insertUserSchema;

export default function Users() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isMainAdmin = currentUser?.username === "admin";

  // Only allow admin users to access this page
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">تم رفض الوصول. يتطلب صلاحيات المدير.</p>
        </div>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });



  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "data_entry",
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      assignedWarehouseId: undefined,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "نجح",
        description: "تم إنشاء المستخدم بنجاح",
      });
      form.reset();
      setAddModalOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المستخدم",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "نجح",
        description: "تم حذف المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setAddModalOpen(false);
  };

  const togglePasswordVisibility = (userId: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleDeleteUser = (user: UserType) => {
    if (confirm(`هل أنت متأكد من أنك تريد حذف المستخدم "${user.firstName} ${user.lastName}"؟`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">مدير</Badge>;
      case "data_entry":
        return <Badge variant="secondary">مدخل بيانات</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الأول" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأخير *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الأخير" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستخدم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل رقم الهاتف" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر دور المستخدم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="data_entry">مدخل بيانات</SelectItem>
                          <SelectItem value="admin">مدير</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المخزون المُخصص</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                        defaultValue={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المخزون (اختياري)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون تخصيص</SelectItem>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name} - {warehouse.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "جاري الإنشاء..." : "إنشاء مستخدم"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UsersIcon className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المديرون</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</p>
              </div>
              <Shield className="text-purple-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مدخلو البيانات</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === "data_entry").length}</p>
              </div>
              <User className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا يوجد مستخدمون</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    {isMainAdmin && <TableHead>كلمة المرور</TableHead>}
                    <TableHead>الدور</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الحالة</TableHead>
                    {isMainAdmin && <TableHead>إجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-medium">
                              {getInitials(user.firstName, user.lastName)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            {user.id === currentUser?.id && (
                              <div className="text-xs text-muted-foreground">(أنت)</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail size={14} className="text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                      </TableCell>
                      {isMainAdmin && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">
                              {visiblePasswords.has(user.id) ? (user.password || "No password") : "••••••••"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="h-6 w-6 p-0"
                            >
                              {visiblePasswords.has(user.id) ? 
                                <EyeOff size={12} /> : 
                                <Eye size={12} />
                              }
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">نشط</Badge>
                      </TableCell>
                      {isMainAdmin && (
                        <TableCell>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
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
    </div>
  );
}
