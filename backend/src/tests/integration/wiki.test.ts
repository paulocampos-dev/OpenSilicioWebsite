import request from 'supertest';
import app from '../../server';
import { cleanDatabase, createTestWikiEntry } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';

describe('Wiki API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/wiki', () => {
    it('should return wiki entries with pagination', async () => {
      // Create test entries
      await createTestWikiEntry({ term: 'Term 1', published: true });
      await createTestWikiEntry({ term: 'Term 2', published: true });
      await createTestWikiEntry({ term: 'Draft Term', published: false });

      const response = await request(app)
        .get('/api/wiki')
        .query({ published: true, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check structure matches frontend expectations
      if (response.body.data.length > 0) {
        const entry = response.body.data[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('term');
        expect(entry).toHaveProperty('slug');
        expect(entry).toHaveProperty('definition');
        expect(entry).toHaveProperty('content');
        expect(entry).toHaveProperty('published');
        expect(entry).toHaveProperty('created_at');
        expect(entry).toHaveProperty('updated_at');
      }
    });

    it('should filter by published status', async () => {
      await createTestWikiEntry({ term: 'Published Term', published: true });
      await createTestWikiEntry({ term: 'Draft Term', published: false });

      const response = await request(app)
        .get('/api/wiki')
        .query({ published: true });

      expect(response.status).toBe(200);
      expect(response.body.data.every((entry: any) => entry.published === true)).toBe(true);
    });
  });

  describe('GET /api/wiki/:slug', () => {
    it('should return wiki entry by slug', async () => {
      const testEntry = await createTestWikiEntry({ 
        term: 'Test Term',
        slug: 'test-term-slug',
        published: true 
      });

      const response = await request(app)
        .get('/api/wiki/test-term-slug');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testEntry.id);
      expect(response.body).toHaveProperty('slug', 'test-term-slug');
      expect(response.body).toHaveProperty('term', 'Test Term');
      expect(response.body).toHaveProperty('definition');
      expect(response.body).toHaveProperty('content');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/wiki/non-existent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/wiki', () => {
    it('should create a new wiki entry when authenticated', async () => {
      const token = await getAuthToken();

      const newEntry = {
        term: 'New Wiki Term',
        slug: 'new-wiki-term',
        definition: 'This is a new definition',
        content: JSON.stringify({ root: { children: [] } }),
        published: false,
      };

      const response = await request(app)
        .post('/api/wiki')
        .set('Authorization', `Bearer ${token}`)
        .send(newEntry);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('term', newEntry.term);
      expect(response.body).toHaveProperty('slug', newEntry.slug);
      expect(response.body).toHaveProperty('definition', newEntry.definition);
      expect(response.body).toHaveProperty('content', newEntry.content);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/wiki')
        .send({
          term: 'Test Term',
          slug: 'test-term',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/wiki/:id', () => {
    it('should update wiki entry when authenticated', async () => {
      const token = await getAuthToken();
      const testEntry = await createTestWikiEntry({ term: 'Original Term' });

      const updateData = {
        term: 'Updated Term',
        definition: 'Updated definition',
      };

      const response = await request(app)
        .put(`/api/wiki/${testEntry.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testEntry.id);
      expect(response.body).toHaveProperty('term', 'Updated Term');
      expect(response.body).toHaveProperty('definition', 'Updated definition');
    });

    it('should reject unauthenticated requests', async () => {
      const testEntry = await createTestWikiEntry();

      const response = await request(app)
        .put(`/api/wiki/${testEntry.id}`)
        .send({ term: 'Updated Term' });

      expect(response.status).toBe(401);
    });
  });
});

