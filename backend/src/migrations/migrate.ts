import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface Migration {
  id: number;
  name: string;
  applied_at: Date;
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log('✅ Migrations table ready');
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query<Migration>(
    'SELECT name FROM migrations ORDER BY id'
  );
  return result.rows.map(row => row.name);
}

/**
 * Get list of migration files from disk
 */
function getMigrationFiles(): string[] {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir);

  // Filter for .sql files and sort them
  return files
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Apply a single migration
 */
async function applyMigration(filename: string): Promise<void> {
  const filePath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Run the migration SQL
    await client.query(sql);

    // Record the migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [filename]
    );

    await client.query('COMMIT');
    console.log(`✅ Applied migration: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to apply migration: ${filename}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  try {
    console.log('\n🔄 Starting database migrations...\n');

    // Ensure migrations table exists
    await createMigrationsTable();

    // Get applied and available migrations
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations\n');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(file => console.log(`   - ${file}`));
    console.log();

    // Apply each pending migration
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
