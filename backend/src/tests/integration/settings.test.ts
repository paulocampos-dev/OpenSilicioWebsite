import request from 'supertest';
import app from '../../server';
import { cleanDatabase, createTestSiteSettings } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';

describe('Settings API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/settings', () => {
    it('should return site settings', async () => {
      await createTestSiteSettings({
        contact_email: 'test@example.com',
        instagram_url: 'https://instagram.com/test',
        linkedin_url: 'https://linkedin.com/test',
        address: 'Test Address',
      });

      const response = await request(app)
        .get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contact_email');
      expect(response.body).toHaveProperty('instagram_url');
      expect(response.body).toHaveProperty('linkedin_url');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('featured_education_ids');
      expect(response.body).toHaveProperty('featured_blog_ids');
      
      // Check structure matches frontend expectations
      expect(Array.isArray(response.body.featured_education_ids)).toBe(true);
      expect(Array.isArray(response.body.featured_blog_ids)).toBe(true);
    });

    it('should return default settings if none exist', async () => {
      const response = await request(app)
        .get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contact_email');
      expect(response.body).toHaveProperty('instagram_url');
      expect(response.body).toHaveProperty('linkedin_url');
      expect(response.body).toHaveProperty('address');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings when authenticated', async () => {
      const token = await getAuthToken();
      await createTestSiteSettings();

      const updateData = {
        contact_email: 'updated@example.com',
        instagram_url: 'https://instagram.com/updated',
        linkedin_url: 'https://linkedin.com/updated',
        address: 'Updated Address',
        featured_education_ids: [],
        featured_blog_ids: [],
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contact_email', 'updated@example.com');
      expect(response.body).toHaveProperty('instagram_url', 'https://instagram.com/updated');
      expect(response.body).toHaveProperty('linkedin_url', 'https://linkedin.com/updated');
      expect(response.body).toHaveProperty('address', 'Updated Address');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          contact_email: 'test@example.com',
        });

      expect(response.status).toBe(401);
    });
  });
});

