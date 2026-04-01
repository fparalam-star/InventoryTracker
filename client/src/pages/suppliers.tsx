// @ts-nocheck
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Truck, Plus, Phone, Mail, MapPin, User, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { insertSupplierSchema, type Supplier } from "@shared/schema";

const supplierFormSchema = insertSupplierSchema;

export default function Suppliers() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === "admin";

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supplierFormSchema>) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "نجح",
        description: "تم إنشاء المورد بنجاح",
      });
      form.reset();
      setAddModalOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المورد",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof supplierFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "نجح",
        description: "تم تحديث المورد بنجاح",
      });
      form.reset();
      setEditingSupplier(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المورد",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof supplierFormSchema>) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
  };

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "نجح",
        description: "تم حذف المورد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المورد",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId !== null) {
      deleteSupplierMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingSupplier(null);
    setAddModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل الموردين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => {
        if (!open) setDeleteConfirmId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموردين</h1>
          <p className="text-muted-foreground">إدارة الموردين ومعلومات البائعين</p>
        </div>
        {isAdmin && (
          <Dialog open={addModalOpen || !!editingSupplier} onOpenChange={(open) => {
            if (!open) resetForm();
            else setAddModalOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                إضافة مورد
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "تعديل المورد" : "إضافة مورد جديد"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشركة *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الشركة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شخص الاتصال</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم شخص الاتصال" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="أدخل عنوان البريد الإلكتروني" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الهاتف</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="أدخل رقم الهاتف" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل عنوان الشركة" 
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
                    disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                  >
                    {createSupplierMutation.isPending || updateSupplierMutation.isPending 
                      ? (editingSupplier ? "جاري التحديث..." : "جاري الإنشاء...") 
                      : (editingSupplier ? "تحديث المورد" : "إنشاء المورد")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على موردين</p>
            <p className="text-sm text-muted-foreground">أضف مورداً أولاً للبدء</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Truck className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      {supplier.contactPerson && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <User size={14} className="mr-1" />
                          {supplier.contactPerson}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(supplier.id)}
                        disabled={deleteSupplierMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {supplier.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail size={14} className="mr-2" />
                      {supplier.email}
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone size={14} className="mr-2" />
                      {supplier.phone}
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                  Added: {new Date(supplier.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
