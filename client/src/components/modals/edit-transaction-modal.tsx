import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TransactionWithDetails, Warehouse, Supplier } from "@shared/schema";

const editTransactionSchema = z.object({
  quantity: z.number().min(1, "الكمية يجب أن تكون على الأقل 1"),
  supplierId: z.number().optional(),
  receiverName: z.string().optional(),
  sourceWarehouseId: z.number().optional(),
  destinationWarehouseId: z.number().optional(),
  transactionDate: z.string().min(1, "تاريخ المعاملة مطلوب"),
  notes: z.string().optional(),
});

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithDetails | null;
}

export function EditTransactionModal({ open, onOpenChange, transaction }: EditTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof editTransactionSchema>>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      quantity: transaction?.quantity || 1,
      supplierId: transaction?.supplierId || undefined,
      receiverName: transaction?.receiverName || "",
      sourceWarehouseId: transaction?.sourceWarehouseId || undefined,
      destinationWarehouseId: transaction?.destinationWarehouseId || undefined,
      transactionDate: transaction?.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : "",
      notes: transaction?.notes || "",
    },
  });

  // Update form when transaction changes
  React.useEffect(() => {
    if (transaction) {
      form.reset({
        quantity: transaction.quantity,
        supplierId: transaction.supplierId || undefined,
        receiverName: transaction.receiverName || "",
        sourceWarehouseId: transaction.sourceWarehouseId || undefined,
        destinationWarehouseId: transaction.destinationWarehouseId || undefined,
        transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
        notes: transaction.notes || "",
      });
    }
  }, [transaction, form]);

  // Fetch data for dropdowns
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/transactions/${transaction?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activities"] });
    },
  });

  const onSubmit = async (data: z.infer<typeof editTransactionSchema>) => {
    if (!transaction) return;

    try {
      const updateData = {
        quantity: data.quantity,
        supplierId: data.supplierId,
        receiverName: data.receiverName,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        transactionDate: new Date(data.transactionDate),
        notes: data.notes,
      };

      await updateTransactionMutation.mutateAsync(updateData);

      toast({
        title: "نجح",
        description: "تم تحديث المعاملة بنجاح",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المعاملة",
        variant: "destructive",
      });
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل المعاملة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Details (Read-only) */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">تفاصيل المعاملة</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">النوع:</span> {
                    transaction.type === "incoming" ? "وارد" : 
                    transaction.type === "outgoing" ? "صادر" : "تحويل"
                  }
                </div>
                <div>
                  <span className="font-medium">العنصر:</span> {transaction.item.name}
                </div>
                <div>
                  <span className="font-medium">المستخدم:</span> {transaction.user.firstName} {transaction.user.lastName}
                </div>
                <div>
                  <span className="font-medium">تاريخ الإنشاء:</span> {new Date(transaction.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكمية *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="أدخل الكمية" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {transaction.type === "incoming" && (
              <>
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المورد</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المورد" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستلم</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل اسم المستلم" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستودع الوجهة</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المستودع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {transaction.type === "outgoing" && (
              <FormField
                control={form.control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستودع المصدر</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستودع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {transaction.type === "transfer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستودع المصدر</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المصدر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستودع الوجهة</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الوجهة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ المعاملة *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل أي ملاحظات إضافية" 
                      className="resize-none" 
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={updateTransactionMutation.isPending}
              >
                {updateTransactionMutation.isPending ? "جاري التحديث..." : "تحديث المعاملة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}