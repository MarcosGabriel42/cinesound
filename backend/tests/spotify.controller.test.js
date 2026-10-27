
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import { HttpError } from '../src/utils/http-error.js';

const mocks = vi.hoisted(() => ({
  createSpotifyAuthorizationUrl: vi.fn(),
  exchangeSpotifyCode: vi.fn(),
  getSpotifyCurrentUser: vi.fn(),
  createPendingSpotifyState: vi.fn(),
  consumePendingSpotifyState: vi.fn(),
}));

vi.mock('../src/services/spotify.service.js', () => ({
  createSpotifyAuthorizationUrl: mocks.createSpotifyAuthorizationUrl,
  exchangeSpotifyCode: mocks.exchangeSpotifyCode,
  getSpotifyCurrentUser: mocks.getSpotifyCurrentUser,
}));

vi.mock('../src/services/spotify-state.service.js', () => ({
  createPendingSpotifyState: mocks.createPendingSpotifyState,
  consumePendingSpotifyState: mocks.consumePendingSpotifyState,
}));

const { default: spotifyRoutes } = await import(
  '../src/routes/spotify.routes.js'
);

const app = express();

app.use('/api/spotify', spotifyRoutes);

app.use(errorHandler);

describe('Spotify controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mocks.createPendingSpotifyState.mockReturnValue(
      'state-valido-123456',
    );

    mocks.createSpotifyAuthorizationUrl.mockReturnValue(
      'https://accounts.spotify.com/authorize?test=true',
    );

    mocks.consumePendingSpotifyState.mockReturnValue(true);

    mocks.exchangeSpotifyCode.mockResolvedValue({
      accessToken: 'token-de-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'refresh-de-teste',
      scope: 'playlist-modify-private playlist-modify-public',
    });

    mocks.getSpotifyCurrentUser.mockResolvedValue({
      id: 'usuario-teste',
      displayName: 'Usuário Teste',
      profileUrl: 'https://open.spotify.com/user/usuario-teste',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redireciona para o Spotify ao iniciar o login', async () => {
    const response = await request(app)
      .get('/api/spotify/login');

    expect(response.status).toBe(302);

    expect(response.headers.location).toBe(
      'https://accounts.spotify.com/authorize?test=true',
    );

    expect(mocks.createPendingSpotifyState).toHaveBeenCalledOnce();

    expect(mocks.createSpotifyAuthorizationUrl).toHaveBeenCalledWith(
      'state-valido-123456',
    );
  });

  it('retorna erro controlado quando não há capacidade para um novo state', async () => {
    mocks.createPendingSpotifyState.mockImplementationOnce(() => {
      throw new HttpError(
        503,
        'SPOTIFY_STATE_CAPACITY_REACHED',
        'O fluxo de autorização está temporariamente indisponível. Tente novamente em instantes.',
      );
    });

    const response = await request(app)
      .get('/api/spotify/login');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        code: 'SPOTIFY_STATE_CAPACITY_REACHED',
        message: 'O fluxo de autorização está temporariamente indisponível. Tente novamente em instantes.',
      },
    });
    expect(response.text).not.toContain('stack');
    expect(mocks.createSpotifyAuthorizationUrl).not.toHaveBeenCalled();
  });

  it('troca o código por tokens e consulta o perfil quando o callback é válido', async () => {
    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        code: 'codigo-de-teste',
        state: 'state-valido-123456',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('authorized');
    expect(response.body.expiresIn).toBe(3600);

    expect(response.body.user).toEqual({
      id: 'usuario-teste',
      displayName: 'Usuário Teste',
      profileUrl: 'https://open.spotify.com/user/usuario-teste',
    });

    expect(mocks.consumePendingSpotifyState).toHaveBeenCalledWith(
      'state-valido-123456',
    );

    expect(mocks.exchangeSpotifyCode).toHaveBeenCalledWith(
      'codigo-de-teste',
    );

    expect(mocks.getSpotifyCurrentUser).toHaveBeenCalledWith(
      'token-de-teste',
    );

    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
  });

  it('rejeita um state inválido', async () => {
    mocks.consumePendingSpotifyState.mockReturnValue(false);

    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        code: 'codigo-de-teste',
        state: 'state-invalido-123456',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SPOTIFY_STATE');

    expect(mocks.exchangeSpotifyCode).not.toHaveBeenCalled();
    expect(mocks.getSpotifyCurrentUser).not.toHaveBeenCalled();
  });

  it('trata a autorização recusada pelo usuário', async () => {
    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        error: 'access_denied',
        state: 'state-valido-123456',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SPOTIFY_AUTH_DENIED');

    expect(mocks.exchangeSpotifyCode).not.toHaveBeenCalled();
    expect(mocks.getSpotifyCurrentUser).not.toHaveBeenCalled();
  });

  it('rejeita callback sem código de autorização', async () => {
    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        state: 'state-valido-123456',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SPOTIFY_CODE');

    expect(mocks.exchangeSpotifyCode).not.toHaveBeenCalled();
    expect(mocks.getSpotifyCurrentUser).not.toHaveBeenCalled();
  });

  it('trata falha na troca do código sem expor detalhes', async () => {
    mocks.exchangeSpotifyCode.mockRejectedValue(
      new Error('Erro privado de autenticação'),
    );

    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        code: 'codigo-de-teste',
        state: 'state-valido-123456',
      });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');

    expect(response.text).not.toContain(
      'Erro privado de autenticação',
    );

    expect(mocks.getSpotifyCurrentUser).not.toHaveBeenCalled();
  });

  it('trata falha na consulta do perfil sem expor tokens', async () => {
    mocks.getSpotifyCurrentUser.mockRejectedValue(
      new Error('Falha privada ao consultar perfil'),
    );

    const response = await request(app)
      .get('/api/spotify/callback')
      .query({
        code: 'codigo-de-teste',
        state: 'state-valido-123456',
      });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');

    expect(response.text).not.toContain('Falha privada ao consultar perfil');
    expect(response.text).not.toContain('token-de-teste');
    expect(response.text).not.toContain('refresh-de-teste');
  });
});
