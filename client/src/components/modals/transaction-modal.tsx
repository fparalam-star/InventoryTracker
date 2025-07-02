import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { CategoryItemSelector } from "@/components/forms/category-item-selector";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Warehouse, Supplier } from "@shared/schema";

const transactionFormSchema = z.object({
  transactionType: z.enum(["incoming", "outgoing", "transfer"]),
  categoryId: z.number().min(1, "Category is required"),
  itemSelectionType: z.enum(["existing", "new"]),
  existingItemId: z.number().optional(),
  newItemName: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  supplierId: z.number().optional(),
  sourceWarehouseId: z.number().optional(),
  destinationWarehouseId: z.number().optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  description: z.string().optional(),
  minStockLevel: z.number().min(0, "Minimum stock level must be 0 or greater").default(0),
}).refine((data) => {
  // Validate item selection
  if (data.itemSelectionType === "existing" && !data.existingItemId) {
    return false;
  }
  if (data.itemSelectionType === "new" && !data.newItemName?.trim()) {
    return false;
  }
  
  // Validate transaction type requirements
  if (data.transactionType === "incoming" && !data.supplierId) {
    return false;
  }
  if (data.transactionType === "incoming" && !data.destinationWarehouseId) {
    return false;
  }
  if (data.transactionType === "outgoing" && !data.sourceWarehouseId) {
    return false;
  }
  if (data.transactionType === "transfer" && (!data.sourceWarehouseId || !data.destinationWarehouseId)) {
    return false;
  }
  if (data.transactionType === "transfer" && data.sourceWarehouseId === data.destinationWarehouseId) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected transaction type",
});

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionModal({ open, onOpenChange }: TransactionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionType: "incoming",
      categoryId: 0,
      itemSelectionType: "existing",
      quantity: 1,
      transactionDate: new Date().toISOString().split('T')[0],
      description: "",
      minStockLevel: 0,
    },
  });

  const transactionType = form.watch("transactionType");
  const categoryId = form.watch("categoryId");
  const itemSelectionType = form.watch("itemSelectionType");

  // Fetch data for dropdowns
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
    },
  });

  const onSubmit = async (data: z.infer<typeof transactionFormSchema>) => {
    try {
      let itemId = data.existingItemId;

      // Create new item if needed
      if (data.itemSelectionType === "new" && data.newItemName) {
        const newItem = await createItemMutation.mutateAsync({
          name: data.newItemName,
          categoryId: data.categoryId,
          description: data.description,
          minStockLevel: data.minStockLevel,
        });
        itemId = newItem.id;
      }

      // Create transaction
      const transactionData = {
        type: data.transactionType,
        itemId: itemId,
        quantity: data.quantity,
        supplierId: data.supplierId,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        transactionDate: new Date(data.transactionDate),
        notes: data.description,
        userId: user?.id,
      };

      await createTransactionMutation.mutateAsync(transactionData);

      toast({
        title: "Success",
        description: "Transaction created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    form.setValue("categoryId", categoryId);
  };

  const handleItemSelectionChange = (selection: {
    type: "existing" | "new";
    existingItemId?: number;
    newItemName?: string;
  }) => {
    form.setValue("itemSelectionType", selection.type);
    if (selection.type === "existing" && selection.existingItemId) {
      form.setValue("existingItemId", selection.existingItemId);
      form.setValue("newItemName", undefined);
    } else if (selection.type === "new" && selection.newItemName) {
      form.setValue("newItemName", selection.newItemName);
      form.setValue("existingItemId", undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type Selection */}
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="incoming" id="incoming" className="peer sr-only" />
                        <Label
                          htmlFor="incoming"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <ArrowDown className="text-green-600 mb-2" size={24} />
                          <div className="text-center">
                            <div className="font-medium">Incoming</div>
                            <div className="text-xs text-muted-foreground">From supplier</div>
                          </div>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem value="outgoing" id="outgoing" className="peer sr-only" />
                        <Label
                          htmlFor="outgoing"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <ArrowUp className="text-red-600 mb-2" size={24} />
                          <div className="text-center">
                            <div className="font-medium">Outgoing</div>
                            <div className="text-xs text-muted-foreground">Internal use</div>
                          </div>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                        <Label
                          htmlFor="transfer"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <ArrowLeftRight className="text-orange-600 mb-2" size={24} />
                          <div className="text-center">
                            <div className="font-medium">Transfer</div>
                            <div className="text-xs text-muted-foreground">Between warehouses</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Item Selection */}
            <CategoryItemSelector
              onCategoryChange={handleCategoryChange}
              onItemSelectionChange={handleItemSelectionChange}
              selectedCategoryId={categoryId || undefined}
              selectedItemType={itemSelectionType}
              selectedExistingItemId={form.watch("existingItemId")}
              selectedNewItemName={form.watch("newItemName")}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="Enter quantity" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Fields Based on Transaction Type */}
            {transactionType === "incoming" && (
              <>
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
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
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Warehouse *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
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

            {transactionType === "outgoing" && (
              <FormField
                control={form.control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Warehouse *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
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

            {transactionType === "transfer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Warehouse *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
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
                      <FormLabel>Destination Warehouse *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
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

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {itemSelectionType === "new" && (
                <FormField
                  control={form.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Enter minimum stock level" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes (optional)" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createItemMutation.isPending || createTransactionMutation.isPending}
              >
                {createItemMutation.isPending || createTransactionMutation.isPending ? "Creating..." : "Create Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}