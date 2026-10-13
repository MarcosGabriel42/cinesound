import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import app from '../src/app.js';
import { HttpError } from '../src/utils/http-error.js';
import { notFoundHandler, errorHandler } from '../src/middlewares/error.middleware.js';

// Monta um app mínimo com rotas que falham de propósito,
// usando os MESMOS middlewares do app real.
function buildTestApp(routeHandler) {
  const testApp = express();
  testApp.get('/falha', routeHandler);
  testApp.use(notFoundHandler);
  testApp.use(errorHandler);
  return testApp;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tratamento de erros', () => {
  it('retorna 404 em JSON para rota inexistente', async () => {
    const res = await request(app).get('/api/rota-inexistente');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' },
    });
  });

  it('retorna 400 quando o corpo JSON é inválido', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ "movieIds": [1, 2,');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('respeita status, code e details de um HttpError', async () => {
    const testApp = buildTestApp(() => {
      throw new HttpError(422, 'VALIDATION_ERROR', 'Dados inválidos.', { campo: 'movieIds' });
    });

    const res = await request(testApp).get('/falha');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: { campo: 'movieIds' },
      },
    });
  });

  it('retorna 500 genérico e não vaza detalhes de erros inesperados', async () => {
    // Silencia o console.error só durante este teste, para não poluir a saída
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const testApp = buildTestApp(() => {
      throw new Error('segredo-interno-123');
    });

    const res = await request(testApp).get('/falha');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    });
    expect(JSON.stringify(res.body)).not.toContain('segredo-interno-123');
  });
});