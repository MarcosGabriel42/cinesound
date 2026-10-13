import { HttpError } from '../utils/http-error.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const REQUEST_TIMEOUT_MS = 8000;
const COMPOSER_JOBS = ['Original Music Composer', 'Composer'];

// Função interna: toda chamada ao TMDB passa por aqui
async function tmdbFetch(path, params = {}, { notFoundError } = {}) {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    console.error('TMDB_ACCESS_TOKEN não está configurado.');
    throw new HttpError(500, 'SERVER_MISCONFIGURED', 'Serviço indisponível no momento.');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Rede fora do ar, timeout, DNS... Logamos só o tipo do erro, nunca a requisição
    console.error('Falha de comunicação com o TMDB:', err.name);
    throw new HttpError(502, 'UPSTREAM_UNAVAILABLE', 'Não foi possível consultar o serviço de filmes.');
  }

  if (response.status === 401) {
    console.error('O TMDB rejeitou a credencial (401).');
    throw new HttpError(502, 'UPSTREAM_AUTH_ERROR', 'Falha ao acessar o serviço de filmes.');
  }
  // 404 só é tratado como "não encontrado" quando quem chama pede isso
  if (response.status === 404 && notFoundError) {
    throw notFoundError;
  }
  if (response.status === 429) {
    throw new HttpError(503, 'UPSTREAM_RATE_LIMITED', 'Serviço de filmes sobrecarregado. Tente novamente em instantes.');
  }
  if (!response.ok) {
    console.error('TMDB respondeu com status', response.status);
    throw new HttpError(502, 'UPSTREAM_ERROR', 'Erro ao consultar o serviço de filmes.');
  }

  return response.json();
}

// Converte o formato do TMDB para o formato da NOSSA API
function mapMovieSummary(movie) {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    releaseDate: movie.release_date || null,
    posterUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
    genreIds: movie.genre_ids ?? [],
  };
}

export async function searchMovies(query) {
  const data = await tmdbFetch('/search/movie', {
    query,
    language: 'pt-BR',
    include_adult: 'false',
    page: '1',
  });

  if (!Array.isArray(data?.results)) {
    throw new HttpError(502, 'UPSTREAM_INVALID_RESPONSE', 'Resposta inesperada do serviço de filmes.');
  }

  return data.results.map(mapMovieSummary);
}

function mapMovieDetails(movie) {
  const crew = Array.isArray(movie.credits?.crew) ? movie.credits.crew : [];
  const composers = crew
    .filter((person) => COMPOSER_JOBS.includes(person.job) && person.name)
    .map((person) => person.name);

  return {
    id: movie.id,
    title: movie.title,
    tagline: movie.tagline || null,
    overview: movie.overview,
    releaseDate: movie.release_date || null,
    posterUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
    genres: (movie.genres ?? []).map((genre) => ({ id: genre.id, name: genre.name })),
    composers: [...new Set(composers)], // remove nomes repetidos
  };
}

export async function getMovieDetails(id) {
  const data = await tmdbFetch(
    `/movie/${id}`,
    { language: 'pt-BR', append_to_response: 'credits' },
    { notFoundError: new HttpError(404, 'MOVIE_NOT_FOUND', 'Filme não encontrado.') },
  );

  if (!data || typeof data.id !== 'number' || typeof data.title !== 'string') {
    throw new HttpError(502, 'UPSTREAM_INVALID_RESPONSE', 'Resposta inesperada do serviço de filmes.');
  }

  return mapMovieDetails(data);
}