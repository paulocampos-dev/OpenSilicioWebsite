import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateAddress() {
  const newAddress = 'Sala A2-49, Av. Prof. Luciano Gualberto, 158 - Butantã, São Paulo - SP, 05508-020';

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    const result = await pool.query(
      "UPDATE site_settings SET value = $1 WHERE key = 'address' RETURNING *",
      [newAddress]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log('✅ Address updated successfully!');
      console.log('New address:', newAddress);
    } else {
      console.log('⚠️  No address record found, creating new one...');
      await pool.query(
        "INSERT INTO site_settings (key, value) VALUES ('address', $1)",
        [newAddress]
      );
      console.log('✅ Address created successfully!');
      console.log('New address:', newAddress);
    }
  } catch (error) {
    console.error('❌ Error updating address:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateAddress();
