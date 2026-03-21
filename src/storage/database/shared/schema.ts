import { pgTable, serial, timestamp, varchar, integer, text, numeric, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// 系统健康检查表（必须保留，禁止删除或修改）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 分类表
export const categories = pgTable(
  "categories",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    type: varchar("type", { length: 10 }).notNull(), // 'income' or 'expense'
    icon: varchar("icon", { length: 50 }).notNull(), // 图标名称
    color: varchar("color", { length: 20 }).notNull(), // 颜色代码
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("categories_type_idx").on(table.type),
  ]
);

// 交易记录表
export const transactions = pgTable(
  "transactions",
  {
    id: serial().primaryKey(),
    type: varchar("type", { length: 10 }).notNull(), // 'income' or 'expense'
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    description: text("description"),
    transactionDate: timestamp("transaction_date", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_type_idx").on(table.type),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_transaction_date_idx").on(table.transactionDate),
  ]
);

// 预算表
export const budgets = pgTable(
  "budgets",
  {
    id: serial().primaryKey(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    month: varchar("month", { length: 7 }).notNull(), // 格式：YYYY-MM
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("budgets_category_id_idx").on(table.categoryId),
    index("budgets_month_idx").on(table.month),
  ]
);

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation - Categories
export const insertCategorySchema = createCoercedInsertSchema(categories).pick({
  name: true,
  type: true,
  icon: true,
  color: true,
});

export const updateCategorySchema = createCoercedInsertSchema(categories)
  .pick({
    name: true,
    icon: true,
    color: true,
  })
  .partial();

// Zod schemas for validation - Transactions
export const insertTransactionSchema = createCoercedInsertSchema(transactions).pick({
  type: true,
  amount: true,
  categoryId: true,
  description: true,
  transactionDate: true,
});

export const updateTransactionSchema = createCoercedInsertSchema(transactions)
  .pick({
    type: true,
    amount: true,
    categoryId: true,
    description: true,
    transactionDate: true,
  })
  .partial();

// Zod schemas for validation - Budgets
export const insertBudgetSchema = createCoercedInsertSchema(budgets).pick({
  categoryId: true,
  amount: true,
  month: true,
});

export const updateBudgetSchema = createCoercedInsertSchema(budgets)
  .pick({
    amount: true,
    month: true,
  })
  .partial();

// TypeScript types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;
