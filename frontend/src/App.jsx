
import { useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setError('Digite o nome de um filme para pesquisar.');
      setMovies([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setMovies([]);
    setSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/movies/search?query=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Não foi possível pesquisar os filmes.'
        );
      }

      setMovies(data.results || []);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Não foi possível conectar ao CineSound. Verifique se o backend está funcionando.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#inicio" aria-label="CineSound início">
          <span className="brand-icon">♫</span>
          <span>
            Cine<span className="brand-highlight">Sound</span>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#inicio">Início</a>
          <a href="#descobrir">Descobrir</a>
          <a href="#sobre">Sobre o projeto</a>
        </nav>

        <a className="nav-cta" href="#descobrir">
          Explorar filmes <span>↗</span>
        </a>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              CINEMA ENCONTRA MÚSICA
            </div>

            <h1>
              Todo filme tem
              <br />
              uma <span>trilha sonora</span>
              <br />
              esperando por você.
            </h1>

            <p className="hero-description">
              Descubra novos sons a partir das histórias que marcaram você.
              Escolha seus filmes favoritos e deixe a atmosfera do cinema
              inspirar sua próxima experiência musical.
            </p>

            <a className="primary-button" href="#descobrir">
              Descobrir minha trilha <span>→</span>
            </a>

            <div className="hero-note">
              <span className="note-dot" />
              Uma nova forma de sentir seus filmes favoritos.
            </div>
          </div>

          <div className="hero-art" aria-label="Ilustração cinematográfica">
            <div className="art-glow" />
            <div className="art-circle art-circle-one" />
            <div className="art-circle art-circle-two" />

            <div className="vinyl">
              <div className="vinyl-grooves" />
              <div className="vinyl-label">
                <span>CS</span>
                <small>ORIGINAL SOUND</small>
              </div>
            </div>

            <div className="art-caption">
              <span className="caption-number">01 / 03</span>
              <span className="caption-divider" />
              <span>THE ART OF SOUND</span>
            </div>

            <span className="floating-note note-one">♪</span>
            <span className="floating-note note-two">♫</span>
          </div>
        </section>

        <section className="discover-section" id="descobrir">
          <div className="section-heading">
            <div>
              <span className="section-kicker">COMECE POR UMA HISTÓRIA</span>
              <h2>Qual filme está na sua cabeça?</h2>
            </div>
            <p>A inspiração pode começar com um único filme.</p>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <span className="search-icon" aria-hidden="true">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquise por um filme, como Interestelar..."
              aria-label="Nome do filme"
              maxLength={100}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Pesquisando...' : 'Buscar filme'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="search-hint">
            <span>✦</span> Escolha até 5 filmes para criar um perfil musical.
          </p>

          {error && (
            <p className="feedback-message error-message" role="alert">
              {error}
            </p>
          )}

          {loading && (
            <p className="feedback-message" role="status">
              Procurando filmes...
            </p>
          )}

          {!loading && searched && !error && movies.length === 0 && (
            <p className="feedback-message">
              Nenhum filme encontrado. Tente pesquisar por outro título.
            </p>
          )}

          {movies.length > 0 && (
            <div className="movie-grid" aria-live="polite">
              {movies.map((movie) => (
                <article className="movie-card" key={movie.id}>
                  {movie.posterUrl ? (
                    <img
                      className="movie-poster"
                      src={movie.posterUrl}
                      alt={`Pôster de ${movie.title}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="movie-poster poster-placeholder">
                      <span>♫</span>
                      <small>Pôster indisponível</small>
                    </div>
                  )}

                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p>
                      {movie.releaseDate
                        ? movie.releaseDate.slice(0, 4)
                        : 'Ano não informado'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="about-section" id="sobre">
          <div className="about-symbol">♫</div>
          <div>
            <span className="section-kicker">MAIS DO QUE UMA PLAYLIST</span>
            <h2>Histórias que viram música.</h2>
            <p>
              O CineSound analisa os filmes que você escolhe e identifica
              características musicais inspiradas em seus universos,
              gêneros e atmosferas.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-icon">♫</span>
          <span>
            Cine<span className="brand-highlight">Sound</span>
          </span>
        </a>

        <p>Feito para quem sente o cinema até quando a tela se apaga.</p>
        <span className="footer-year">CINESOUND © 2026</span>
      </footer>
    </div>
  );
}

export default App;
