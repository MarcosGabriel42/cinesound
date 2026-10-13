import { describe, it, expect } from 'vitest';
import { buildMusicProfile } from '../src/services/music-profile.service.js';
import { GENRE_PROFILES } from '../src/data/genre-profiles.js';

// Tabela FALSA, só para testar a lógica. Assim os testes não quebram
// quando você ajustar a tabela editorial real.
const FIXTURE = {
  1: { styles: ['s1', 's2'], moods: ['m1'], instrumentation: ['i1'], searchTerms: ['t1'] },
  2: { styles: ['s2', 's3'], moods: ['m2'], instrumentation: ['i1', 'i2'], searchTerms: ['t2'] },
  3: { styles: ['s4'], moods: ['m3'], instrumentation: ['i3'], searchTerms: ['t3'] },
};

const EMPTY_PROFILE = {
  styles: [],
  moods: [],
  instrumentation: [],
  searchTerms: [],
  basedOnGenres: [],
  unmappedGenres: [],
};

const g = (id, name = `G${id}`) => ({ id, name });

describe('buildMusicProfile (com tabela de teste)', () => {
  it('um filme com um gênero devolve exatamente o perfil daquele gênero', () => {
    const profile = buildMusicProfile([{ genres: [g(1)] }], FIXTURE);

    expect(profile).toEqual({
      styles: ['s1', 's2'],
      moods: ['m1'],
      instrumentation: ['i1'],
      searchTerms: ['t1'],
      basedOnGenres: [{ id: 1, name: 'G1', movieCount: 1 }],
      unmappedGenres: [],
    });
  });

  it('um gênero em comum entre filmes pesa mais e vem primeiro', () => {
    const profile = buildMusicProfile(
      [{ genres: [g(1), g(2)] }, { genres: [g(2), g(3)] }],
      FIXTURE,
    );

    // gênero 2 aparece em 2 filmes: s2 = 2 + 1 = 3, s3 = 2, depois s1 e s4 com 1
    expect(profile.styles).toEqual(['s2', 's3', 's1', 's4']);
    // i1 vem do gênero 2 (2) e do gênero 1 (1) = 3; i2 = 2; i3 = 1
    expect(profile.instrumentation).toEqual(['i1', 'i2', 'i3']);
    expect(profile.basedOnGenres).toEqual([
      { id: 2, name: 'G2', movieCount: 2 },
      { id: 1, name: 'G1', movieCount: 1 },
      { id: 3, name: 'G3', movieCount: 1 },
    ]);
  });

  it('gênero repetido dentro do mesmo filme conta uma vez só', () => {
    const profile = buildMusicProfile([{ genres: [g(1), g(1)] }], FIXTURE);

    expect(profile.basedOnGenres).toEqual([{ id: 1, name: 'G1', movieCount: 1 }]);
  });

  it('gênero sem regra vai para unmappedGenres, sem derrubar o resto', () => {
    const profile = buildMusicProfile([{ genres: [g(1), g(999, 'Sem regra')] }], FIXTURE);

    expect(profile.styles).toEqual(['s1', 's2']);
    expect(profile.basedOnGenres).toEqual([{ id: 1, name: 'G1', movieCount: 1 }]);
    expect(profile.unmappedGenres).toEqual([{ id: 999, name: 'Sem regra' }]);
  });

  it.each([
    [[]],
    [undefined],
    [null],
    [[{}]],
    [[{ genres: null }]],
    [[{ genres: [null, { name: 'sem id' }, { id: '1' }] }]],
  ])('entrada vazia ou malformada devolve perfil vazio sem lançar erro (%j)', (input) => {
    expect(buildMusicProfile(input, FIXTURE)).toEqual(EMPTY_PROFILE);
  });

  it('limita cada categoria a 6 termos, mantendo os primeiros', () => {
    const bigTable = {
      1: {
        styles: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        moods: ['m'],
        instrumentation: ['i'],
        searchTerms: ['t'],
      },
    };

    const profile = buildMusicProfile([{ genres: [g(1)] }], bigTable);

    expect(profile.styles).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('a ordem dos filmes na entrada não altera o resultado', () => {
    const a = { genres: [g(1), g(2)] };
    const b = { genres: [g(2), g(3)] };

    expect(buildMusicProfile([a, b], FIXTURE)).toEqual(buildMusicProfile([b, a], FIXTURE));
  });

  it('devolve exatamente as chaves previstas, sem campos de faixas ou artistas', () => {
    const profile = buildMusicProfile([{ genres: [g(1)] }], FIXTURE);

    expect(Object.keys(profile)).toEqual([
      'styles',
      'moods',
      'instrumentation',
      'searchTerms',
      'basedOnGenres',
      'unmappedGenres',
    ]);
  });

  it('não altera os filmes recebidos', () => {
    const input = [{ genres: [g(1), g(2)] }, { genres: [g(2)] }];
    const copy = structuredClone(input);

    buildMusicProfile(input, FIXTURE);

    expect(input).toEqual(copy);
  });

  it('não expõe as listas internas da tabela: alterar o resultado não afeta chamadas futuras', () => {
    const first = buildMusicProfile([{ genres: [g(1)] }], FIXTURE);
    first.styles.push('intruso');

    const second = buildMusicProfile([{ genres: [g(1)] }], FIXTURE);

    expect(second.styles).toEqual(['s1', 's2']);
    expect(FIXTURE[1].styles).toEqual(['s1', 's2']);
  });
});

describe('buildMusicProfile (com a tabela real do projeto)', () => {
  it('usa a tabela real por padrão: um filme de ficção científica (878)', () => {
    const profile = buildMusicProfile([{ genres: [{ id: 878, name: 'Ficção científica' }] }]);

    expect(profile.styles).toEqual(GENRE_PROFILES[878].styles);
    expect(profile.moods).toEqual(GENRE_PROFILES[878].moods);
    expect(profile.instrumentation).toEqual(GENRE_PROFILES[878].instrumentation);
    expect(profile.searchTerms).toEqual(GENRE_PROFILES[878].searchTerms);
    expect(profile.unmappedGenres).toEqual([]);
  });
});