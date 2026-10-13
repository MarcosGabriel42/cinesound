import { HttpError } from '../utils/http-error.js';
import { generateRecommendations } from '../services/recommendations.service.js';

const MAX_MOVIES = 5;
const MAX_MOVIE_ID = 9_999_999_999; // até 10 dígitos, como na rota GET /api/movies/:id

// Valida o corpo e devolve a lista de IDs sem repetições
function parseMovieIds(body) {
  const raw = body?.movieIds; // em Express 5, req.body é undefined quando não há corpo JSON

  if (!Array.isArray(raw)) {
    throw new HttpError(400, 'INVALID_MOVIE_IDS', 'O corpo da requisição deve conter "movieIds" como uma lista de números.');
  }
  if (raw.length === 0) {
    throw new HttpError(400, 'INVALID_MOVIE_IDS', 'A lista "movieIds" não pode ser vazia.');
  }

  const invalidPositions = [];
  raw.forEach((id, index) => {
    if (!Number.isInteger(id) || id < 1 || id > MAX_MOVIE_ID) {
      invalidPositions.push(index);
    }
  });
  if (invalidPositions.length > 0) {
    throw new HttpError(400, 'INVALID_MOVIE_IDS', 'Todos os IDs devem ser números inteiros positivos.', {
      invalidPositions: invalidPositions.slice(0, 10),
    });
  }

  const uniqueIds = [...new Set(raw)];
  if (uniqueIds.length > MAX_MOVIES) {
    throw new HttpError(400, 'INVALID_MOVIE_IDS', `Selecione no máximo ${MAX_MOVIES} filmes.`);
  }

  return uniqueIds;
}

export async function recommend(req, res) {
  const movieIds = parseMovieIds(req.body);
  const result = await generateRecommendations(movieIds);
  res.status(200).json(result);
}