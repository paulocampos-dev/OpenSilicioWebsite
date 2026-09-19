import request from 'supertest';
import app from '../../server';

/**
 * A produção respondeu 429 em todo `/api/*` porque o app não confiava no proxy:
 * atrás do nginx do host, `req.ip` era sempre o endereço do nginx e todos os
 * visitantes dividiam um balde só do rate limit. Estes dois casos falham se o
 * `trust proxy` sumir de novo.
 */
describe('rate limit atrás do proxy', () => {
  it('confia em um salto de proxy por padrão', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('dá um balde por visitante, e não um por proxy', async () => {
    // Dois visitantes distintos chegando pelo mesmo proxy. Sem `trust proxy` os
    // dois caem no mesmo balde e o segundo enxerga uma sobra a menos.
    const primeiro = await request(app).get('/api/wiki').set('X-Forwarded-For', '203.0.113.1');
    const segundo = await request(app).get('/api/wiki').set('X-Forwarded-For', '203.0.113.2');

    expect(primeiro.headers['ratelimit-remaining']).toBe(segundo.headers['ratelimit-remaining']);
  });
});
