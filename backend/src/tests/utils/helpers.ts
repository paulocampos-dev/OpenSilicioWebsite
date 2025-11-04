import { testPool, cleanDatabase } from '../setup';

// Re-export cleanDatabase for convenience
export { cleanDatabase };

/**
 * Create a test blog post
 */
export const createTestBlogPost = async (overrides: Partial<any> = {}) => {
  const defaultPost = {
    title: 'Test Blog Post',
    slug: `test-post-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    excerpt: 'This is a test excerpt',
    content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Test content' }] }] } }),
    author: 'Test Author',
    category: 'Eletrônica',
    published: true,
    ...overrides,
  };

  const result = await testPool.query(
    `INSERT INTO blog_posts (title, slug, excerpt, content, author, category, published)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      defaultPost.title,
      defaultPost.slug,
      defaultPost.excerpt,
      defaultPost.content,
      defaultPost.author,
      defaultPost.category,
      defaultPost.published,
    ]
  );

  return result.rows[0];
};

/**
 * Create a test education resource
 */
export const createTestEducationResource = async (overrides: Partial<any> = {}) => {
  const defaultResource = {
    title: 'Test Education Resource',
    description: 'This is a test description',
    content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Test content' }] }] } }),
    category: 'Projetos',
    difficulty: 'Iniciante',
    published: true,
    ...overrides,
  };

  const result = await testPool.query(
    `INSERT INTO education_resources (title, description, content, category, difficulty, published)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      defaultResource.title,
      defaultResource.description,
      defaultResource.content,
      defaultResource.category,
      defaultResource.difficulty,
      defaultResource.published,
    ]
  );

  return result.rows[0];
};

/**
 * Create a test wiki entry
 */
export const createTestWikiEntry = async (overrides: Partial<any> = {}) => {
  const randomId = Math.random().toString(36).substring(7);
  const defaultEntry = {
    term: `Test Term ${Date.now()}-${randomId}`,
    slug: `test-term-${Date.now()}-${randomId}`,
    definition: 'This is a test definition',
    content: JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'Test content' }] }] } }),
    published: true,
    ...overrides,
  };

  const result = await testPool.query(
    `INSERT INTO wiki_entries (term, slug, definition, content, published)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      defaultEntry.term,
      defaultEntry.slug,
      defaultEntry.definition,
      defaultEntry.content,
      defaultEntry.published,
    ]
  );

  return result.rows[0];
};

/**
 * Create test site settings
 * Settings are stored as key-value pairs in the database
 */
export const createTestSiteSettings = async (overrides: Partial<any> = {}) => {
  const defaultSettings = {
    contact_email: 'test@example.com',
    instagram_url: 'https://instagram.com/test',
    linkedin_url: 'https://linkedin.com/test',
    address: 'Test Address',
    featured_education_ids: [],
    featured_blog_ids: [],
    ...overrides,
  };

  // Delete existing settings to start fresh
  await testPool.query('DELETE FROM site_settings');

  // Insert each setting as a key-value pair
  for (const [key, value] of Object.entries(defaultSettings)) {
    const settingValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
    await testPool.query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, settingValue]
    );
  }

  return defaultSettings;
};

