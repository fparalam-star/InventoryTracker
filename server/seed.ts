// @ts-nocheck
import { db } from "./db";
import { users, warehouses, categories, suppliers } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create warehouses
    const [warehouse1, warehouse2] = await db
      .insert(warehouses)
      .values([
        {
          name: "Main Warehouse",
          location: "New Cairo, Egypt",
          description: "Primary storage facility"
        },
        {
          name: "Secondary Warehouse", 
          location: "Alexandria, Egypt",
          description: "Secondary storage facility"
        }
      ])
      .returning();

    // Create categories
    await db
      .insert(categories)
      .values([
        {
          name: "Electronics",
          description: "Electronic devices and components"
        },
        {
          name: "Office Supplies",
          description: "General office supplies and stationery"
        }
      ]);

    // Create suppliers
    await db
      .insert(suppliers)
      .values([
        {
          name: "Tech Solutions Inc.",
          contactPerson: "Ahmed Hassan",
          email: "contact@techsolutions.com",
          phone: "+20-1234567890",
          address: "123 Tech Street, Cairo, Egypt"
        },
        {
          name: "Office Plus",
          contactPerson: "Sara Ahmed",
          email: "orders@officeplus.com", 
          phone: "+20-9876543210",
          address: "456 Business Ave, Giza, Egypt"
        }
      ]);

    // Create admin and data entry users
    await db
      .insert(users)
      .values([
        {
          username: "hassan_admin",
          password: "SecretAdminPassword!", // In production, this should be hashed
          role: "admin",
          firstName: "Admin",
          lastName: "Hassan",
          email: "admin@iti.gov.eg",
          mobileNumber: "+20-1111111111",
          assignedWarehouseId: null // Admin can access all warehouses
        },
        {
          username: "hassan_entry",
          password: "SecretEntryPassword!", // In production, this should be hashed
          role: "data_entry",
          firstName: "Data Entry",
          lastName: "User", 
          email: "dataentry@iti.gov.eg",
          mobileNumber: "+20-2222222222",
          assignedWarehouseId: warehouse1.id // Assigned to main warehouse
        }
      ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });