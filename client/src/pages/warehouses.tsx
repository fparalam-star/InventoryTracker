import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Building2, Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertWarehouseSchema, type Warehouse } from "@shared/schema";

const warehouseFormSchema = insertWarehouseSchema;

export default function Warehouses() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === "admin";

  const { data: warehouses = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<z.infer<typeof warehouseFormSchema>>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof warehouseFormSchema>) => {
      const response = await apiRequest("POST", "/api/warehouses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "نجح",
        description: "تم إنشاء المستودع بنجاح",
      });
      form.reset();
      setAddModalOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المستودع",
        variant: "destructive",
      });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof warehouseFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/warehouses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "نجح",
        description: "تم تحديث المستودع بنجاح",
      });
      form.reset();
      setEditingWarehouse(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المستودع",
        variant: "destructive",
      });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "نجح",
        description: "تم حذف المستودع بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المستودع",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof warehouseFormSchema>) => {
    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createWarehouseMutation.mutate(data);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من أنك تريد حذف هذا المستودع؟")) {
      deleteWarehouseMutation.mutate(id);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingWarehouse(null);
    setAddModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل المستودعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستودعات</h1>
          <p className="text-muted-foreground">إدارة مواقع وتفاصيل المستودعات الخاصة بك</p>
        </div>
        {isAdmin && (
          <Dialog open={addModalOpen || !!editingWarehouse} onOpenChange={(open) => {
            if (!open) resetForm();
            else setAddModalOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                إضافة مستودع
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "تعديل المستودع" : "إضافة مستودع جديد"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستودع *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستودع" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموقع *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل موقع المستودع" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل وصف المستودع" 
                          className="resize-none" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                  >
                    {createWarehouseMutation.isPending || updateWarehouseMutation.isPending 
                      ? (editingWarehouse ? "جاري التحديث..." : "جاري الإنشاء...") 
                      : (editingWarehouse ? "تحديث المستودع" : "إنشاء المستودع")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على مستودعات</p>
            <p className="text-sm text-muted-foreground">أنشئ مستودعك الأول للبدء</p>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin size={14} className="mr-1" />
                        {warehouse.location}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(warehouse)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(warehouse.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {warehouse.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {warehouse.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  تاريخ الإنشاء: {new Date(warehouse.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
