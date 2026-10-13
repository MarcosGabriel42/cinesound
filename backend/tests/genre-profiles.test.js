import { describe, it, expect } from 'vitest';
import { GENRE_PROFILES } from '../src/data/genre-profiles.js';

const CATEGORIES = ['styles', 'moods', 'instrumentation', 'searchTerms'];

// Os 19 gêneros de filmes do TMDB
const TMDB_MOVIE_GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37,
];

// Sem regra de propósito: o gênero sozinho não diz nada sobre a música
const INTENTIONALLY_UNMAPPED = [99, 10770];

describe('tabela de perfis por gênero', () => {
  it('cobre todos os 19 gêneros do TMDB: com regra ou propositalmente sem regra', () => {
    for (const id of TMDB_MOVIE_GENRE_IDS) {
      const hasRule = Object.hasOwn(GENRE_PROFILES, id);
      const isIntentionallyUnmapped = INTENTIONALLY_UNMAPPED.includes(id);

      // exatamente um dos dois: nem esquecido, nem os dois ao mesmo tempo
      expect(hasRule !== isIntentionallyUnmapped).toBe(true);
    }
  });

  it('só contém IDs de gêneros do TMDB', () => {
    const ids = Object.keys(GENRE_PROFILES).map(Number);

    expect(ids).toHaveLength(17);
    for (const id of ids) {
      expect(TMDB_MOVIE_GENRE_IDS).toContain(id);
    }
  });

  it.each(Object.keys(GENRE_PROFILES))(
    'o perfil do gênero %s tem as 4 listas preenchidas, sem termos vazios ou repetidos',
    (id) => {
      const profile = GENRE_PROFILES[id];

      for (const category of CATEGORIES) {
        const terms = profile[category];

        expect(Array.isArray(terms)).toBe(true);
        expect(terms.length).toBeGreaterThan(0);
        for (const term of terms) {
          expect(typeof term).toBe('string');
          expect(term.trim()).toBe(term);
          expect(term.length).toBeGreaterThan(0);
        }
        expect(new Set(terms).size).toBe(terms.length);
      }
    },
  );
});