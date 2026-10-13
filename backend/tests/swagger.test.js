
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Swagger documentation', () => {
  it('GET /api/docs should return the Swagger UI', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('GET /api/docs.json should return the OpenAPI document', async () => {
    const response = await request(app).get('/api/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
  });

  it('should document all four API endpoints', async () => {
    const response = await request(app).get('/api/docs.json');

    expect(response.status).toBe(200);

    expect(response.body.paths).toHaveProperty('/api/health');
    expect(response.body.paths).toHaveProperty('/api/movies/search');
    expect(response.body.paths).toHaveProperty('/api/movies/{id}');
    expect(response.body.paths).toHaveProperty('/api/recommendations');
  });
});
