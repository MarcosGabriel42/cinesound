import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Aqui o que se substitui é o service de recomendações: testamos rota + controller
vi.mock('../src/services/recommendations.service.js', () => ({
  generateRecommendations: vi.fn(),
}));

import app from '../src/app.js';
import { generateRecommendations } from '../src/services/recommendations.service.js';
import { HttpError } from '../src/utils/http-error.js';

const FAKE_RESULT = {
  movies: [],
  verified: { source: 'tmdb', composers: [] },
  ruleBased: { method: 'rules', tracksIncluded: false },
};

beforeEach(() => {
  generateRecommendations.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/recommendations', () => {
  it('retorna 400 quando a requisição não tem corpo', async () => {
    const res = await request(app).post('/api/recommendations');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_MOVIE_IDS');
    expect(generateRecommendations).not.toHaveBeenCalled();
  });

  it.each([
    [{}],
    [{ movieIds: 'abc' }],
    [{ movieIds: 157336 }],
    [{ movieIds: [] }],
    [{ movieIds: [1, 2, 3, 4, 5, 6] }],
    [{ movieIds: ['157336'] }],
    [{ movieIds: [1.5] }],
    [{ movieIds: [-1] }],
    [{ movieIds: [0] }],
    [{ movieIds: [12345678901] }],
    [{ movieIds: [null] }],
  ])('retorna 400 para o corpo %j sem chamar o service', async (body) => {
    const res = await request(app).post('/api/recommendations').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_MOVIE_IDS');
    expect(generateRecommendations).not.toHaveBeenCalled();
  });

  it('informa em details as posições dos IDs inválidos', async () => {
    const res = await request(app)
      .post('/api/recommendations')
      .send({ movieIds: [1, 'x', 3, -5] });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ invalidPositions: [1, 3] });
  });

  it('retorna 400 INVALID_JSON para JSON malformado', async () => {
    const res = await request(app)
      .post('/api/recommendations')
      .set('Content-Type', 'application/json')
      .send('{ "movieIds": [1, 2,');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('retorna 200 e chama o service com os IDs numéricos', async () => {
    generateRecommendations.mockResolvedValue(FAKE_RESULT);

    const res = await request(app)
      .post('/api/recommendations')
      .send({ movieIds: [157336, 335984, 64690] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(FAKE_RESULT);
    expect(generateRecommendations).toHaveBeenCalledWith([157336, 335984, 64690]);
  });

  it('remove IDs repetidos antes de chamar o service', async () => {
    generateRecommendations.mockResolvedValue(FAKE_RESULT);

    const res = await request(app).post('/api/recommendations').send({ movieIds: [1, 1, 2] });

    expect(res.status).toBe(200);
    expect(generateRecommendations).toHaveBeenCalledWith([1, 2]);
  });

  it('aceita exatamente 5 filmes', async () => {
    generateRecommendations.mockResolvedValue(FAKE_RESULT);

    const res = await request(app).post('/api/recommendations').send({ movieIds: [1, 2, 3, 4, 5] });

    expect(res.status).toBe(200);
    expect(generateRecommendations).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
  });

  it('propaga o 404 do service com os IDs inexistentes', async () => {
    generateRecommendations.mockRejectedValue(
      new HttpError(404, 'MOVIE_NOT_FOUND', 'Um ou mais filmes não foram encontrados.', {
        missingMovieIds: [999999999],
      }),
    );

    const res = await request(app).post('/api/recommendations').send({ movieIds: [999999999] });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('MOVIE_NOT_FOUND');
    expect(res.body.error.details).toEqual({ missingMovieIds: [999999999] });
  });

  it('propaga erros do serviço externo (502)', async () => {
    generateRecommendations.mockRejectedValue(new HttpError(502, 'UPSTREAM_UNAVAILABLE', 'Indisponível.'));

    const res = await request(app).post('/api/recommendations').send({ movieIds: [1] });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
  });

  it('retorna 500 genérico, sem vazar detalhes, em erros inesperados', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    generateRecommendations.mockRejectedValue(new Error('segredo-interno-123'));

    const res = await request(app).post('/api/recommendations').send({ movieIds: [1] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    });
    expect(JSON.stringify(res.body)).not.toContain('segredo-interno-123');
  });

  it('GET na mesma URL retorna 404 NOT_FOUND (só existe POST)', async () => {
    const res = await request(app).get('/api/recommendations');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});