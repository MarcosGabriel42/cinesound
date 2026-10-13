import { GENRE_PROFILES } from '../data/genre-profiles.js';

const MAX_TERMS_PER_CATEGORY = 6;
const CATEGORIES = ['styles', 'moods', 'instrumentation', 'searchTerms'];

/**
 * Constrói um perfil musical SUGERIDO a partir dos gêneros dos filmes.
 *
 * - Função pura: sem HTTP, sem .env, sem chamadas externas.
 * - Baseada em regras (tabela editorial). NÃO retorna músicas, artistas nem trilhas reais.
 *
 * @param {Array<{ genres?: Array<{ id: number, name?: string }> }>} movies
 *   Filmes no formato devolvido por getMovieDetails.
 * @param {Record<number, object>} [profiles]
 *   Tabela de regras. O padrão é a tabela do projeto; os testes injetam uma tabela própria.
 */
export function buildMusicProfile(movies, profiles = GENRE_PROFILES) {
  // 1. Conta em quantos filmes cada gênero aparece (repetido no mesmo filme conta uma vez)
  const genreStats = new Map();
  for (const movie of Array.isArray(movies) ? movies : []) {
    const seenInThisMovie = new Set();
    for (const genre of Array.isArray(movie?.genres) ? movie.genres : []) {
      if (!Number.isInteger(genre?.id) || seenInThisMovie.has(genre.id)) continue;
      seenInThisMovie.add(genre.id);

      const stats = genreStats.get(genre.id);
      if (stats) {
        stats.movieCount += 1;
      } else {
        genreStats.set(genre.id, {
          id: genre.id,
          name: typeof genre.name === 'string' ? genre.name : '',
          movieCount: 1,
        });
      }
    }
  }

  // 2. Ordem determinística: mais frequentes primeiro; empate resolvido pelo ID.
  //    Assim a ordem dos filmes na entrada não altera o resultado.
  const genres = [...genreStats.values()].sort(
    (a, b) => b.movieCount - a.movieCount || a.id - b.id,
  );
  const mapped = genres.filter((genre) => Object.hasOwn(profiles, genre.id));
  const unmapped = genres.filter((genre) => !Object.hasOwn(profiles, genre.id));

  // 3. Cada termo recebe um peso = soma das contagens dos gêneros que o citam
  const result = {};
  for (const category of CATEGORIES) {
    const weights = new Map(); // o Map preserva a ordem de inserção
    for (const genre of mapped) {
      for (const term of profiles[genre.id][category] ?? []) {
        weights.set(term, (weights.get(term) ?? 0) + genre.movieCount);
      }
    }

    // sort() é estável: em empate de peso, vale a ordem de inserção
    result[category] = [...weights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TERMS_PER_CATEGORY)
      .map(([term]) => term);
  }

  // 4. Conjunto FIXO de chaves: nada de faixas ou artistas aqui
  return {
    styles: result.styles,
    moods: result.moods,
    instrumentation: result.instrumentation,
    searchTerms: result.searchTerms,
    basedOnGenres: mapped.map(({ id, name, movieCount }) => ({ id, name, movieCount })),
    unmappedGenres: unmapped.map(({ id, name }) => ({ id, name })),
  };
}