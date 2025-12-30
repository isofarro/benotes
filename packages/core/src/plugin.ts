import { SQLiteTable } from 'drizzle-orm/sqlite-core';

export interface PluginDefinition {
  id: string;
  name: string;
  description?: string;
  
  // Database Schema (for Drizzle)
  schema?: Record<string, SQLiteTable>;
  
  // API Routes (Optional - for future use)
  routes?: any;
}

export type PluginRegistry = Record<string, PluginDefinition>;
