import { Pool } from 'pg';

// Enforce DATABASE_URL is set in environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool configuration
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Increased to 5 seconds for Docker
});

// Handle unexpected pool errors - log but don't crash
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err);
  // Don't exit process - let the application handle reconnection
});

// Test database connection with retry logic
const testConnection = async (retries = 10, delay = 2000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      const attemptsLeft = retries - i - 1;
      if (attemptsLeft > 0) {
        console.log(`⏳ Database not ready yet. Retrying in ${delay/1000}s... (${attemptsLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Database connection failed after all retries:', err);
        process.exit(1);
      }
    }
  }
};

// Start connection test (non-blocking)
testConnection().catch((err) => {
  console.error('❌ Fatal database error:', err);
  process.exit(1);
});

export default pool;

