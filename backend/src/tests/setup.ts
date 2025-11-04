import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// Load test environment variables if .env.test exists
dotenv.config({ path: ".env.test" });

// Use test database URL if available, otherwise use regular DATABASE_URL
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://admin:admin123@localhost:5432/opensilicio_test";

// Set environment variables BEFORE importing app (so database.ts uses test DB)
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = DATABASE_URL;
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-secret-key-for-jwt-tokens";

// Create test database pool for direct database operations in tests
export const testPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
  max: 5,
});

// Helper to create test admin user
const createTestAdmin = async () => {
  const passwordHash = await bcrypt.hash("Dev123!@LocalOnly", 10);

  // Insert or update test admin user
  await testPool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ('AdmOpen', $1)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = $1`,
    [passwordHash],
  );
};

// Global test setup
beforeAll(async () => {
  // Test database connection
  try {
    await testPool.query("SELECT 1");
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    throw error;
  }

  // Ensure test admin user exists
  await createTestAdmin();
});

// Global test cleanup
afterAll(async () => {
  // Close database connections
  await testPool.end();
});

// Helper to clean database tables (use with caution)
export const cleanDatabase = async () => {
  // Delete in reverse order of dependencies
  await testPool.query("DELETE FROM content_wiki_links");
  await testPool.query("DELETE FROM pending_wiki_links");
  await testPool.query("DELETE FROM wiki_entries");
  await testPool.query("DELETE FROM education_resources");
  await testPool.query("DELETE FROM blog_posts");
  await testPool.query("DELETE FROM site_settings");
  // Note: Don't delete users as we need admin user for auth tests
};
