import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verify() {
  console.log('🔍 Verifying migration...\n');

  // Check blog posts
  const blogPosts = await pool.query('SELECT title, content FROM blog_posts');
  console.log(`📝 Blog Posts (${blogPosts.rows.length}):`);
  for (const row of blogPosts.rows) {
    try {
      const parsed = JSON.parse(row.content);
      const status = parsed.root ? '✅' : '❌';
      console.log(`  ${status} ${row.title}`);
    } catch {
      console.log(`  ❌ ${row.title} - Invalid JSON`);
    }
  }

  // Check education resources
  const eduResources = await pool.query('SELECT title, content FROM education_resources');
  console.log(`\n📚 Education Resources (${eduResources.rows.length}):`);
  for (const row of eduResources.rows) {
    try {
      const parsed = JSON.parse(row.content);
      const status = parsed.root ? '✅' : '❌';
      console.log(`  ${status} ${row.title}`);
    } catch {
      console.log(`  ❌ ${row.title} - Invalid JSON`);
    }
  }

  // Check wiki entries
  const wikiEntries = await pool.query('SELECT term, definition FROM wiki_entries');
  console.log(`\n📖 Wiki Entries (${wikiEntries.rows.length}):`);
  for (const row of wikiEntries.rows) {
    try {
      const parsed = JSON.parse(row.definition);
      const status = parsed.root ? '✅' : '❌';
      console.log(`  ${status} ${row.term}`);
    } catch {
      console.log(`  ❌ ${row.term} - Invalid JSON`);
    }
  }

  // Check site settings
  const settings = await pool.query(
    "SELECT key, value FROM site_settings WHERE key IN ('about_content', 'about_mission', 'about_vision', 'about_history')"
  );
  console.log(`\n⚙️  Site Settings (${settings.rows.length}):`);
  for (const row of settings.rows) {
    try {
      const parsed = JSON.parse(row.value);
      const status = parsed.root ? '✅' : '❌';
      console.log(`  ${status} ${row.key}`);
    } catch {
      console.log(`  ❌ ${row.key} - Invalid JSON`);
    }
  }

  console.log('\n✅ Verification complete!');
  await pool.end();
}

verify();
