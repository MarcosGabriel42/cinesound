// Tabela EDITORIAL: ID de gênero do TMDB -> perfil musical sugerido.
//
// Importante:
// - São descritores musicais genéricos (estilos, climas, instrumentos e termos de busca).
//   Esta tabela NÃO contém títulos de músicas, nomes de artistas, álbuns ou trilhas reais.
// - É curadoria nossa, não um dado musical verificado. Pode (e deve) ser ajustada.
// - `styles`, `moods` e `instrumentation` em português; `searchTerms` em inglês,
//   porque catálogos musicais costumam usar mais termos em inglês.
//
// Gêneros do TMDB SEM regra, de propósito (o gênero sozinho não diz nada sobre a música):
//   99    Documentário
//   10770 Cinema TV

export const GENRE_PROFILES = Object.freeze({
  28: {
    // Ação
    styles: ['orquestral épico', 'rock instrumental', 'eletrônica de alta energia'],
    moods: ['intenso', 'energético', 'heroico'],
    instrumentation: ['percussão pesada', 'metais', 'guitarras elétricas', 'sintetizadores'],
    searchTerms: ['epic action score', 'high energy instrumental'],
  },
  12: {
    // Aventura
    styles: ['orquestral cinematográfico', 'folk instrumental', 'world music'],
    moods: ['empolgante', 'grandioso', 'otimista'],
    instrumentation: ['cordas', 'metais', 'percussão', 'flautas'],
    searchTerms: ['adventure score', 'epic orchestral'],
  },
  16: {
    // Animação
    styles: ['orquestral lúdico', 'pop instrumental', 'jazz leve'],
    moods: ['divertido', 'caloroso', 'imaginativo'],
    instrumentation: ['cordas', 'xilofone', 'piano', 'sopros de madeira'],
    searchTerms: ['playful orchestral', 'whimsical instrumental'],
  },
  35: {
    // Comédia
    styles: ['jazz leve', 'pop instrumental', 'swing'],
    moods: ['divertido', 'leve', 'animado'],
    instrumentation: ['piano', 'contrabaixo', 'metais leves', 'percussão leve'],
    searchTerms: ['upbeat jazz', 'light instrumental'],
  },
  80: {
    // Crime
    styles: ['jazz noir', 'soul instrumental', 'eletrônica sombria'],
    moods: ['tenso', 'sombrio', 'sofisticado'],
    instrumentation: ['contrabaixo', 'saxofone', 'bateria com vassourinhas', 'sintetizadores graves'],
    searchTerms: ['noir jazz', 'crime thriller score'],
  },
  18: {
    // Drama
    styles: ['piano minimalista', 'neoclássico'],
    moods: ['introspectivo', 'emotivo'],
    instrumentation: ['piano', 'cordas'],
    searchTerms: ['emotional piano', 'neoclassical'],
  },
  10751: {
    // Família
    styles: ['orquestral leve', 'folk acústico', 'pop instrumental'],
    moods: ['caloroso', 'alegre', 'nostálgico'],
    instrumentation: ['violão', 'piano', 'cordas', 'flautas'],
    searchTerms: ['family movie score', 'warm acoustic'],
  },
  14: {
    // Fantasia
    styles: ['orquestral épico', 'new age', 'folk celta'],
    moods: ['mágico', 'grandioso', 'misterioso'],
    instrumentation: ['harpa', 'cordas', 'coro', 'flautas'],
    searchTerms: ['fantasy orchestral', 'magical soundtrack'],
  },
  36: {
    // História
    styles: ['orquestral clássico', 'música de câmara', 'música de época'],
    moods: ['solene', 'nostálgico', 'dramático'],
    instrumentation: ['cordas', 'metais', 'cravo', 'coro'],
    searchTerms: ['historical score', 'chamber orchestral'],
  },
  27: {
    // Terror
    styles: ['dark ambient', 'drone', 'música experimental'],
    moods: ['assustador', 'opressivo', 'inquietante'],
    instrumentation: ['cordas dissonantes', 'sintetizadores', 'piano preparado', 'ruídos processados'],
    searchTerms: ['horror ambient', 'dark drone'],
  },
  10402: {
    // Música
    styles: ['musical', 'música popular da época retratada', 'canção de palco'],
    moods: ['expressivo', 'vibrante', 'emotivo'],
    instrumentation: ['banda completa', 'piano', 'vocais', 'metais'],
    searchTerms: ['musical soundtrack', 'film musical songs'],
  },
  9648: {
    // Mistério
    styles: ['jazz noir', 'ambient sombrio', 'música de câmara'],
    moods: ['misterioso', 'curioso', 'suspenso'],
    instrumentation: ['piano', 'cordas em pizzicato', 'clarinete', 'vibrafone'],
    searchTerms: ['mystery score', 'noir ambient'],
  },
  10749: {
    // Romance
    styles: ['piano romântico', 'orquestral lírico', 'folk acústico'],
    moods: ['romântico', 'terno', 'nostálgico'],
    instrumentation: ['piano', 'violino', 'violão', 'violoncelo'],
    searchTerms: ['romantic piano', 'love theme instrumental'],
  },
  878: {
    // Ficção científica
    styles: ['ambient', 'eletrônica atmosférica', 'orquestral cinematográfico'],
    moods: ['contemplativo', 'grandioso', 'misterioso'],
    instrumentation: ['sintetizadores', 'cordas', 'percussão eletrônica'],
    searchTerms: ['sci-fi ambient', 'cinematic electronic'],
  },
  53: {
    // Thriller / Suspense
    styles: ['eletrônica tensa', 'dark ambient'],
    moods: ['tenso', 'sombrio'],
    instrumentation: ['sintetizadores graves', 'percussão', 'cordas dissonantes'],
    searchTerms: ['tense cinematic', 'dark synth'],
  },
  10752: {
    // Guerra
    styles: ['orquestral dramático', 'música marcial', 'minimalismo orquestral'],
    moods: ['solene', 'sombrio', 'tenso'],
    instrumentation: ['tambores militares', 'metais', 'cordas graves', 'coro'],
    searchTerms: ['war film score', 'somber orchestral'],
  },
  37: {
    // Faroeste
    styles: ['western instrumental', 'folk americano', 'country instrumental'],
    moods: ['árido', 'solitário', 'épico'],
    instrumentation: ['violão', 'gaita', 'guitarra com reverb', 'assobio'],
    searchTerms: ['western soundtrack', 'desert guitar instrumental'],
  },
});