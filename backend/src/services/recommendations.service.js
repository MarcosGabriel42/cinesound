import { getMovieDetails } from './tmdb.service.js';
import { buildMusicProfile } from './music-profile.service.js';
import { HttpError } from '../utils/http-error.js';

const RULES_DISCLAIMER =
  'Perfil musical sugerido por regras a partir dos gêneros dos filmes. ' +
  'Não contém músicas, artistas nem trilhas sonoras específicas.';

/**
 * Gera a recomendação (versão baseada em regras) para uma lista de IDs já validados.
 * Separa explicitamente o que vem do TMDB (verified) do que vem das nossas regras (ruleBased).
 */
export async function generateRecommendations(movieIds) {
  // Chamadas em paralelo (no máximo 5). allSettled espera todas terminarem,
  // para podermos informar TODOS os IDs que não existem, e não só o primeiro.
  const settled = await Promise.allSettled(movieIds.map((id) => getMovieDetails(id)));

  const failures = settled
    .map((result, index) => ({ result, id: movieIds[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    // Falhas de infraestrutura (rede, limite de uso, credencial) têm prioridade
    // sobre "filme não encontrado": o problema não é a escolha do usuário.
    const infrastructureFailure = failures.find(
      ({ result }) => !(result.reason instanceof HttpError && result.reason.code === 'MOVIE_NOT_FOUND'),
    );
    if (infrastructureFailure) {
      throw infrastructureFailure.result.reason;
    }

    throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Um ou mais filmes não foram encontrados.', {
      missingMovieIds: failures.map(({ id }) => id),
    });
  }

  const movies = settled.map((result) => result.value);
  const profile = buildMusicProfile(movies);

  return {
    movies: movies.map(({ id, title, releaseDate, posterUrl, genres }) => ({
      id,
      title,
      releaseDate,
      posterUrl,
      genres,
    })),
    // Dado VERIFICADO: veio do TMDB
    verified: {
      source: 'tmdb',
      composers: movies.map((movie) => ({
        movieId: movie.id,
        title: movie.title,
        names: movie.composers ?? [],
      })),
    },
    // Sugestão BASEADA EM REGRAS: curadoria nossa, sem faixas nem artistas
    ruleBased: {
      method: 'rules',
      tracksIncluded: false,
      disclaimer: RULES_DISCLAIMER,
      ...profile,
    },
  };
}