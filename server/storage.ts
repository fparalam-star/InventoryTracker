// @ts-nocheck
import { 
  users, warehouses, categories, suppliers, items, inventory, transactions,
  type User, type InsertUser,
  type Warehouse, type InsertWarehouse,
  type Category, type InsertCategory,
  type Supplier, type InsertSupplier,
  type Item, type InsertItem,
  type Inventory, type InsertInventory,
  type Transaction, type InsertTransaction,
  type ItemWithDetails,
  type TransactionWithDetails,
  type InventoryWithDetails,
  type DashboardMetrics
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Warehouse methods
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Supplier methods
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Item methods
  getItems(): Promise<ItemWithDetails[]>;
  getItem(id: number): Promise<ItemWithDetails | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;

  // Inventory methods
  getInventory(): Promise<InventoryWithDetails[]>;
  getInventoryByWarehouse(warehouseId: number): Promise<InventoryWithDetails[]>;
  getInventoryByItem(itemId: number): Promise<InventoryWithDetails[]>;
  updateInventory(itemId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined>;
  getLowStockItems(): Promise<InventoryWithDetails[]>;

  // Transaction methods
  getTransactions(): Promise<TransactionWithDetails[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]>;
  getTodayTransactions(): Promise<TransactionWithDetails[]>;

  // Dashboard methods
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private warehouses: Map<number, Warehouse>;
  private categories: Map<number, Category>;
  private suppliers: Map<number, Supplier>;
  private items: Map<number, Item>;
  private inventory: Map<string, Inventory>; // key: `${itemId}-${warehouseId}`
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentWarehouseId: number;
  private currentCategoryId: number;
  private currentSupplierId: number;
  private currentItemId: number;
  private currentInventoryId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.warehouses = new Map();
    this.categories = new Map();
    this.suppliers = new Map();
    this.items = new Map();
    this.inventory = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentWarehouseId = 1;
    this.currentCategoryId = 1;
    this.currentSupplierId = 1;
    this.currentItemId = 1;
    this.currentInventoryId = 1;
    this.currentTransactionId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // In real app, this would be hashed
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@iti.com",
      mobileNumber: null,
      assignedWarehouseId: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create data entry user
    const dataEntryUser: User = {
      id: this.currentUserId++,
      username: "dataentry",
      password: "dataentry123",
      role: "data_entry",
      firstName: "Data Entry",
      lastName: "User",
      email: "dataentry@iti.com",
      mobileNumber: null,
      assignedWarehouseId: null,
      createdAt: new Date(),
    };
    this.users.set(dataEntryUser.id, dataEntryUser);

    // Create warehouses
    const mainWarehouse: Warehouse = {
      id: this.currentWarehouseId++,
      name: "Main Warehouse",
      location: "Cairo, Egypt",
      description: "Primary storage facility",
      createdAt: new Date(),
    };
    this.warehouses.set(mainWarehouse.id, mainWarehouse);

    const branchA: Warehouse = {
      id: this.currentWarehouseId++,
      name: "Branch A",
      location: "Alexandria, Egypt",
      description: "Branch warehouse A",
      createdAt: new Date(),
    };
    this.warehouses.set(branchA.id, branchA);

    // Create categories
    const electronicsCategory: Category = {
      id: this.currentCategoryId++,
      name: "Electronics",
      description: "Electronic devices and components",
      createdAt: new Date(),
    };
    this.categories.set(electronicsCategory.id, electronicsCategory);

    const officeSuppliesCategory: Category = {
      id: this.currentCategoryId++,
      name: "Office Supplies",
      description: "General office supplies and materials",
      createdAt: new Date(),
    };
    this.categories.set(officeSuppliesCategory.id, officeSuppliesCategory);

    // Create suppliers
    const techSupplier: Supplier = {
      id: this.currentSupplierId++,
      name: "Tech Solutions Inc.",
      contactPerson: "John Smith",
      email: "contact@techsolutions.com",
      phone: "+20123456789",
      address: "123 Tech Street, Cairo",
      createdAt: new Date(),
    };
    this.suppliers.set(techSupplier.id, techSupplier);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      role: insertUser.role || "data_entry",
      mobileNumber: insertUser.mobileNumber ?? null,
      assignedWarehouseId: insertUser.assignedWarehouseId ?? null,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Warehouse methods
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const warehouse: Warehouse = {
      ...insertWarehouse,
      description: insertWarehouse.description || null,
      id: this.currentWarehouseId++,
      createdAt: new Date(),
    };
    this.warehouses.set(warehouse.id, warehouse);
    return warehouse;
  }

  async updateWarehouse(id: number, updateData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const warehouse = this.warehouses.get(id);
    if (!warehouse) return undefined;
    
    const updated = { ...warehouse, ...updateData };
    this.warehouses.set(id, updated);
    return updated;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    return this.warehouses.delete(id);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      description: insertCategory.description || null,
      id: this.currentCategoryId++,
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...updateData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const supplier: Supplier = {
      ...insertSupplier,
      email: insertSupplier.email || null,
      contactPerson: insertSupplier.contactPerson || null,
      phone: insertSupplier.phone || null,
      address: insertSupplier.address || null,
      id: this.currentSupplierId++,
      createdAt: new Date(),
    };
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updated = { ...supplier, ...updateData };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Item methods
  async getItems(): Promise<ItemWithDetails[]> {
    return Array.from(this.items.values()).map(item => {
      const category = this.categories.get(item.categoryId)!;
      const itemInventory = Array.from(this.inventory.values())
        .filter(inv => inv.itemId === item.id)
        .map(inv => ({
          ...inv,
          warehouse: this.warehouses.get(inv.warehouseId)!
        }));
      
      const totalQuantity = itemInventory.reduce((sum, inv) => sum + inv.quantity, 0);
      
      return {
        ...item,
        category,
        inventory: itemInventory,
        totalQuantity
      };
    });
  }

  async getItem(id: number): Promise<ItemWithDetails | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const category = this.categories.get(item.categoryId)!;
    const itemInventory = Array.from(this.inventory.values())
      .filter(inv => inv.itemId === item.id)
      .map(inv => ({
        ...inv,
        warehouse: this.warehouses.get(inv.warehouseId)!
      }));
    
    const totalQuantity = itemInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    
    return {
      ...item,
      category,
      inventory: itemInventory,
      totalQuantity
    };
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const item: Item = {
      ...insertItem,
      description: insertItem.description || null,
      imageUrl: insertItem.imageUrl || null,
      minStockLevel: insertItem.minStockLevel || 0,
      id: this.currentItemId++,
      createdAt: new Date(),
    };
    this.items.set(item.id, item);
    return item;
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updateData };
    this.items.set(id, updated);
    return updated;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  // Inventory methods
  async getInventory(): Promise<InventoryWithDetails[]> {
    return Array.from(this.inventory.values()).map(inv => {
      const item = this.items.get(inv.itemId)!;
      const category = this.categories.get(item.categoryId)!;
      const warehouse = this.warehouses.get(inv.warehouseId)!;
      
      return {
        ...inv,
        item: { ...item, category },
        warehouse
      };
    });
  }

  async getInventoryByWarehouse(warehouseId: number): Promise<InventoryWithDetails[]> {
    return Array.from(this.inventory.values())
      .filter(inv => inv.warehouseId === warehouseId)
      .map(inv => {
        const item = this.items.get(inv.itemId)!;
        const category = this.categories.get(item.categoryId)!;
        const warehouse = this.warehouses.get(inv.warehouseId)!;
        
        return {
          ...inv,
          item: { ...item, category },
          warehouse
        };
      });
  }

  async getInventoryByItem(itemId: number): Promise<InventoryWithDetails[]> {
    return Array.from(this.inventory.values())
      .filter(inv => inv.itemId === itemId)
      .map(inv => {
        const item = this.items.get(inv.itemId)!;
        const category = this.categories.get(item.categoryId)!;
        const warehouse = this.warehouses.get(inv.warehouseId)!;
        
        return {
          ...inv,
          item: { ...item, category },
          warehouse
        };
      });
  }

  async updateInventory(itemId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined> {
    const key = `${itemId}-${warehouseId}`;
    const existing = this.inventory.get(key);
    
    if (existing) {
      const updated = { ...existing, quantity, updatedAt: new Date() };
      this.inventory.set(key, updated);
      return updated;
    } else {
      const newInventory: Inventory = {
        id: this.currentInventoryId++,
        itemId,
        warehouseId,
        quantity,
        updatedAt: new Date(),
      };
      this.inventory.set(key, newInventory);
      return newInventory;
    }
  }

  async getLowStockItems(): Promise<InventoryWithDetails[]> {
    const allInventory = await this.getInventory();
    return allInventory.filter(inv => inv.quantity <= inv.item.minStockLevel);
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithDetails[]> {
    return Array.from(this.transactions.values()).map(trans => {
      const item = this.items.get(trans.itemId)!;
      const user = this.users.get(trans.userId)!;
      const supplier = trans.supplierId ? this.suppliers.get(trans.supplierId) : undefined;
      const sourceWarehouse = trans.sourceWarehouseId ? this.warehouses.get(trans.sourceWarehouseId) : undefined;
      const destinationWarehouse = trans.destinationWarehouseId ? this.warehouses.get(trans.destinationWarehouseId) : undefined;
      
      return {
        ...trans,
        item,
        user,
        supplier,
        sourceWarehouse,
        destinationWarehouse
      };
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      sourceWarehouseId: insertTransaction.sourceWarehouseId ?? null,
      destinationWarehouseId: insertTransaction.destinationWarehouseId ?? null,  
      supplierId: insertTransaction.supplierId ?? null,
      notes: insertTransaction.notes ?? null,
      id: this.currentTransactionId++,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);

    // Update inventory based on transaction type
    if (transaction.type === "incoming" && transaction.destinationWarehouseId) {
      const key = `${transaction.itemId}-${transaction.destinationWarehouseId}`;
      const existing = this.inventory.get(key);
      const currentQuantity = existing ? existing.quantity : 0;
      await this.updateInventory(transaction.itemId, transaction.destinationWarehouseId, currentQuantity + transaction.quantity);
    } else if (transaction.type === "outgoing" && transaction.sourceWarehouseId) {
      const key = `${transaction.itemId}-${transaction.sourceWarehouseId}`;
      const existing = this.inventory.get(key);
      if (existing) {
        await this.updateInventory(transaction.itemId, transaction.sourceWarehouseId, Math.max(0, existing.quantity - transaction.quantity));
      }
    } else if (transaction.type === "transfer" && transaction.sourceWarehouseId && transaction.destinationWarehouseId) {
      // Decrease from source
      const sourceKey = `${transaction.itemId}-${transaction.sourceWarehouseId}`;
      const sourceInventory = this.inventory.get(sourceKey);
      if (sourceInventory) {
        await this.updateInventory(transaction.itemId, transaction.sourceWarehouseId, Math.max(0, sourceInventory.quantity - transaction.quantity));
      }
      
      // Increase to destination
      const destKey = `${transaction.itemId}-${transaction.destinationWarehouseId}`;
      const destInventory = this.inventory.get(destKey);
      const destCurrentQuantity = destInventory ? destInventory.quantity : 0;
      await this.updateInventory(transaction.itemId, transaction.destinationWarehouseId, destCurrentQuantity + transaction.quantity);
    }

    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, ...updateData };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;

    // Remove the transaction
    const deleted = this.transactions.delete(id);
    
    if (deleted) {
      // Adjust inventory for deleted transaction
      this.adjustInventoryForDeletedTransaction(transaction);
    }
    
    return deleted;
  }

  private adjustInventoryForDeletedTransaction(transaction: Transaction): void {
    if (transaction.type === "incoming") {
      // For incoming transactions, reduce the quantity from destination warehouse
      if (transaction.destinationWarehouseId) {
        this.adjustInventoryQuantity(
          transaction.itemId,
          transaction.destinationWarehouseId,
          -transaction.quantity
        );
      }
    } else if (transaction.type === "outgoing") {
      // For outgoing transactions, add the quantity back to source warehouse
      if (transaction.sourceWarehouseId) {
        this.adjustInventoryQuantity(
          transaction.itemId,
          transaction.sourceWarehouseId,
          transaction.quantity
        );
      }
    } else if (transaction.type === "transfer") {
      // For transfer transactions, reverse both movements
      if (transaction.sourceWarehouseId) {
        this.adjustInventoryQuantity(
          transaction.itemId,
          transaction.sourceWarehouseId,
          transaction.quantity
        );
      }
      if (transaction.destinationWarehouseId) {
        this.adjustInventoryQuantity(
          transaction.itemId,
          transaction.destinationWarehouseId,
          -transaction.quantity
        );
      }
    }
  }

  private adjustInventoryQuantity(itemId: number, warehouseId: number, quantityChange: number): void {
    const key = `${itemId}-${warehouseId}`;
    const existingInventory = this.inventory.get(key);
    
    if (existingInventory) {
      // Update existing inventory
      const newQuantity = Math.max(0, existingInventory.quantity + quantityChange);
      this.inventory.set(key, {
        ...existingInventory,
        quantity: newQuantity,
        updatedAt: new Date()
      });
    } else if (quantityChange > 0) {
      // Create new inventory record only if adding quantity
      this.inventory.set(key, {
        id: this.nextInventoryId++,
        itemId,
        warehouseId,
        quantity: quantityChange,
        updatedAt: new Date()
      });
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    const allTransactions = await this.getTransactions();
    return allTransactions.filter(trans => 
      trans.transactionDate >= startDate && trans.transactionDate <= endDate
    );
  }

  async getTodayTransactions(): Promise<TransactionWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getTransactionsByDateRange(today, tomorrow);
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const warehousesCount = this.warehouses.size;
    const categoriesCount = this.categories.size;
    const itemsCount = this.items.size;
    const usersCount = this.users.size;
    const suppliersCount = this.suppliers.size;
    const lowStockItems = await this.getLowStockItems();
    const todayTransactions = await this.getTodayTransactions();

    return {
      warehouses: warehousesCount,
      categories: categoriesCount,
      items: itemsCount,
      users: usersCount,
      suppliers: suppliersCount,
      lowStockItems: lowStockItems.length,
      todayTransactions: todayTransactions.length,
    };
  }
}

// Simplified Database Storage Implementation - focusing on working methods
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Warehouse methods
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const result = await db.select().from(warehouses);
      console.log("Warehouses from DB:", result);
      return result;
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      throw error;
    }
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db
      .insert(warehouses)
      .values(insertWarehouse)
      .returning();
    return warehouse;
  }

  async updateWarehouse(id: number, updateData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [warehouse] = await db
      .update(warehouses)
      .set(updateData)
      .where(eq(warehouses.id, id))
      .returning();
    return warehouse || undefined;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    try {
      const result = await db.select().from(categories);
      console.log("Categories from DB:", result);
      return result;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(insertSupplier)
      .returning();
    return supplier;
  }

  async updateSupplier(id: number, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Item methods - simplified for now
  async getItems(): Promise<ItemWithDetails[]> {
    const itemsResult = await db.select().from(items);
    return itemsResult.map(item => ({
      ...item,
      category: { id: 0, name: "Unknown", description: null, createdAt: new Date() },
      inventory: [],
      totalQuantity: 0
    }));
  }

  async getItem(id: number): Promise<ItemWithDetails | undefined> {
    const itemsWithDetails = await this.getItems();
    return itemsWithDetails.find(item => item.id === id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Inventory methods
  async getInventory(): Promise<InventoryWithDetails[]> {
    return db
      .select({
        id: inventory.id,
        itemId: inventory.itemId,
        warehouseId: inventory.warehouseId,
        quantity: inventory.quantity,
        updatedAt: inventory.updatedAt,
        item: {
          id: items.id,
          name: items.name,
          description: items.description,
          categoryId: items.categoryId,
          imageUrl: items.imageUrl,
          minStockLevel: items.minStockLevel,
          createdAt: items.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            description: categories.description,
            createdAt: categories.createdAt,
          },
        },
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
          location: warehouses.location,
          description: warehouses.description,
          createdAt: warehouses.createdAt,
        },
      })
      .from(inventory)
      .leftJoin(items, eq(inventory.itemId, items.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id));
  }

  async getInventoryByWarehouse(warehouseId: number): Promise<InventoryWithDetails[]> {
    const allInventory = await this.getInventory();
    return allInventory.filter(inv => inv.warehouseId === warehouseId);
  }

  async getInventoryByItem(itemId: number): Promise<InventoryWithDetails[]> {
    const allInventory = await this.getInventory();
    return allInventory.filter(inv => inv.itemId === itemId);
  }

  async updateInventory(itemId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined> {
    // Check if inventory record exists
    const [existing] = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(inventory)
        .set({ quantity, updatedAt: new Date() })
        .where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)))
        .returning();
      return updated || undefined;
    } else {
      // Create new record
      const [created] = await db
        .insert(inventory)
        .values({ itemId, warehouseId, quantity })
        .returning();
      return created;
    }
  }

  async getLowStockItems(): Promise<InventoryWithDetails[]> {
    const allInventory = await this.getInventory();
    return allInventory.filter(inv => inv.quantity <= inv.item.minStockLevel);
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithDetails[]> {
    try {
      // Simplified query - build relationships step by step
      const basicTransactions = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt));

      const result: TransactionWithDetails[] = [];

      for (const transaction of basicTransactions) {
        // Get item and category
        const [item] = await db
          .select()
          .from(items)
          .leftJoin(categories, eq(items.categoryId, categories.id))
          .where(eq(items.id, transaction.itemId));

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, transaction.userId));

        // Get supplier if exists
        let supplier = null;
        if (transaction.supplierId) {
          const [supplierResult] = await db
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, transaction.supplierId));
          supplier = supplierResult || null;
        }

        // Get source warehouse if exists
        let sourceWarehouse = null;
        if (transaction.sourceWarehouseId) {
          const [warehouseResult] = await db
            .select()
            .from(warehouses)
            .where(eq(warehouses.id, transaction.sourceWarehouseId));
          sourceWarehouse = warehouseResult || null;
        }

        // Get destination warehouse if exists
        let destinationWarehouse = null;
        if (transaction.destinationWarehouseId) {
          const [warehouseResult] = await db
            .select()
            .from(warehouses)
            .where(eq(warehouses.id, transaction.destinationWarehouseId));
          destinationWarehouse = warehouseResult || null;
        }

        result.push({
          ...transaction,
          item: {
            ...item.items,
            category: item.categories || null,
          },
          user: user || null,
          supplier,
          sourceWarehouse,
          destinationWarehouse,
        });
      }

      return result;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      const [transaction] = await tx
        .insert(transactions)
        .values(insertTransaction)
        .returning();

      // Update inventory based on transaction type
      if (transaction.type === "incoming" && transaction.destinationWarehouseId) {
        const [existing] = await tx
          .select()
          .from(inventory)
          .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));

        if (existing) {
          await tx
            .update(inventory)
            .set({ quantity: existing.quantity + transaction.quantity, updatedAt: new Date() })
            .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        } else {
          await tx
            .insert(inventory)
            .values({ itemId: transaction.itemId, warehouseId: transaction.destinationWarehouseId, quantity: transaction.quantity });
        }
      } else if (transaction.type === "outgoing" && transaction.sourceWarehouseId) {
        const [existing] = await tx
          .select()
          .from(inventory)
          .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));

        if (existing) {
          await tx
            .update(inventory)
            .set({ quantity: Math.max(0, existing.quantity - transaction.quantity), updatedAt: new Date() })
            .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        }
      } else if (transaction.type === "transfer" && transaction.sourceWarehouseId && transaction.destinationWarehouseId) {
        // Decrease from source
        const [sourceInventory] = await tx
          .select()
          .from(inventory)
          .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));

        if (sourceInventory) {
          await tx
            .update(inventory)
            .set({ quantity: Math.max(0, sourceInventory.quantity - transaction.quantity), updatedAt: new Date() })
            .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        }

        // Increase to destination
        const [destInventory] = await tx
          .select()
          .from(inventory)
          .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));

        if (destInventory) {
          await tx
            .update(inventory)
            .set({ quantity: destInventory.quantity + transaction.quantity, updatedAt: new Date() })
            .where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        } else {
          await tx
            .insert(inventory)
            .values({ itemId: transaction.itemId, warehouseId: transaction.destinationWarehouseId, quantity: transaction.quantity });
        }
      }

      return transaction;
    });

    return result;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      const [transaction] = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      return transaction || undefined;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      // First, get the transaction details before deleting it
      const [transactionToDelete] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));
      
      if (!transactionToDelete) {
        return false;
      }

      // Delete the transaction
      const [deletedTransaction] = await db
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();

      if (!deletedTransaction) {
        return false;
      }

      // Now adjust inventory based on the deleted transaction
      await this.adjustInventoryForDeletedTransaction(transactionToDelete);

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  private async adjustInventoryForDeletedTransaction(transaction: Transaction): Promise<void> {
    try {
      if (transaction.type === "incoming") {
        // For incoming transactions, reduce the quantity from destination warehouse
        if (transaction.destinationWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.destinationWarehouseId,
            -transaction.quantity
          );
        }
      } else if (transaction.type === "outgoing") {
        // For outgoing transactions, add the quantity back to source warehouse
        if (transaction.sourceWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.sourceWarehouseId,
            transaction.quantity
          );
        }
      } else if (transaction.type === "transfer") {
        // For transfer transactions, reverse both movements
        if (transaction.sourceWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.sourceWarehouseId,
            transaction.quantity
          );
        }
        if (transaction.destinationWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.destinationWarehouseId,
            -transaction.quantity
          );
        }
      }
    } catch (error) {
      console.error("Error adjusting inventory for deleted transaction:", error);
      throw error;
    }
  }

  private async adjustInventoryQuantity(itemId: number, warehouseId: number, quantityChange: number): Promise<void> {
    try {
      // Check if inventory record exists
      const [existingInventory] = await db
        .select()
        .from(inventory)
        .where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));

      if (existingInventory) {
        // Update existing inventory
        const newQuantity = Math.max(0, existingInventory.quantity + quantityChange);
        await db
          .update(inventory)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date()
          })
          .where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));
      } else if (quantityChange > 0) {
        // Create new inventory record only if adding quantity
        await db
          .insert(inventory)
          .values({
            itemId,
            warehouseId,
            quantity: quantityChange,
            updatedAt: new Date()
          });
      }
    } catch (error) {
      console.error("Error adjusting inventory quantity:", error);
      throw error;
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    const allTransactions = await this.getTransactions();
    return allTransactions.filter(trans => 
      trans.transactionDate >= startDate && trans.transactionDate <= endDate
    );
  }

  async getTodayTransactions(): Promise<TransactionWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getTransactionsByDateRange(today, tomorrow);
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const warehousesCount = (await db.select().from(warehouses)).length;
      const categoriesCount = (await db.select().from(categories)).length;
      const itemsCount = (await db.select().from(items)).length;
      const usersCount = (await db.select().from(users)).length;
      const suppliersCount = (await db.select().from(suppliers)).length;
      
      // Get low stock items count
      const lowStockItemsCount = (await this.getLowStockItems()).length;
      
      // Get today's transactions count
      const todayTransactionsCount = (await this.getTodayTransactions()).length;
      
      return {
        warehouses: warehousesCount,
        categories: categoriesCount,
        items: itemsCount,
        users: usersCount,
        suppliers: suppliersCount,
        lowStockItems: lowStockItemsCount,
        todayTransactions: todayTransactionsCount,
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error; // Don't fall back, let caller handle error
    }
  }
}

// Create a hybrid storage that uses database but falls back to memory if needed
class HybridStorage implements IStorage {
  private dbStorage = new DatabaseStorage();
  private memStorage = new MemStorage();
  private useDatabase = true;

  private async tryDb<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (!this.useDatabase) {
      return fallback();
    }
    
    try {
      return await operation();
    } catch (error) {
      console.warn('Database operation failed, falling back to memory:', error.message);
      this.useDatabase = false;
      return fallback();
    }
  }

  // Dashboard methods - critical for UI
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.tryDb(
      () => this.dbStorage.getDashboardMetrics(),
      () => this.memStorage.getDashboardMetrics()
    );
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.tryDb(
      () => this.dbStorage.getUser(id),
      () => this.memStorage.getUser(id)
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.tryDb(
      () => this.dbStorage.getUserByUsername(username),
      () => this.memStorage.getUserByUsername(username)
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.tryDb(
      () => this.dbStorage.createUser(user),
      () => this.memStorage.createUser(user)
    );
  }

  async getUsers(): Promise<User[]> {
    return this.tryDb(
      () => this.dbStorage.getUsers(),
      () => this.memStorage.getUsers()
    );
  }

  // Warehouse methods
  async getWarehouses(): Promise<Warehouse[]> {
    return this.tryDb(
      () => this.dbStorage.getWarehouses(),
      () => this.memStorage.getWarehouses()
    );
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    return this.tryDb(
      () => this.dbStorage.getWarehouse(id),
      () => this.memStorage.getWarehouse(id)
    );
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    return this.tryDb(
      () => this.dbStorage.createWarehouse(warehouse),
      () => this.memStorage.createWarehouse(warehouse)
    );
  }

  async updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateWarehouse(id, warehouse),
      () => this.memStorage.updateWarehouse(id, warehouse)
    );
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    return this.tryDb(
      () => this.dbStorage.deleteWarehouse(id),
      () => this.memStorage.deleteWarehouse(id)
    );
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return this.tryDb(
      () => this.dbStorage.getCategories(),
      () => this.memStorage.getCategories()
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.tryDb(
      () => this.dbStorage.getCategory(id),
      () => this.memStorage.getCategory(id)
    );
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return this.tryDb(
      () => this.dbStorage.createCategory(category),
      () => this.memStorage.createCategory(category)
    );
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateCategory(id, category),
      () => this.memStorage.updateCategory(id, category)
    );
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.tryDb(
      () => this.dbStorage.deleteCategory(id),
      () => this.memStorage.deleteCategory(id)
    );
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return this.tryDb(
      () => this.dbStorage.getSuppliers(),
      () => this.memStorage.getSuppliers()
    );
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.tryDb(
      () => this.dbStorage.getSupplier(id),
      () => this.memStorage.getSupplier(id)
    );
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    return this.tryDb(
      () => this.dbStorage.createSupplier(supplier),
      () => this.memStorage.createSupplier(supplier)
    );
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateSupplier(id, supplier),
      () => this.memStorage.updateSupplier(id, supplier)
    );
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.tryDb(
      () => this.dbStorage.deleteSupplier(id),
      () => this.memStorage.deleteSupplier(id)
    );
  }

  // Item methods
  async getItems(): Promise<ItemWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getItems(),
      () => this.memStorage.getItems()
    );
  }

  async getItem(id: number): Promise<ItemWithDetails | undefined> {
    return this.tryDb(
      () => this.dbStorage.getItem(id),
      () => this.memStorage.getItem(id)
    );
  }

  async createItem(item: InsertItem): Promise<Item> {
    return this.tryDb(
      () => this.dbStorage.createItem(item),
      () => this.memStorage.createItem(item)
    );
  }

  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateItem(id, item),
      () => this.memStorage.updateItem(id, item)
    );
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.tryDb(
      () => this.dbStorage.deleteItem(id),
      () => this.memStorage.deleteItem(id)
    );
  }

  // Inventory methods
  async getInventory(): Promise<InventoryWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getInventory(),
      () => this.memStorage.getInventory()
    );
  }

  async getInventoryByWarehouse(warehouseId: number): Promise<InventoryWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getInventoryByWarehouse(warehouseId),
      () => this.memStorage.getInventoryByWarehouse(warehouseId)
    );
  }

  async getInventoryByItem(itemId: number): Promise<InventoryWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getInventoryByItem(itemId),
      () => this.memStorage.getInventoryByItem(itemId)
    );
  }

  async updateInventory(itemId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateInventory(itemId, warehouseId, quantity),
      () => this.memStorage.updateInventory(itemId, warehouseId, quantity)
    );
  }

  async getLowStockItems(): Promise<InventoryWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getLowStockItems(),
      () => this.memStorage.getLowStockItems()
    );
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getTransactions(),
      () => this.memStorage.getTransactions()
    );
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    return this.tryDb(
      () => this.dbStorage.createTransaction(transaction),
      () => this.memStorage.createTransaction(transaction)
    );
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateTransaction(id, transaction),
      () => this.memStorage.updateTransaction(id, transaction)
    );
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.tryDb(
      () => this.dbStorage.deleteTransaction(id),
      () => this.memStorage.deleteTransaction(id)
    );
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getTransactionsByDateRange(startDate, endDate),
      () => this.memStorage.getTransactionsByDateRange(startDate, endDate)
    );
  }

  async getTodayTransactions(): Promise<TransactionWithDetails[]> {
    return this.tryDb(
      () => this.dbStorage.getTodayTransactions(),
      () => this.memStorage.getTodayTransactions()
    );
  }
}

// Force PostgreSQL usage - no fallback to memory
export const storage = new DatabaseStorage();
// @ts-nocheck
