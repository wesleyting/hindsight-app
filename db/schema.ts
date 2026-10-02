import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const reflections = sqliteTable('reflections', {
 userId: text('user_id').notNull(), symbol: text('symbol').notNull(), week: text('week').notNull(),
 note: text('note').notNull(), status: text('status').notNull().default('draft'), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({ columns: [t.userId,t.symbol,t.week] })]);
