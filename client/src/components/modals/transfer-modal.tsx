// @ts-nocheck
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
import { useAuth } from "@/hooks/use-auth";
import type { ItemWithDetails, Warehouse } from "@shared/schema";

const transferFormSchema = z.object({
  itemId: z.number().min(1, "Item is required"),
  sourceWarehouseId: z.number().min(1, "Source warehouse is required"),
  destinationWarehouseId: z.number().min(1, "Destination warehouse is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  transactionDate: z.string().min(1, "Transfer date is required"),
  notes: z.string().optional(),
}).refine((data) => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: "Source and destination warehouses must be different",
  path: ["destinationWarehouseId"],
});

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferModal({ open, onOpenChange }: TransferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof transferFormSchema>>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      itemId: 0,
      sourceWarehouseId: 0,
      destinationWarehouseId: 0,
      quantity: 1,
      transactionDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const selectedItemId = form.watch("itemId");
  const selectedSourceWarehouseId = form.watch("sourceWarehouseId");

  // Fetch data for dropdowns
  const { data: items = [] } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items"],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Get available quantity for selected item and warehouse
  const getAvailableQuantity = (itemId: number, warehouseId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return 0;
    
    const inventory = item.inventory.find(inv => inv.warehouseId === warehouseId);
    return inventory ? inventory.quantity : 0;
  };

  const availableQuantity = getAvailableQuantity(selectedItemId, selectedSourceWarehouseId);

  // Create transfer transaction mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activities"] });
    },
  });

  const onSubmit = async (data: z.infer<typeof transferFormSchema>) => {
    if (data.quantity > availableQuantity) {
      toast({
        title: "خطأ",
        description: `الكمية المتاحة غير كافية. يتوفر فقط ${availableQuantity} عنصر.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionData = {
        type: "transfer",
        itemId: data.itemId,
        quantity: data.quantity,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        userId: user!.id,
        transactionDate: new Date(data.transactionDate),
        notes: data.notes,
      };

      await createTransferMutation.mutateAsync(transactionData);

      toast({
        title: "نجح",
        description: "تم النقل بنجاح",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نقل العناصر",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>نقل العناصر</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اختر العنصر *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العنصر للنقل" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} (الإجمالي: {item.totalQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>من المستودع *</FormLabel>
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
                    <FormLabel>إلى المستودع *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوجهة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.filter(w => w.id !== selectedSourceWarehouseId).map((warehouse) => (
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
                      max={availableQuantity}
                      placeholder="أدخل الكمية للنقل" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  {selectedItemId && selectedSourceWarehouseId && (
                    <p className="text-sm text-muted-foreground">
                      الكمية المتاحة: {availableQuantity}
                    </p>
                  )}
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
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ النقل *</FormLabel>
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
                  <FormLabel>الملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ملاحظات النقل الاختيارية" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createTransferMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createTransferMutation.isPending ? "جاري النقل..." : "نقل العناصر"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
