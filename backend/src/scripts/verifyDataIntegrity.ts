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

interface IntegrityReport {
  timestamp: string;
  snapshot_timestamp: string;
  overall_status: 'PASS' | 'FAIL';
  counts_comparison: {
    blog_posts: { before: number; after: number; status: 'PASS' | 'FAIL' };
    education_resources: { before: number; after: number; status: 'PASS' | 'FAIL' };
    wiki_entries: { before: number; after: number; status: 'PASS' | 'FAIL' };
    site_settings: { before: number; after: number; status: 'PASS' | 'FAIL' };
    users: { before: number; after: number; status: 'PASS' | 'FAIL' };
  };
  data_verification: {
    blog_posts: Array<{ id: string; title: string; exists: boolean; content_matches: boolean; status: 'PASS' | 'FAIL' }>;
    education_resources: Array<{ id: string; title: string; exists: boolean; content_matches: boolean; status: 'PASS' | 'FAIL' }>;
    wiki_entries: Array<{ id: string; term: string; exists: boolean; content_matches: boolean; status: 'PASS' | 'FAIL' }>;
    site_settings: { exists: boolean; featured_ids_match: boolean; status: 'PASS' | 'FAIL' };
  };
  errors: string[];
}

async function verifyDataIntegrity() {
  try {
    console.log('\n🔍 Verificando integridade dos dados...\n');

    // Load snapshot
    const snapshotPath = path.join(process.cwd(), 'test-data-snapshot.json');
    if (!fs.existsSync(snapshotPath)) {
      console.error(`❌ Snapshot não encontrado em: ${snapshotPath}`);
      console.error('   Execute createTestData primeiro.');
      process.exit(1);
    }

    const snapshot: TestDataSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    console.log(`📋 Snapshot carregado (criado em: ${snapshot.timestamp})\n`);

    const report: IntegrityReport = {
      timestamp: new Date().toISOString(),
      snapshot_timestamp: snapshot.timestamp,
      overall_status: 'PASS',
      counts_comparison: {
        blog_posts: { before: snapshot.counts.blog_posts, after: 0, status: 'PASS' },
        education_resources: { before: snapshot.counts.education_resources, after: 0, status: 'PASS' },
        wiki_entries: { before: snapshot.counts.wiki_entries, after: 0, status: 'PASS' },
        site_settings: { before: snapshot.counts.site_settings, after: 0, status: 'PASS' },
        users: { before: snapshot.counts.users, after: 0, status: 'PASS' },
      },
      data_verification: {
        blog_posts: [],
        education_resources: [],
        wiki_entries: [],
        site_settings: { exists: false, featured_ids_match: false, status: 'PASS' },
      },
      errors: [],
    };

    // Get current counts
    console.log('📊 Verificando contagens...');
    const blogCount = await pool.query('SELECT COUNT(*) FROM blog_posts');
    const eduCount = await pool.query('SELECT COUNT(*) FROM education_resources');
    const wikiCount = await pool.query('SELECT COUNT(*) FROM wiki_entries');
    const settingsCount = await pool.query('SELECT COUNT(*) FROM site_settings');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');

    report.counts_comparison.blog_posts.after = parseInt(blogCount.rows[0].count);
    report.counts_comparison.education_resources.after = parseInt(eduCount.rows[0].count);
    report.counts_comparison.wiki_entries.after = parseInt(wikiCount.rows[0].count);
    report.counts_comparison.site_settings.after = parseInt(settingsCount.rows[0].count);
    report.counts_comparison.users.after = parseInt(usersCount.rows[0].count);

    // Verify counts (should be >= before, as we added test data)
    const expectedBlogCount = snapshot.counts.blog_posts + snapshot.created_data.blog_posts.length;
    const expectedEduCount = snapshot.counts.education_resources + snapshot.created_data.education_resources.length;
    const expectedWikiCount = snapshot.counts.wiki_entries + snapshot.created_data.wiki_entries.length;

    if (report.counts_comparison.blog_posts.after < expectedBlogCount) {
      report.counts_comparison.blog_posts.status = 'FAIL';
      report.overall_status = 'FAIL';
      report.errors.push(`Blog posts count decreased: expected >= ${expectedBlogCount}, got ${report.counts_comparison.blog_posts.after}`);
    }
    if (report.counts_comparison.education_resources.after < expectedEduCount) {
      report.counts_comparison.education_resources.status = 'FAIL';
      report.overall_status = 'FAIL';
      report.errors.push(`Education resources count decreased: expected >= ${expectedEduCount}, got ${report.counts_comparison.education_resources.after}`);
    }
    if (report.counts_comparison.wiki_entries.after < expectedWikiCount) {
      report.counts_comparison.wiki_entries.status = 'FAIL';
      report.overall_status = 'FAIL';
      report.errors.push(`Wiki entries count decreased: expected >= ${expectedWikiCount}, got ${report.counts_comparison.wiki_entries.after}`);
    }

    console.log(`   Blog posts: ${report.counts_comparison.blog_posts.before} → ${report.counts_comparison.blog_posts.after} ${report.counts_comparison.blog_posts.status === 'PASS' ? '✓' : '✗'}`);
    console.log(`   Education resources: ${report.counts_comparison.education_resources.before} → ${report.counts_comparison.education_resources.after} ${report.counts_comparison.education_resources.status === 'PASS' ? '✓' : '✗'}`);
    console.log(`   Wiki entries: ${report.counts_comparison.wiki_entries.before} → ${report.counts_comparison.wiki_entries.after} ${report.counts_comparison.wiki_entries.status === 'PASS' ? '✓' : '✗'}`);
    console.log(`   Site settings: ${report.counts_comparison.site_settings.before} → ${report.counts_comparison.site_settings.after} ${report.counts_comparison.site_settings.status === 'PASS' ? '✓' : '✗'}`);
    console.log(`   Users: ${report.counts_comparison.users.before} → ${report.counts_comparison.users.after} ${report.counts_comparison.users.status === 'PASS' ? '✓' : '✗'}\n`);

    // Verify created blog posts exist and content matches
    console.log('📝 Verificando blog posts criados...');
    for (const post of snapshot.created_data.blog_posts) {
      const result = await pool.query('SELECT id, title, slug, content FROM blog_posts WHERE id = $1', [post.id]);
      const exists = result.rows.length > 0;
      const contentMatches = exists && result.rows[0].content === post.content;

      const status = exists && contentMatches ? 'PASS' : 'FAIL';
      if (status === 'FAIL') {
        report.overall_status = 'FAIL';
        if (!exists) {
          report.errors.push(`Blog post missing: ${post.title} (ID: ${post.id})`);
        } else if (!contentMatches) {
          report.errors.push(`Blog post content changed: ${post.title} (ID: ${post.id})`);
        }
      }

      report.data_verification.blog_posts.push({
        id: post.id,
        title: post.title,
        exists,
        content_matches: contentMatches,
        status,
      });

      console.log(`   ${exists ? '✓' : '✗'} ${post.title} (${exists && contentMatches ? 'OK' : 'FAIL'})`);
    }

    // Verify created education resources exist and content matches
    console.log('\n📚 Verificando education resources criados...');
    for (const resource of snapshot.created_data.education_resources) {
      const result = await pool.query('SELECT id, title, description, content FROM education_resources WHERE id = $1', [resource.id]);
      const exists = result.rows.length > 0;
      const contentMatches = exists && result.rows[0].content === resource.content;

      const status = exists && contentMatches ? 'PASS' : 'FAIL';
      if (status === 'FAIL') {
        report.overall_status = 'FAIL';
        if (!exists) {
          report.errors.push(`Education resource missing: ${resource.title} (ID: ${resource.id})`);
        } else if (!contentMatches) {
          report.errors.push(`Education resource content changed: ${resource.title} (ID: ${resource.id})`);
        }
      }

      report.data_verification.education_resources.push({
        id: resource.id,
        title: resource.title,
        exists,
        content_matches: contentMatches,
        status,
      });

      console.log(`   ${exists ? '✓' : '✗'} ${resource.title} (${exists && contentMatches ? 'OK' : 'FAIL'})`);
    }

    // Verify created wiki entries exist and content matches
    console.log('\n📖 Verificando wiki entries criados...');
    for (const entry of snapshot.created_data.wiki_entries) {
      const result = await pool.query('SELECT id, term, slug, definition, content FROM wiki_entries WHERE id = $1', [entry.id]);
      const exists = result.rows.length > 0;
      const contentMatches = exists && result.rows[0].content === entry.content;

      const status = exists && contentMatches ? 'PASS' : 'FAIL';
      if (status === 'FAIL') {
        report.overall_status = 'FAIL';
        if (!exists) {
          report.errors.push(`Wiki entry missing: ${entry.term} (ID: ${entry.id})`);
        } else if (!contentMatches) {
          report.errors.push(`Wiki entry content changed: ${entry.term} (ID: ${entry.id})`);
        }
      }

      report.data_verification.wiki_entries.push({
        id: entry.id,
        term: entry.term,
        exists,
        content_matches: contentMatches,
        status,
      });

      console.log(`   ${exists ? '✓' : '✗'} ${entry.term} (${exists && contentMatches ? 'OK' : 'FAIL'})`);
    }

    // Verify site settings (using key-value structure)
    console.log('\n⚙️  Verificando site settings...');
    const blogSettingsResult = await pool.query(`SELECT value FROM site_settings WHERE key = 'featured_blog_posts'`);
    const eduSettingsResult = await pool.query(`SELECT value FROM site_settings WHERE key = 'featured_education_resources'`);
    const settingsExist = blogSettingsResult.rows.length > 0 || eduSettingsResult.rows.length > 0;

    let featuredIdsMatch = false;
    if (settingsExist) {
      const currentBlogIds = JSON.parse(blogSettingsResult.rows[0]?.value || '[]');
      const currentEduIds = JSON.parse(eduSettingsResult.rows[0]?.value || '[]');

      const expectedBlogIds = snapshot.created_data.site_settings.featured_blog_ids;
      const expectedEduIds = snapshot.created_data.site_settings.featured_education_ids;

      featuredIdsMatch =
        JSON.stringify(currentBlogIds.sort()) === JSON.stringify(expectedBlogIds.sort()) &&
        JSON.stringify(currentEduIds.sort()) === JSON.stringify(expectedEduIds.sort());

      if (!featuredIdsMatch) {
        report.errors.push('Site settings featured IDs do not match');
      }
    } else {
      report.errors.push('Site settings missing');
    }

    report.data_verification.site_settings.exists = settingsExist;
    report.data_verification.site_settings.featured_ids_match = featuredIdsMatch;
    report.data_verification.site_settings.status = settingsExist && featuredIdsMatch ? 'PASS' : 'FAIL';

    if (report.data_verification.site_settings.status === 'FAIL') {
      report.overall_status = 'FAIL';
    }

    console.log(`   ${settingsExist ? '✓' : '✗'} Settings exist: ${settingsExist}`);
    console.log(`   ${featuredIdsMatch ? '✓' : '✗'} Featured IDs match: ${featuredIdsMatch}`);

    // Save report
    const reportPath = path.join(process.cwd(), 'test-integrity-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE INTEGRIDADE');
    console.log('='.repeat(60));
    console.log(`Status Geral: ${report.overall_status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Snapshot criado em: ${snapshot.timestamp}`);
    console.log(`Verificação realizada em: ${report.timestamp}`);

    if (report.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      report.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ Nenhum erro encontrado! Todos os dados foram preservados.');
    }

    console.log('\n📄 Relatório completo salvo em: test-integrity-report.json');
    console.log('='.repeat(60) + '\n');

    process.exit(report.overall_status === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Erro ao verificar integridade:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDataIntegrity();

