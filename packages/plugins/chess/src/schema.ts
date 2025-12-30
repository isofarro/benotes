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

export const chessAnnotations = sqliteTable('chess_annotations', {
  id: text('id').primaryKey(),
  gameId: text('game_id').references(() => chessGames.id, { onDelete: 'cascade' }),
  fen: text('fen').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
