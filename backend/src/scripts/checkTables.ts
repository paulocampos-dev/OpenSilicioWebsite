import pool from '../config/database';

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check wiki_entries
    const wikiResult = await pool.query('SELECT * FROM wiki_entries LIMIT 3');
    console.log('📚 Wiki Entries Table:');
    console.log(`   Count: ${wikiResult.rows.length}`);
    if (wikiResult.rows.length > 0) {
      console.log('   Sample row:');
      console.log('   ', JSON.stringify(wikiResult.rows[0], null, 2));
    }
    console.log();

    // Check education_resources
    const eduResult = await pool.query('SELECT * FROM education_resources LIMIT 3');
    console.log('🎓 Education Resources Table:');
    console.log(`   Count: ${eduResult.rows.length}`);
    if (eduResult.rows.length > 0) {
      console.log('   Sample row:');
      console.log('   ', JSON.stringify(eduResult.rows[0], null, 2));
    }
    console.log();

    // Check blog_posts
    const blogResult = await pool.query('SELECT * FROM blog_posts LIMIT 3');
    console.log('📝 Blog Posts Table:');
    console.log(`   Count: ${blogResult.rows.length}`);
    if (blogResult.rows.length > 0) {
      console.log('   Sample row:');
      console.log('   ', JSON.stringify(blogResult.rows[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
