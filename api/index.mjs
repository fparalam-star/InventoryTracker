var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/api-handler.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  insertCategorySchema: () => insertCategorySchema,
  insertInventorySchema: () => insertInventorySchema,
  insertItemSchema: () => insertItemSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  insertWarehouseSchema: () => insertWarehouseSchema,
  inventory: () => inventory,
  items: () => items,
  suppliers: () => suppliers,
  transactions: () => transactions,
  users: () => users,
  warehouses: () => warehouses
});
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "data_entry"] }).notNull().default("data_entry"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  mobileNumber: text("mobile_number"),
  assignedWarehouseId: integer("assigned_warehouse_id").references(() => warehouses.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  imageUrl: text("image_url"),
  minStockLevel: integer("min_stock_level").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["incoming", "outgoing", "transfer"] }).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: integer("quantity").notNull(),
  sourceWarehouseId: integer("source_warehouse_id").references(() => warehouses.id),
  destinationWarehouseId: integer("destination_warehouse_id").references(() => warehouses.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  receiverName: text("receiver_name"),
  // اسم المستلم
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("approved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true
});
var insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true
});
var insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  updatedAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
}).extend({
  transactionDate: z.coerce.date()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getUsers() {
    return db.select().from(users);
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Warehouse methods
  async getWarehouses() {
    try {
      const result = await db.select().from(warehouses);
      console.log("Warehouses from DB:", result);
      return result;
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      throw error;
    }
  }
  async getWarehouse(id) {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || void 0;
  }
  async createWarehouse(insertWarehouse) {
    const [warehouse] = await db.insert(warehouses).values(insertWarehouse).returning();
    return warehouse;
  }
  async updateWarehouse(id, updateData) {
    const [warehouse] = await db.update(warehouses).set(updateData).where(eq(warehouses.id, id)).returning();
    return warehouse || void 0;
  }
  async deleteWarehouse(id) {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Category methods
  async getCategories() {
    try {
      const result = await db.select().from(categories);
      console.log("Categories from DB:", result);
      return result;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }
  async getCategory(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || void 0;
  }
  async createCategory(insertCategory) {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
  async updateCategory(id, updateData) {
    const [category] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return category || void 0;
  }
  async deleteCategory(id) {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Supplier methods
  async getSuppliers() {
    return db.select().from(suppliers);
  }
  async getSupplier(id) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || void 0;
  }
  async createSupplier(insertSupplier) {
    const [supplier] = await db.insert(suppliers).values(insertSupplier).returning();
    return supplier;
  }
  async updateSupplier(id, updateData) {
    const [supplier] = await db.update(suppliers).set(updateData).where(eq(suppliers.id, id)).returning();
    return supplier || void 0;
  }
  async deleteSupplier(id) {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Item methods - simplified for now
  async getItems() {
    const itemsResult = await db.select().from(items);
    return itemsResult.map((item) => ({
      ...item,
      category: { id: 0, name: "Unknown", description: null, createdAt: /* @__PURE__ */ new Date() },
      inventory: [],
      totalQuantity: 0
    }));
  }
  async getItem(id) {
    const itemsWithDetails = await this.getItems();
    return itemsWithDetails.find((item) => item.id === id);
  }
  async createItem(insertItem) {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }
  async updateItem(id, updateData) {
    const [item] = await db.update(items).set(updateData).where(eq(items.id, id)).returning();
    return item || void 0;
  }
  async deleteItem(id) {
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Inventory methods
  async getInventory() {
    return db.select({
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
          createdAt: categories.createdAt
        }
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
        location: warehouses.location,
        description: warehouses.description,
        createdAt: warehouses.createdAt
      }
    }).from(inventory).leftJoin(items, eq(inventory.itemId, items.id)).leftJoin(categories, eq(items.categoryId, categories.id)).leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id));
  }
  async getInventoryByWarehouse(warehouseId) {
    const allInventory = await this.getInventory();
    return allInventory.filter((inv) => inv.warehouseId === warehouseId);
  }
  async getInventoryByItem(itemId) {
    const allInventory = await this.getInventory();
    return allInventory.filter((inv) => inv.itemId === itemId);
  }
  async updateInventory(itemId, warehouseId, quantity) {
    const [existing] = await db.select().from(inventory).where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));
    if (existing) {
      const [updated] = await db.update(inventory).set({ quantity, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId))).returning();
      return updated || void 0;
    } else {
      const [created] = await db.insert(inventory).values({ itemId, warehouseId, quantity }).returning();
      return created;
    }
  }
  async getLowStockItems() {
    const allInventory = await this.getInventory();
    return allInventory.filter((inv) => inv.quantity <= inv.item.minStockLevel);
  }
  // Transaction methods
  async getTransactions() {
    try {
      const basicTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      const result = [];
      for (const transaction of basicTransactions) {
        const [item] = await db.select().from(items).leftJoin(categories, eq(items.categoryId, categories.id)).where(eq(items.id, transaction.itemId));
        const [user] = await db.select().from(users).where(eq(users.id, transaction.userId));
        let supplier = null;
        if (transaction.supplierId) {
          const [supplierResult] = await db.select().from(suppliers).where(eq(suppliers.id, transaction.supplierId));
          supplier = supplierResult || null;
        }
        let sourceWarehouse = null;
        if (transaction.sourceWarehouseId) {
          const [warehouseResult] = await db.select().from(warehouses).where(eq(warehouses.id, transaction.sourceWarehouseId));
          sourceWarehouse = warehouseResult || null;
        }
        let destinationWarehouse = null;
        if (transaction.destinationWarehouseId) {
          const [warehouseResult] = await db.select().from(warehouses).where(eq(warehouses.id, transaction.destinationWarehouseId));
          destinationWarehouse = warehouseResult || null;
        }
        result.push({
          ...transaction,
          item: {
            ...item.items,
            category: item.categories || null
          },
          user: user || null,
          supplier,
          sourceWarehouse,
          destinationWarehouse
        });
      }
      return result;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }
  async createTransaction(insertTransaction) {
    const result = await db.transaction(async (tx) => {
      const [transaction] = await tx.insert(transactions).values(insertTransaction).returning();
      if (transaction.type === "incoming" && transaction.destinationWarehouseId) {
        const [existing] = await tx.select().from(inventory).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        if (existing) {
          await tx.update(inventory).set({ quantity: existing.quantity + transaction.quantity, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        } else {
          await tx.insert(inventory).values({ itemId: transaction.itemId, warehouseId: transaction.destinationWarehouseId, quantity: transaction.quantity });
        }
      } else if (transaction.type === "outgoing" && transaction.sourceWarehouseId) {
        const [existing] = await tx.select().from(inventory).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        if (existing) {
          await tx.update(inventory).set({ quantity: Math.max(0, existing.quantity - transaction.quantity), updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        }
      } else if (transaction.type === "transfer" && transaction.sourceWarehouseId && transaction.destinationWarehouseId) {
        const [sourceInventory] = await tx.select().from(inventory).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        if (sourceInventory) {
          await tx.update(inventory).set({ quantity: Math.max(0, sourceInventory.quantity - transaction.quantity), updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.sourceWarehouseId)));
        }
        const [destInventory] = await tx.select().from(inventory).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        if (destInventory) {
          await tx.update(inventory).set({ quantity: destInventory.quantity + transaction.quantity, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(inventory.itemId, transaction.itemId), eq(inventory.warehouseId, transaction.destinationWarehouseId)));
        } else {
          await tx.insert(inventory).values({ itemId: transaction.itemId, warehouseId: transaction.destinationWarehouseId, quantity: transaction.quantity });
        }
      }
      return transaction;
    });
    return result;
  }
  async updateTransaction(id, updateData) {
    try {
      const [transaction] = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning();
      return transaction || void 0;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
  async deleteTransaction(id) {
    try {
      const [transactionToDelete] = await db.select().from(transactions).where(eq(transactions.id, id));
      if (!transactionToDelete) {
        return false;
      }
      const [deletedTransaction] = await db.delete(transactions).where(eq(transactions.id, id)).returning();
      if (!deletedTransaction) {
        return false;
      }
      await this.adjustInventoryForDeletedTransaction(transactionToDelete);
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }
  async adjustInventoryForDeletedTransaction(transaction) {
    try {
      if (transaction.type === "incoming") {
        if (transaction.destinationWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.destinationWarehouseId,
            -transaction.quantity
          );
        }
      } else if (transaction.type === "outgoing") {
        if (transaction.sourceWarehouseId) {
          await this.adjustInventoryQuantity(
            transaction.itemId,
            transaction.sourceWarehouseId,
            transaction.quantity
          );
        }
      } else if (transaction.type === "transfer") {
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
  async adjustInventoryQuantity(itemId, warehouseId, quantityChange) {
    try {
      const [existingInventory] = await db.select().from(inventory).where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));
      if (existingInventory) {
        const newQuantity = Math.max(0, existingInventory.quantity + quantityChange);
        await db.update(inventory).set({
          quantity: newQuantity,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(eq(inventory.itemId, itemId), eq(inventory.warehouseId, warehouseId)));
      } else if (quantityChange > 0) {
        await db.insert(inventory).values({
          itemId,
          warehouseId,
          quantity: quantityChange,
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      console.error("Error adjusting inventory quantity:", error);
      throw error;
    }
  }
  async getTransactionsByDateRange(startDate, endDate) {
    const allTransactions = await this.getTransactions();
    return allTransactions.filter(
      (trans) => trans.transactionDate >= startDate && trans.transactionDate <= endDate
    );
  }
  async getTodayTransactions() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getTransactionsByDateRange(today, tomorrow);
  }
  // Dashboard methods
  async getDashboardMetrics() {
    try {
      const warehousesCount = (await db.select().from(warehouses)).length;
      const categoriesCount = (await db.select().from(categories)).length;
      const itemsCount = (await db.select().from(items)).length;
      const usersCount = (await db.select().from(users)).length;
      const suppliersCount = (await db.select().from(suppliers)).length;
      const lowStockItemsCount = (await this.getLowStockItems()).length;
      const todayTransactionsCount = (await this.getTodayTransactions()).length;
      return {
        warehouses: warehousesCount,
        categories: categoriesCount,
        items: itemsCount,
        users: usersCount,
        suppliers: suppliersCount,
        lowStockItems: lowStockItemsCount,
        todayTransactions: todayTransactionsCount
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      throw error;
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/dashboard/metrics", async (req, res) => {
    try {
      console.log("Fetching dashboard metrics...");
      const metrics = await storage.getDashboardMetrics();
      console.log("Dashboard metrics:", metrics);
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics", error: error.message });
    }
  });
  app2.get("/api/dashboard/recent-activities", async (req, res) => {
    try {
      const activities = await storage.getTransactions();
      const recentActivities = activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
      res.json(recentActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });
  app2.get("/api/dashboard/low-stock", async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const requestingUser = req.headers["x-user-id"] ? await storage.getUser(parseInt(req.headers["x-user-id"])) : null;
      if (requestingUser?.username === "admin") {
        res.json(users2);
      } else {
        const safeUsers = users2.map(({ password, ...user }) => user);
        res.json(safeUsers);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const requestingUser = req.headers["x-user-id"] ? await storage.getUser(parseInt(req.headers["x-user-id"])) : null;
      if (requestingUser?.username === "admin") {
        res.json(user);
      } else {
        const { password, ...safeUser } = user;
        res.json(safeUser);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requestingUser = req.headers["x-user-id"] ? await storage.getUser(parseInt(req.headers["x-user-id"])) : null;
      if (requestingUser?.username !== "admin") {
        return res.status(403).json({ message: "Only main admin can delete users" });
      }
      if (id === requestingUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/warehouses", async (req, res) => {
    try {
      const warehouses2 = await storage.getWarehouses();
      res.json(warehouses2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });
  app2.post("/api/warehouses", async (req, res) => {
    try {
      const warehouseData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(warehouseData);
      res.status(201).json(warehouse);
    } catch (error) {
      res.status(400).json({ message: "Invalid warehouse data" });
    }
  });
  app2.put("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(id, warehouseData);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      res.status(400).json({ message: "Invalid warehouse data" });
    }
  });
  app2.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWarehouse(id);
      if (!deleted) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers2 = await storage.getSuppliers();
      res.json(suppliers2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  app2.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  app2.get("/api/items", async (req, res) => {
    try {
      const items2 = await storage.getItems();
      res.json(items2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  app2.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });
  app2.post("/api/items", async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid item data" });
    }
  });
  app2.get("/api/inventory", async (req, res) => {
    try {
      const { warehouseId } = req.query;
      let inventory2;
      if (warehouseId) {
        inventory2 = await storage.getInventoryByWarehouse(parseInt(warehouseId));
      } else {
        inventory2 = await storage.getInventory();
      }
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let transactions2;
      if (startDate && endDate) {
        transactions2 = await storage.getTransactionsByDateRange(
          new Date(startDate),
          new Date(endDate)
        );
      } else {
        transactions2 = await storage.getTransactions();
      }
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    try {
      const transactions2 = await storage.getTransactions();
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/transactions/pending-transfers", async (req, res) => {
    try {
      const transactions2 = await storage.getTransactions();
      const pendingTransfers = transactions2.filter(
        (transaction) => transaction.type === "transfer" && transaction.status === "pending"
      );
      res.json(pendingTransfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending transfers" });
    }
  });
  app2.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });
  app2.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, transactionData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });
  app2.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/api-handler.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var initialized = false;
async function handler(req, res) {
  if (!initialized) {
    await registerRoutes(app);
    initialized = true;
  }
  return app(req, res);
}
export {
  handler as default
};
