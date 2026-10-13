import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchMovies, getMovieDetails } from '../src/services/tmdb.service.js';

// Imita o objeto de resposta do fetch
function fakeResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  process.env.TMDB_ACCESS_TOKEN = 'token-falso-de-teste';
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getMovieDetails', () => {
  it('converte os detalhes, com nomes de gêneros e compositores sem repetição', async () => {
    fetch.mockResolvedValue(
      fakeResponse({
        id: 157336,
        title: 'Título de Teste',
        tagline: 'Frase de teste.',
        overview: 'Sinopse de teste.',
        release_date: '2014-11-05',
        poster_path: '/abc.jpg',
        genres: [
          { id: 12, name: 'Aventura' },
          { id: 878, name: 'Ficção científica' },
        ],
        credits: {
          crew: [
            { name: 'Pessoa A', job: 'Original Music Composer' },
            { name: 'Pessoa A', job: 'Composer' },
            { name: 'Pessoa B', job: 'Director' },
          ],
        },
      }),
    );

    const movie = await getMovieDetails(157336);

    expect(movie).toEqual({
      id: 157336,
      title: 'Título de Teste',
      tagline: 'Frase de teste.',
      overview: 'Sinopse de teste.',
      releaseDate: '2014-11-05',
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      genres: [
        { id: 12, name: 'Aventura' },
        { id: 878, name: 'Ficção científica' },
      ],
      composers: ['Pessoa A'],
    });
  });

  it('chama o endpoint certo, pedindo os créditos junto', async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 1, title: 'X' }));

    await getMovieDetails(157336);

    const [url] = fetch.mock.calls[0];
    expect(url.pathname).toBe('/3/movie/157336');
    expect(url.searchParams.get('append_to_response')).toBe('credits');
  });

  it('retorna listas vazias quando não há créditos nem gêneros', async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 1, title: 'X', poster_path: null, release_date: '' }));

    const movie = await getMovieDetails(1);

    expect(movie.composers).toEqual([]);
    expect(movie.genres).toEqual([]);
    expect(movie.posterUrl).toBeNull();
    expect(movie.releaseDate).toBeNull();
    expect(movie.tagline).toBeNull();
  });

  it('traduz 404 do TMDB em MOVIE_NOT_FOUND (404)', async () => {
    fetch.mockResolvedValue(fakeResponse({ status_message: 'not found' }, 404));

    await expect(getMovieDetails(999999999)).rejects.toMatchObject({
      statusCode: 404,
      code: 'MOVIE_NOT_FOUND',
    });
  });

  it('rejeita resposta com formato inesperado', async () => {
    fetch.mockResolvedValue(fakeResponse({ algo: 'diferente' }));

    await expect(getMovieDetails(1)).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_INVALID_RESPONSE',
    });
  });

  it('não muda o comportamento da busca: 404 na busca continua sendo 502', async () => {
    fetch.mockResolvedValue(fakeResponse({}, 404));

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_ERROR',
    });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.TMDB_ACCESS_TOKEN;
});

describe('searchMovies', () => {
  it('converte o formato do TMDB para o formato da API', async () => {
    fetch.mockResolvedValue(
      fakeResponse({
        results: [
          {
            id: 157336,
            title: 'Título de Teste',
            overview: 'Sinopse de teste.',
            release_date: '2014-11-05',
            poster_path: '/abc.jpg',
            genre_ids: [12, 18],
          },
        ],
      }),
    );

    const result = await searchMovies('interstellar');

    expect(result).toEqual([
      {
        id: 157336,
        title: 'Título de Teste',
        overview: 'Sinopse de teste.',
        releaseDate: '2014-11-05',
        posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
        genreIds: [12, 18],
      },
    ]);
  });

  it('envia o token no cabeçalho e a busca codificada na URL', async () => {
    fetch.mockResolvedValue(fakeResponse({ results: [] }));

    await searchMovies('blade runner 2049');

    const [url, options] = fetch.mock.calls[0];
    expect(url.toString()).toContain('/search/movie');
    expect(url.searchParams.get('query')).toBe('blade runner 2049');
    expect(options.headers.Authorization).toBe('Bearer token-falso-de-teste');
  });

  it('usa null quando o filme não tem pôster nem data', async () => {
    fetch.mockResolvedValue(
      fakeResponse({ results: [{ id: 1, title: 'X', overview: '', release_date: '', poster_path: null }] }),
    );

    const [movie] = await searchMovies('x');

    expect(movie.posterUrl).toBeNull();
    expect(movie.releaseDate).toBeNull();
    expect(movie.genreIds).toEqual([]);
  });

  it('traduz 401 do TMDB em 502 sem vazar detalhes', async () => {
    fetch.mockResolvedValue(fakeResponse({ status_message: 'Invalid API key' }, 401));

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_AUTH_ERROR',
    });
  });

  it('traduz 429 do TMDB em 503', async () => {
    fetch.mockResolvedValue(fakeResponse({}, 429));

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 503,
      code: 'UPSTREAM_RATE_LIMITED',
    });
  });

  it('traduz falha de rede em 502', async () => {
    fetch.mockRejectedValue(new Error('ECONNRESET'));

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('rejeita resposta com formato inesperado', async () => {
    fetch.mockResolvedValue(fakeResponse({ algo: 'diferente' }));

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_INVALID_RESPONSE',
    });
  });

  it('falha com 500 se o token não estiver configurado, sem chamar o TMDB', async () => {
    delete process.env.TMDB_ACCESS_TOKEN;

    await expect(searchMovies('x')).rejects.toMatchObject({
      statusCode: 500,
      code: 'SERVER_MISCONFIGURED',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});