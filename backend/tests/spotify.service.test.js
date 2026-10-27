import {
  createSpotifyAuthorizationUrl,
  generateSpotifyState,
  exchangeSpotifyCode,
} from '../src/services/spotify.service.js';

import { describe, it, expect, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = {
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
};

afterEach(() => {
  vi.restoreAllMocks();

  if (ORIGINAL_ENV.SPOTIFY_CLIENT_ID === undefined) {
    delete process.env.SPOTIFY_CLIENT_ID;
  } else {
    process.env.SPOTIFY_CLIENT_ID = ORIGINAL_ENV.SPOTIFY_CLIENT_ID;
  }

  if (ORIGINAL_ENV.SPOTIFY_REDIRECT_URI === undefined) {
    delete process.env.SPOTIFY_REDIRECT_URI;
  } else {
    process.env.SPOTIFY_REDIRECT_URI = ORIGINAL_ENV.SPOTIFY_REDIRECT_URI;
  }
});

describe('Spotify service', () => {
  it('gera um state aleatório com tamanho adequado', () => {
    const state = generateSpotifyState();

    expect(state).toMatch(/^[a-f0-9]{64}$/);
  });

  it('gera states diferentes em chamadas distintas', () => {
    expect(generateSpotifyState()).not.toBe(generateSpotifyState());
  });

  it('monta a URL de autorização corretamente', () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_REDIRECT_URI =
      'http://127.0.0.1:3000/api/spotify/callback';

    const state = 'a'.repeat(64);
    const url = new URL(createSpotifyAuthorizationUrl(state));

    expect(url.origin).toBe('https://accounts.spotify.com');
    expect(url.pathname).toBe('/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-id-teste');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://127.0.0.1:3000/api/spotify/callback',
    );
    expect(url.searchParams.get('state')).toBe(state);
    expect(url.searchParams.get('scope')).toBe(
      'playlist-modify-public playlist-modify-private',
    );
  });


    it('rejeita state inválido', () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_REDIRECT_URI =
        'http://127.0.0.1:3000/api/spotify/callback';

    expect(() => createSpotifyAuthorizationUrl('curto')).toThrow(
        'Estado de autorização inválido.',
    );
    });


  it('rejeita configuração ausente', () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_REDIRECT_URI;

    expect(() =>
      createSpotifyAuthorizationUrl('a'.repeat(64)),
    ).toThrow('Configuração do Spotify ausente.');
  });
});


describe('exchangeSpotifyCode', () => {
  it('envia o código ao Spotify e retorna os tokens', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret-teste';
    process.env.SPOTIFY_REDIRECT_URI =
      'http://127.0.0.1:3000/api/spotify/callback';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-token-teste',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token-teste',
        scope: 'playlist-modify-public playlist-modify-private',
      }),
    });

    const result = await exchangeSpotifyCode('codigo-teste');

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://accounts.spotify.com/api/token');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('client-id-teste:client-secret-teste').toString('base64')}`,
    );

    expect(new URLSearchParams(options.body).get('code')).toBe('codigo-teste');
    expect(result).toEqual({
      accessToken: 'access-token-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'refresh-token-teste',
      scope: 'playlist-modify-public playlist-modify-private',
    });
  });

  it('rejeita código vazio sem chamar o Spotify', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret-teste';
    process.env.SPOTIFY_REDIRECT_URI =
      'http://127.0.0.1:3000/api/spotify/callback';

    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(exchangeSpotifyCode('')).rejects.toThrow(
      'Código de autorização inválido.',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trata falha de conexão com o Spotify', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret-teste';
    process.env.SPOTIFY_REDIRECT_URI =
      'http://127.0.0.1:3000/api/spotify/callback';

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('erro interno de rede'),
    );

    await expect(exchangeSpotifyCode('codigo-teste')).rejects.toThrow(
      'Não foi possível conectar ao Spotify.',
    );
  });

  it('trata código recusado pelo Spotify', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id-teste';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret-teste';
    process.env.SPOTIFY_REDIRECT_URI =
      'http://127.0.0.1:3000/api/spotify/callback';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(exchangeSpotifyCode('codigo-expirado')).rejects.toThrow(
      'O Spotify recusou a troca do código de autorização.',
    );
  });
});
