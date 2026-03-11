import { pgTable, serial, timestamp, varchar, integer, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 商品表
export const products = pgTable("products", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	specification: varchar("specification", { length: 100 }),
	price: numeric("price", { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// 客户表
export const customers = pgTable("customers", {
	id: serial().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 20 }),
	address: varchar("address", { length: 500 }),
	note: varchar("note", { length: 500 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// 订单表
export const orders = pgTable("orders", {
	id: serial().primaryKey(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
	orderDate: timestamp("order_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// 订单明细表
export const orderItems = pgTable("order_items", {
	id: serial().primaryKey(),
	orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
	productId: integer("product_id").notNull().references(() => products.id),
	quantity: integer("quantity").notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
	subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertProductSchema = createCoercedInsertSchema(products).pick({
	name: true,
	specification: true,
	price: true,
});

export const insertCustomerSchema = createCoercedInsertSchema(customers).pick({
	name: true,
	phone: true,
	address: true,
	note: true,
});

export const insertOrderSchema = createCoercedInsertSchema(orders).pick({
	customerName: true,
	totalAmount: true,
	orderDate: true,
});

export const insertOrderItemSchema = createCoercedInsertSchema(orderItems).pick({
	orderId: true,
	productId: true,
	quantity: true,
	unitPrice: true,
	subtotal: true,
});

// TypeScript types
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
