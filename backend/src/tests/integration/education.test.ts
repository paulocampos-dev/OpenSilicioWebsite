import request from 'supertest';
import app from '../../server';
import { cleanDatabase, createTestEducationResource } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';

describe('Education API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/education', () => {
    it('should return education resources with pagination', async () => {
      // Create test resources
      await createTestEducationResource({ title: 'Resource 1', published: true });
      await createTestEducationResource({ title: 'Resource 2', published: true });
      await createTestEducationResource({ title: 'Draft Resource', published: false });

      const response = await request(app)
        .get('/api/education')
        .query({ published: true, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check structure matches frontend expectations
      if (response.body.data.length > 0) {
        const resource = response.body.data[0];
        expect(resource).toHaveProperty('id');
        expect(resource).toHaveProperty('title');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('content');
        expect(resource).toHaveProperty('category');
        expect(resource).toHaveProperty('difficulty');
        expect(resource).toHaveProperty('published');
        expect(resource).toHaveProperty('created_at');
        expect(resource).toHaveProperty('updated_at');
      }
    });

    it('should filter by published status', async () => {
      await createTestEducationResource({ title: 'Published Resource', published: true });
      await createTestEducationResource({ title: 'Draft Resource', published: false });

      const response = await request(app)
        .get('/api/education')
        .query({ published: true });

      expect(response.status).toBe(200);
      const allPublished = response.body.data.every((resource: any) => resource.published === true);
      expect(allPublished).toBe(true);
    });
  });

  describe('rascunhos', () => {
    it('ficam fora do alcance de quem não está autenticado', async () => {
      await createTestEducationResource({ title: 'Publicado', published: true });
      const rascunho = await createTestEducationResource({ title: 'Rascunho', published: false });

      const lista = await request(app).get('/api/education');
      expect(lista.body.data.map((r: { title: string }) => r.title)).toEqual(['Publicado']);

      const pedindoRascunhos = await request(app).get('/api/education').query({ published: false });
      expect(pedindoRascunhos.body.data.map((r: { title: string }) => r.title)).toEqual(['Publicado']);

      const direto = await request(app).get(`/api/education/${rascunho.id}`);
      expect(direto.status).toBe(404);
    });

    it('continuam visíveis para o admin', async () => {
      const rascunho = await createTestEducationResource({ title: 'Rascunho', published: false });
      const token = await getAuthToken();

      const lista = await request(app).get('/api/education').set('Authorization', `Bearer ${token}`);
      expect(lista.body.data.map((r: { title: string }) => r.title)).toEqual(['Rascunho']);

      const direto = await request(app)
        .get(`/api/education/${rascunho.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(direto.status).toBe(200);
    });
  });

  describe('GET /api/education/:id', () => {
    it('should return education resource by ID', async () => {
      const testResource = await createTestEducationResource({ 
        title: 'Test Resource',
        published: true 
      });

      const response = await request(app)
        .get(`/api/education/${testResource.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testResource.id);
      expect(response.body).toHaveProperty('title', 'Test Resource');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('difficulty');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/education/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/education', () => {
    it('should create a new education resource when authenticated', async () => {
      const token = await getAuthToken();

      const newResource = {
        title: 'New Education Resource',
        description: 'This is a new resource',
        content: JSON.stringify({ root: { children: [] } }),
        category: 'Projetos',
        difficulty: 'Iniciante',
        published: false,
      };

      const response = await request(app)
        .post('/api/education')
        .set('Authorization', `Bearer ${token}`)
        .send(newResource);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newResource.title);
      expect(response.body).toHaveProperty('description', newResource.description);
      expect(response.body).toHaveProperty('content', newResource.content);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/education')
        .send({
          title: 'Test Resource',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/education/:id', () => {
    it('should update education resource when authenticated', async () => {
      const token = await getAuthToken();
      const testResource = await createTestEducationResource({ title: 'Original Title' });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/education/${testResource.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testResource.id);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('description', 'Updated description');
    });

    it('should reject unauthenticated requests', async () => {
      const testResource = await createTestEducationResource();

      const response = await request(app)
        .put(`/api/education/${testResource.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
    });
  });
});

