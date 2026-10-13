import { describe, it, expect, vi, beforeEach } from 'vitest';

// Substitui o módulo do TMDB: nenhum teste faz chamada real
vi.mock('../src/services/tmdb.service.js', () => ({
  getMovieDetails: vi.fn(),
}));

import { generateRecommendations } from '../src/services/recommendations.service.js';
import { getMovieDetails } from '../src/services/tmdb.service.js';
import { GENRE_PROFILES } from '../src/data/genre-profiles.js';
import { HttpError } from '../src/utils/http-error.js';

// Fabrica um filme fictício no formato devolvido por getMovieDetails
function fakeMovie(id, genreIds = [878], composers = []) {
  return {
    id,
    title: `Filme ${id}`,
    tagline: null,
    overview: 'Sinopse que não deve aparecer na resposta.',
    releaseDate: '2014-01-01',
    posterUrl: null,
    genres: genreIds.map((genreId) => ({ id: genreId, name: `Gênero ${genreId}` })),
    composers,
  };
}

beforeEach(() => {
  getMovieDetails.mockReset();
});

describe('generateRecommendations', () => {
  it('busca cada filme uma vez e mantém a ordem dos IDs recebidos', async () => {
    getMovieDetails.mockImplementation(async (id) => fakeMovie(id));

    const result = await generateRecommendations([157336, 335984, 64690]);

    expect(getMovieDetails).toHaveBeenCalledTimes(3);
    expect(getMovieDetails).toHaveBeenCalledWith(157336);
    expect(getMovieDetails).toHaveBeenCalledWith(335984);
    expect(getMovieDetails).toHaveBeenCalledWith(64690);
    expect(result.movies.map((movie) => movie.id)).toEqual([157336, 335984, 64690]);
  });

  it('separa o dado verificado do TMDB (compositores) do perfil baseado em regras', async () => {
    getMovieDetails.mockResolvedValue(fakeMovie(1, [878], ['Pessoa A']));

    const result = await generateRecommendations([1]);

    expect(result.verified).toEqual({
      source: 'tmdb',
      composers: [{ movieId: 1, title: 'Filme 1', names: ['Pessoa A'] }],
    });
    expect(result.ruleBased.method).toBe('rules');
    expect(result.ruleBased.tracksIncluded).toBe(false);
    expect(result.ruleBased.disclaimer.length).toBeGreaterThan(0);
    expect(result.ruleBased.styles).toEqual(GENRE_PROFILES[878].styles);
  });

  it('a resposta tem exatamente as chaves previstas, sem faixas ou artistas', async () => {
    getMovieDetails.mockResolvedValue(fakeMovie(1));

    const result = await generateRecommendations([1]);

    expect(Object.keys(result)).toEqual(['movies', 'verified', 'ruleBased']);
    expect(Object.keys(result.ruleBased)).toEqual([
      'method',
      'tracksIncluded',
      'disclaimer',
      'styles',
      'moods',
      'instrumentation',
      'searchTerms',
      'basedOnGenres',
      'unmappedGenres',
    ]);
  });

  it('devolve só os campos necessários de cada filme', async () => {
    getMovieDetails.mockResolvedValue(fakeMovie(1, [18]));

    const result = await generateRecommendations([1]);

    expect(result.movies).toEqual([
      {
        id: 1,
        title: 'Filme 1',
        releaseDate: '2014-01-01',
        posterUrl: null,
        genres: [{ id: 18, name: 'Gênero 18' }],
      },
    ]);
  });

  it('usa lista vazia quando o filme não traz compositores', async () => {
    const movie = fakeMovie(1);
    delete movie.composers;
    getMovieDetails.mockResolvedValue(movie);

    const result = await generateRecommendations([1]);

    expect(result.verified.composers).toEqual([{ movieId: 1, title: 'Filme 1', names: [] }]);
  });

  it('responde 404 informando o ID que não existe', async () => {
    getMovieDetails.mockImplementation(async (id) => {
      if (id === 2) throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Filme não encontrado.');
      return fakeMovie(id);
    });

    await expect(generateRecommendations([1, 2, 3])).rejects.toMatchObject({
      statusCode: 404,
      code: 'MOVIE_NOT_FOUND',
      details: { missingMovieIds: [2] },
    });
  });

  it('lista todos os IDs inexistentes quando mais de um falha', async () => {
    getMovieDetails.mockRejectedValue(new HttpError(404, 'MOVIE_NOT_FOUND', 'Filme não encontrado.'));

    await expect(generateRecommendations([10, 20])).rejects.toMatchObject({
      statusCode: 404,
      details: { missingMovieIds: [10, 20] },
    });
  });

  it('falha de infraestrutura tem prioridade sobre "filme não encontrado"', async () => {
    getMovieDetails.mockImplementation(async (id) => {
      if (id === 1) throw new HttpError(502, 'UPSTREAM_UNAVAILABLE', 'Indisponível.');
      throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Filme não encontrado.');
    });

    await expect(generateRecommendations([1, 2])).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('propaga erros inesperados sem transformá-los', async () => {
    getMovieDetails.mockRejectedValue(new Error('boom'));

    await expect(generateRecommendations([1])).rejects.toMatchObject({ message: 'boom' });
  });
});