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
  // SSL: only enable if DATABASE_SSL is explicitly set to 'true' (e.g., for managed databases like AWS RDS)
  // For Docker/local production, SSL is not needed
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

interface TestDataSnapshot {
  timestamp: string;
  counts: {
    blog_posts: number;
    education_resources: number;
    wiki_entries: number;
    site_settings: number;
    users: number;
  };
  created_data: {
    blog_posts: Array<{ id: string; title: string; slug: string; content: string }>;
    education_resources: Array<{ id: string; title: string; description: string; content: string }>;
    wiki_entries: Array<{ id: string; term: string; slug: string; definition: string; content: string }>;
    site_settings: { contact_email: string; featured_blog_ids: string[]; featured_education_ids: string[] };
  };
}

async function createTestData() {
  const snapshot: TestDataSnapshot = {
    timestamp: new Date().toISOString(),
    counts: {
      blog_posts: 0,
      education_resources: 0,
      wiki_entries: 0,
      site_settings: 0,
      users: 0,
    },
    created_data: {
      blog_posts: [],
      education_resources: [],
      wiki_entries: [],
      site_settings: {
        contact_email: '',
        featured_blog_ids: [],
        featured_education_ids: [],
      },
    },
  };

  try {
    console.log('\n🔄 Criando dados de teste...\n');

    // Get initial counts
    const blogCount = await pool.query('SELECT COUNT(*) FROM blog_posts');
    const eduCount = await pool.query('SELECT COUNT(*) FROM education_resources');
    const wikiCount = await pool.query('SELECT COUNT(*) FROM wiki_entries');
    const settingsCount = await pool.query('SELECT COUNT(*) FROM site_settings');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');

    snapshot.counts.blog_posts = parseInt(blogCount.rows[0].count);
    snapshot.counts.education_resources = parseInt(eduCount.rows[0].count);
    snapshot.counts.wiki_entries = parseInt(wikiCount.rows[0].count);
    snapshot.counts.site_settings = parseInt(settingsCount.rows[0].count);
    snapshot.counts.users = parseInt(usersCount.rows[0].count);

    console.log('📊 Contagem inicial:');
    console.log(`   Blog posts: ${snapshot.counts.blog_posts}`);
    console.log(`   Education resources: ${snapshot.counts.education_resources}`);
    console.log(`   Wiki entries: ${snapshot.counts.wiki_entries}`);
    console.log(`   Site settings: ${snapshot.counts.site_settings}`);
    console.log(`   Users: ${snapshot.counts.users}\n`);

    // Create blog posts (with unique timestamps to avoid conflicts)
    const timestamp = Date.now();
    console.log('📝 Criando blog posts...');
    const blogPosts = [
      {
        title: `Test Blog Post 1 - Published (${timestamp})`,
        slug: `test-blog-post-1-published-${timestamp}`,
        excerpt: 'This is a test excerpt for published post',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Test content for published post' }] }] } }),
        author: 'Test Author',
        category: 'Eletrônica',
        published: true,
      },
      {
        title: `Test Blog Post 2 - Draft (${timestamp})`,
        slug: `test-blog-post-2-draft-${timestamp}`,
        excerpt: 'This is a test excerpt for draft post',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Test content for draft post' }] }] } }),
        author: 'Test Author',
        category: 'Circuitos Integrados',
        published: false,
      },
      {
        title: `Test Blog Post 3 - Published with Content (${timestamp})`,
        slug: `test-blog-post-3-content-${timestamp}`,
        excerpt: 'This post has more detailed content',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Detailed test content with multiple paragraphs and formatting' }] }] } }),
        author: 'Test Author',
        category: 'Eletrônica',
        published: true,
      },
    ];

    for (const post of blogPosts) {
      const result = await pool.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, author, category, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, slug, content`,
        [post.title, post.slug, post.excerpt, post.content, post.author, post.category, post.published]
      );
      snapshot.created_data.blog_posts.push({
        id: result.rows[0].id,
        title: result.rows[0].title,
        slug: result.rows[0].slug,
        content: result.rows[0].content,
      });
      console.log(`   ✓ Created: ${post.title}`);
    }

    // Create education resources
    console.log('\n📚 Criando education resources...');
    const educationResources = [
      {
        title: `Test Education Resource 1 (${timestamp})`,
        description: 'This is a test education resource description',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Education content for testing' }] }] } }),
        category: 'Projetos',
        difficulty: 'Iniciante',
        published: true,
      },
      {
        title: `Test Education Resource 2 (${timestamp})`,
        description: 'Another test education resource',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'More education content' }] }] } }),
        category: 'Tutoriais',
        difficulty: 'Intermediário',
        published: true,
      },
    ];

    for (const resource of educationResources) {
      const result = await pool.query(
        `INSERT INTO education_resources (title, description, content, category, difficulty, published)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, content`,
        [resource.title, resource.description, resource.content, resource.category, resource.difficulty, resource.published]
      );
      snapshot.created_data.education_resources.push({
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        content: result.rows[0].content,
      });
      console.log(`   ✓ Created: ${resource.title}`);
    }

    // Create wiki entries
    console.log('\n📖 Criando wiki entries...');
    const wikiEntries = [
      {
        term: `Test Wiki Term 1 (${timestamp})`,
        slug: `test-wiki-term-1-${timestamp}`,
        definition: 'This is a test definition for wiki term 1',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Wiki content for term 1' }] }] } }),
        published: true,
      },
      {
        term: `Test Wiki Term 2 (${timestamp})`,
        slug: `test-wiki-term-2-${timestamp}`,
        definition: 'This is a test definition for wiki term 2',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Wiki content for term 2' }] }] } }),
        published: true,
      },
      {
        term: `Test Wiki Term 3 - Draft (${timestamp})`,
        slug: `test-wiki-term-3-draft-${timestamp}`,
        definition: 'This is a draft wiki term',
        content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Draft wiki content' }] }] } }),
        published: false,
      },
    ];

    for (const entry of wikiEntries) {
      const result = await pool.query(
        `INSERT INTO wiki_entries (term, slug, definition, content, published)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, term, slug, definition, content`,
        [entry.term, entry.slug, entry.definition, entry.content, entry.published]
      );
      snapshot.created_data.wiki_entries.push({
        id: result.rows[0].id,
        term: result.rows[0].term,
        slug: result.rows[0].slug,
        definition: result.rows[0].definition,
        content: result.rows[0].content,
      });
      console.log(`   ✓ Created: ${entry.term}`);
    }

    // Update site settings with featured IDs (using key-value structure)
    console.log('\n⚙️  Atualizando site settings...');
    const blogIds = snapshot.created_data.blog_posts.map(p => p.id);
    const eduIds = snapshot.created_data.education_resources.map(r => r.id);

    // Update featured_blog_posts setting
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ('featured_blog_posts', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(blogIds)]
    );

    // Update featured_education_resources setting
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ('featured_education_resources', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(eduIds)]
    );

    // Get contact_email for snapshot
    const contactResult = await pool.query(`SELECT value FROM site_settings WHERE key = 'contact_email'`);
    snapshot.created_data.site_settings.contact_email = contactResult.rows[0]?.value || 'test@opensilicio.com';
    snapshot.created_data.site_settings.featured_blog_ids = blogIds;
    snapshot.created_data.site_settings.featured_education_ids = eduIds;

    console.log(`   ✓ Updated site settings with featured IDs`);

    // Get final counts
    const finalBlogCount = await pool.query('SELECT COUNT(*) FROM blog_posts');
    const finalEduCount = await pool.query('SELECT COUNT(*) FROM education_resources');
    const finalWikiCount = await pool.query('SELECT COUNT(*) FROM wiki_entries');

    console.log('\n📊 Contagem final:');
    console.log(`   Blog posts: ${parseInt(finalBlogCount.rows[0].count)}`);
    console.log(`   Education resources: ${parseInt(finalEduCount.rows[0].count)}`);
    console.log(`   Wiki entries: ${parseInt(finalWikiCount.rows[0].count)}`);

    // Save snapshot to file
    const snapshotPath = path.join(process.cwd(), 'test-data-snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`\n✅ Snapshot salvo em: ${snapshotPath}`);

    console.log('\n✅ Dados de teste criados com sucesso!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar dados de teste:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestData();

