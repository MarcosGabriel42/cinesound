import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('retorna 200 com status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});