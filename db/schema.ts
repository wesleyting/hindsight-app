import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const reflections = sqliteTable('reflections', {
 userId: text('user_id').notNull(), symbol: text('symbol').notNull(), week: text('week').notNull(),
 note: text('note').notNull(), status: text('status').notNull().default('draft'), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({ columns: [t.userId,t.symbol,t.week] })]);

export const marketCache=sqliteTable('market_cache',{
 symbol:text('symbol').primaryKey(),payload:text('payload').notNull(),fetchedAt:text('fetched_at').notNull(),
});
export const analyses=sqliteTable('analyses',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),symbol:text('symbol').notNull(),kind:text('kind').notNull(),question:text('question').notNull(),answer:text('answer').notNull(),contextHash:text('context_hash').notNull(),market:text('market').notNull(),model:text('model').notNull(),usage:text('usage').notNull(),createdAt:text('created_at').notNull(),
});
export const savedNotes=sqliteTable('saved_notes',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),symbol:text('symbol').notNull(),text:text('text').notNull(),createdAt:text('created_at').notNull(),
});
export const aiUsage=sqliteTable('ai_usage',{
 userId:text('user_id').notNull(),day:text('day').notNull(),count:integer('count').notNull(),
},t=>[primaryKey({columns:[t.userId,t.day]})]);
export const aiLocks=sqliteTable('ai_locks',{
 userId:text('user_id').primaryKey(),token:text('token').notNull(),expiresAt:integer('expires_at').notNull(),
});
