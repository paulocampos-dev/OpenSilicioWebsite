import { testPool } from '../setup';

/**
 * Create a test blog post
 */
export const createTestBlogPost = async (overrides: Partial<any> = {}) => {
  const defaultPost = {
    title: 'Test Blog Post',
    slug: `test-post-${Date.now()}`,
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
  const defaultEntry = {
    term: `Test Term ${Date.now()}`,
    slug: `test-term-${Date.now()}`,
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

  // Check if settings exist
  const existing = await testPool.query('SELECT * FROM site_settings LIMIT 1');
  
  if (existing.rows.length > 0) {
    // Update existing settings
    const result = await testPool.query(
      `UPDATE site_settings 
       SET contact_email = $1, instagram_url = $2, linkedin_url = $3, address = $4,
           featured_education_ids = $5, featured_blog_ids = $6
       RETURNING *`,
      [
        defaultSettings.contact_email,
        defaultSettings.instagram_url,
        defaultSettings.linkedin_url,
        defaultSettings.address,
        JSON.stringify(defaultSettings.featured_education_ids),
        JSON.stringify(defaultSettings.featured_blog_ids),
      ]
    );
    return result.rows[0];
  } else {
    // Insert new settings
    const result = await testPool.query(
      `INSERT INTO site_settings (contact_email, instagram_url, linkedin_url, address, featured_education_ids, featured_blog_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        defaultSettings.contact_email,
        defaultSettings.instagram_url,
        defaultSettings.linkedin_url,
        defaultSettings.address,
        JSON.stringify(defaultSettings.featured_education_ids),
        JSON.stringify(defaultSettings.featured_blog_ids),
      ]
    );
    return result.rows[0];
  }
};

