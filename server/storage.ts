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
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

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

export const storage = new MemStorage();
