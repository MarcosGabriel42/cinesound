import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Substitui o módulo inteiro do service por uma versão falsa
vi.mock('../src/services/tmdb.service.js', () => ({
  searchMovies: vi.fn(),
  getMovieDetails: vi.fn(),
}));

import app from '../src/app.js';
import { searchMovies, getMovieDetails } from '../src/services/tmdb.service.js';
import { HttpError } from '../src/utils/http-error.js';

beforeEach(() => {
  searchMovies.mockReset();
  getMovieDetails.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/movies/search', () => {
  it('retorna 400 quando "query" está ausente', async () => {
    const res = await request(app).get('/api/movies/search');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
    expect(searchMovies).not.toHaveBeenCalled();
  });

  it('retorna 400 quando "query" é só espaços', async () => {
    const res = await request(app).get('/api/movies/search?query=%20%20');

    expect(res.status).toBe(400);
    expect(searchMovies).not.toHaveBeenCalled();
  });

  it('retorna 400 quando "query" é longa demais', async () => {
    const res = await request(app).get(`/api/movies/search?query=${'a'.repeat(101)}`);

    expect(res.status).toBe(400);
    expect(searchMovies).not.toHaveBeenCalled();
  });

  it('retorna 400 quando "query" é repetida', async () => {
    const res = await request(app).get('/api/movies/search?query=a&query=b');

    expect(res.status).toBe(400);
  });

  it('retorna 200 com os resultados e remove espaços das pontas', async () => {
    const fake = [{ id: 1, title: 'Filme Fictício', overview: '', releaseDate: null, posterUrl: null, genreIds: [] }];
    searchMovies.mockResolvedValue(fake);

    const res = await request(app).get('/api/movies/search?query=%20interstellar%20');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: fake });
    expect(searchMovies).toHaveBeenCalledWith('interstellar');
  });

  it('propaga o status de erros do service', async () => {
    searchMovies.mockRejectedValue(new HttpError(502, 'UPSTREAM_UNAVAILABLE', 'Indisponível.'));

    const res = await request(app).get('/api/movies/search?query=interstellar');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
  });
});

describe('GET /api/movies/:id', () => {
  it.each(['abc', '0', '-1', '1.5', '007', '12345678901'])(
    'retorna 400 para o ID inválido "%s" sem chamar o service',
    async (badId) => {
      const res = await request(app).get(`/api/movies/${badId}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MOVIE_ID');
      expect(getMovieDetails).not.toHaveBeenCalled();
    },
  );

  it('retorna 200 com o filme e chama o service com um número', async () => {
    const fake = {
      id: 157336,
      title: 'Filme Fictício',
      tagline: null,
      overview: '',
      releaseDate: null,
      posterUrl: null,
      genres: [{ id: 18, name: 'Drama' }],
      composers: [],
    };
    getMovieDetails.mockResolvedValue(fake);

    const res = await request(app).get('/api/movies/157336');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ movie: fake });
    expect(getMovieDetails).toHaveBeenCalledWith(157336);
  });

  it('propaga o 404 do service quando o filme não existe', async () => {
    getMovieDetails.mockRejectedValue(new HttpError(404, 'MOVIE_NOT_FOUND', 'Filme não encontrado.'));

    const res = await request(app).get('/api/movies/999999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'MOVIE_NOT_FOUND', message: 'Filme não encontrado.' },
    });
  });

  it.each([
    [502, 'UPSTREAM_UNAVAILABLE'],
    [503, 'UPSTREAM_RATE_LIMITED'],
  ])('propaga o erro %i (%s) do serviço externo', async (status, code) => {
    getMovieDetails.mockRejectedValue(new HttpError(status, code, 'Falha simulada.'));

    const res = await request(app).get('/api/movies/157336');

    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });

  it('retorna 500 genérico, sem vazar detalhes, em erros inesperados do service', async () => {
    // Silencia o console.error do errorHandler só neste teste
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getMovieDetails.mockRejectedValue(new Error('segredo-interno-123'));

    const res = await request(app).get('/api/movies/157336');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    });
    expect(JSON.stringify(res.body)).not.toContain('segredo-interno-123');
  });

  it('não confunde /search com um ID', async () => {
    searchMovies.mockResolvedValue([]);

    const res = await request(app).get('/api/movies/search?query=batman');

    expect(res.status).toBe(200);
    expect(searchMovies).toHaveBeenCalledWith('batman');
    expect(getMovieDetails).not.toHaveBeenCalled();
  });
});