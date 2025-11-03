import request from 'supertest';
import app from '../../server';
import { cleanDatabase, createTestBlogPost } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';

describe('Blog API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/blog', () => {
    it('should return blog posts with pagination', async () => {
      // Create test posts
      await createTestBlogPost({ title: 'Post 1', published: true });
      await createTestBlogPost({ title: 'Post 2', published: true });
      await createTestBlogPost({ title: 'Draft Post', published: false });

      const response = await request(app)
        .get('/api/blog')
        .query({ published: true, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check structure matches frontend expectations
      if (response.body.data.length > 0) {
        const post = response.body.data[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('slug');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('excerpt');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post).toHaveProperty('category');
        expect(post).toHaveProperty('published');
        expect(post).toHaveProperty('created_at');
        expect(post).toHaveProperty('updated_at');
      }
    });

    it('should filter by published status', async () => {
      await createTestBlogPost({ title: 'Published Post', published: true });
      await createTestBlogPost({ title: 'Draft Post', published: false });

      const response = await request(app)
        .get('/api/blog')
        .query({ published: true });

      expect(response.status).toBe(200);
      expect(response.body.data.every((post: any) => post.published === true)).toBe(true);
    });
  });

  describe('GET /api/blog/:slug', () => {
    it('should return blog post by slug', async () => {
      const testPost = await createTestBlogPost({ 
        title: 'Test Post',
        slug: 'test-post-slug',
        published: true 
      });

      const response = await request(app)
        .get('/api/blog/test-post-slug');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testPost.id);
      expect(response.body).toHaveProperty('slug', 'test-post-slug');
      expect(response.body).toHaveProperty('title', 'Test Post');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/blog/non-existent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/blog/categories/list', () => {
    it('should return list of categories', async () => {
      await createTestBlogPost({ category: 'Eletrônica' });
      await createTestBlogPost({ category: 'Circuitos Integrados' });

      const response = await request(app)
        .get('/api/blog/categories/list');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/blog', () => {
    it('should create a new blog post when authenticated', async () => {
      const token = await getAuthToken();

      const newPost = {
        title: 'New Blog Post',
        slug: 'new-blog-post',
        excerpt: 'This is a new post',
        content: JSON.stringify({ root: { children: [] } }),
        author: 'Test Author',
        category: 'Eletrônica',
        published: false,
      };

      const response = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${token}`)
        .send(newPost);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newPost.title);
      expect(response.body).toHaveProperty('slug', newPost.slug);
      expect(response.body).toHaveProperty('content', newPost.content);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/blog')
        .send({
          title: 'Test Post',
          slug: 'test-post',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/blog/:id', () => {
    it('should update blog post when authenticated', async () => {
      const token = await getAuthToken();
      const testPost = await createTestBlogPost({ title: 'Original Title' });

      const updateData = {
        title: 'Updated Title',
        excerpt: 'Updated excerpt',
      };

      const response = await request(app)
        .put(`/api/blog/${testPost.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testPost.id);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('excerpt', 'Updated excerpt');
    });

    it('should reject unauthenticated requests', async () => {
      const testPost = await createTestBlogPost();

      const response = await request(app)
        .put(`/api/blog/${testPost.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
    });
  });
});

