import { HttpError } from '../utils/http-error.js';
import { searchMovies, getMovieDetails } from '../services/tmdb.service.js';

const MAX_QUERY_LENGTH = 100;
// Inteiro positivo, sem zeros à esquerda, até 10 dígitos
const MOVIE_ID_PATTERN = /^[1-9]\d{0,9}$/;

export async function search(req, res) {
  const raw = req.query.query;

  // Se vier ?query=a&query=b, req.query.query será um array, e não uma string
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new HttpError(400, 'INVALID_QUERY', 'O parâmetro "query" é obrigatório.');
  }

  const query = raw.trim();
  if (query.length > MAX_QUERY_LENGTH) {
    throw new HttpError(400, 'INVALID_QUERY', `O parâmetro "query" deve ter no máximo ${MAX_QUERY_LENGTH} caracteres.`);
  }

  const results = await searchMovies(query);
  res.status(200).json({ results });
}

export async function getById(req, res) {
  const { id } = req.params;

  if (!MOVIE_ID_PATTERN.test(id)) {
    throw new HttpError(400, 'INVALID_MOVIE_ID', 'O ID do filme deve ser um número inteiro positivo.');
  }

  const movie = await getMovieDetails(Number(id));
  res.status(200).json({ movie });
}