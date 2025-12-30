import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Chess Plugin Schema
export const chessGames = sqliteTable('chess_games', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(), // Should reference tenants.id if possible
  pgn: text('pgn'),
  white: text('white'),
  black: text('black'),
  date: integer('date', { mode: 'timestamp' }),
  result: text('result'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const chessPositions = sqliteTable('chess_positions', {
  id: text('id').primaryKey(), // The block ID from Tiptap
  pageId: text('page_id').notNull(), // Foreign key to pages table (manual link)
  fen: text('fen').notNull(),
  description: text('description'), // Optional context from surrounding text?
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
