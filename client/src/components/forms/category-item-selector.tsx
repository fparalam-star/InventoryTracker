import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Category, ItemWithDetails } from "@shared/schema";

interface CategoryItemSelectorProps {
  onCategoryChange: (categoryId: number) => void;
  onItemSelectionChange: (selection: {
    type: "existing" | "new";
    existingItemId?: number;
    newItemName?: string;
  }) => void;
  selectedCategoryId?: number;
  selectedItemType?: "existing" | "new";
  selectedExistingItemId?: number;
  selectedNewItemName?: string;
}

export function CategoryItemSelector({
  onCategoryChange,
  onItemSelectionChange,
  selectedCategoryId,
  selectedItemType = "existing",
  selectedExistingItemId,
  selectedNewItemName = "",
}: CategoryItemSelectorProps) {
  const [itemSelectionType, setItemSelectionType] = useState<"existing" | "new">(selectedItemType);
  const [newItemName, setNewItemName] = useState(selectedNewItemName);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch all items
  const { data: allItems = [] } = useQuery<ItemWithDetails[]>({
    queryKey: ["/api/items"],
  });

  // Filter items by selected category
  const filteredItems = selectedCategoryId
    ? allItems.filter(item => item.categoryId === selectedCategoryId)
    : [];

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const id = parseInt(categoryId);
    onCategoryChange(id);
    // Reset item selection when category changes
    setItemSelectionType("existing");
    onItemSelectionChange({ type: "existing" });
  };

  // Handle item selection type change
  const handleItemSelectionTypeChange = (type: "existing" | "new") => {
    setItemSelectionType(type);
    if (type === "existing") {
      onItemSelectionChange({ type: "existing" });
    } else {
      onItemSelectionChange({ type: "new", newItemName: newItemName });
    }
  };

  // Handle existing item selection
  const handleExistingItemChange = (itemId: string) => {
    const id = parseInt(itemId);
    onItemSelectionChange({ type: "existing", existingItemId: id });
  };

  // Handle new item name change
  const handleNewItemNameChange = (name: string) => {
    setNewItemName(name);
    onItemSelectionChange({ type: "new", newItemName: name });
  };

  useEffect(() => {
    if (selectedItemType !== itemSelectionType) {
      setItemSelectionType(selectedItemType);
    }
  }, [selectedItemType]);

  useEffect(() => {
    if (selectedNewItemName !== newItemName) {
      setNewItemName(selectedNewItemName);
    }
  }, [selectedNewItemName]);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select 
          value={selectedCategoryId?.toString()} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Item Selection Type */}
      {selectedCategoryId && (
        <div>
          <Label>Item Selection</Label>
          <RadioGroup
            value={itemSelectionType}
            onValueChange={handleItemSelectionTypeChange}
            className="flex flex-row space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing">Select existing item</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">Create new item</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Existing Item Selection */}
      {selectedCategoryId && itemSelectionType === "existing" && (
        <div>
          <Label htmlFor="existingItem">Select Item *</Label>
          {filteredItems.length > 0 ? (
            <Select 
              value={selectedExistingItemId?.toString()} 
              onValueChange={handleExistingItemChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground p-2 border rounded-md">
              No items found in this category. Please create a new item.
            </p>
          )}
        </div>
      )}

      {/* New Item Name Input */}
      {selectedCategoryId && itemSelectionType === "new" && (
        <div>
          <Label htmlFor="newItemName">Item Name *</Label>
          <Input
            id="newItemName"
            type="text"
            placeholder="Enter item name"
            value={newItemName}
            onChange={(e) => handleNewItemNameChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}