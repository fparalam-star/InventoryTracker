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
import { insertWarehouseSchema, type Warehouse } from "@shared/schema";

const warehouseFormSchema = insertWarehouseSchema;

export default function Warehouses() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: "Success",
        description: "Warehouse created successfully",
      });
      form.reset();
      setAddModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create warehouse",
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
        title: "Success",
        description: "Warehouse updated successfully",
      });
      form.reset();
      setEditingWarehouse(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update warehouse",
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
        title: "Success",
        description: "Warehouse deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete warehouse",
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
    if (confirm("Are you sure you want to delete this warehouse?")) {
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
          <p className="mt-2 text-muted-foreground">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground">Manage your warehouse locations and details</p>
        </div>
        <Dialog open={addModalOpen || !!editingWarehouse} onOpenChange={(open) => {
          if (!open) resetForm();
          else setAddModalOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter warehouse name" {...field} />
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
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter warehouse location" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter warehouse description" 
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                  >
                    {createWarehouseMutation.isPending || updateWarehouseMutation.isPending 
                      ? (editingWarehouse ? "Updating..." : "Creating...") 
                      : (editingWarehouse ? "Update Warehouse" : "Create Warehouse")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No warehouses found</p>
            <p className="text-sm text-muted-foreground">Create your first warehouse to get started</p>
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
                </div>
              </CardHeader>
              <CardContent>
                {warehouse.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {warehouse.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(warehouse.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
