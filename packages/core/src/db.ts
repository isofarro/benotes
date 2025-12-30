import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Environment variable for data directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cache for database connections to avoid reopening
const dbCache: Record<string, ReturnType<typeof drizzle>> = {};

/**
 * Get the Global System Database
 * Used for Tenants, Users, Auth
 */
export const getSystemDb = () => {
  if (dbCache['system']) return dbCache['system'];

  const systemDir = path.join(DATA_DIR, 'system');
  if (!fs.existsSync(systemDir)) {
    fs.mkdirSync(systemDir, { recursive: true });
  }

  const sqlite = new Database(path.join(systemDir, 'system.db'));
  
  // Bootstrap System Schema (Temporary for Walking Skeleton)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER,
      image TEXT
    );
  `);

  const db = drizzle(sqlite, { schema });
  dbCache['system'] = db;
  return db;
};

/**
 * Get a specific Tenant Database
 * Used for Pages, Cards, Plugins
 */
export const getTenantDb = (tenantId: string) => {
  if (dbCache[tenantId]) return dbCache[tenantId];

  const tenantDir = path.join(DATA_DIR, 'tenants', tenantId);
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }

  const sqlite = new Database(path.join(tenantDir, 'db.sqlite'));

    // Bootstrap Tenant Schema (Temporary for Walking Skeleton)
    // NOTE: We dropped NOT NULL on 'slug' temporarily or it might be the issue? 
    // Actually, slug is NOT NULL in schema.
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT,
      parent_id TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      page_id TEXT,
      type TEXT NOT NULL,
      plugin TEXT NOT NULL,
      content TEXT,
      metadata TEXT,
      created_at INTEGER,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT
    );
  `);

  const db = drizzle(sqlite, { schema });
  dbCache[tenantId] = db;
  return db;
};

/**
 * Helper to initialize a new tenant
 */
export const initTenant = (tenantId: string, name: string) => {
    // 1. Create entry in System DB
    const systemDb = getSystemDb();
    
    // Check if exists or Insert
    // We use raw SQL for speed in this skeleton, or Drizzle
    try {
      systemDb.insert(schema.tenants).values({
        id: tenantId,
        name: name,
        slug: tenantId
      }).onConflictDoNothing().run();
    } catch (e) {
      console.error("Failed to register tenant in system DB", e);
    }
    
    // 2. Initialize Tenant DB (creates tables)
    const db = getTenantDb(tenantId);
    return db;
};

/**
 * Reset and re-initialize a tenant DB (useful for debugging schema issues)
 */
export const resetTenantDb = (tenantId: string) => {
    const tenantDir = path.join(DATA_DIR, 'tenants', tenantId);
    const dbPath = path.join(tenantDir, 'db.sqlite');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
    // Remove from cache to force reconnection
    delete dbCache[tenantId];
    return getTenantDb(tenantId);
}
