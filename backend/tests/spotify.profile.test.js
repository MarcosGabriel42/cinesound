
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSpotifyCurrentUser } from '../src/services/spotify.service.js';

describe('getSpotifyCurrentUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta e retorna os dados básicos do perfil', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'usuario-teste',
        display_name: 'Usuário Teste',
        external_urls: {
          spotify: 'https://open.spotify.com/user/usuario-teste',
        },
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const profile = await getSpotifyCurrentUser('access-token-teste');

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://api.spotify.com/v1/me');
    expect(options.headers.Authorization).toBe('Bearer access-token-teste');

    expect(profile).toEqual({
      id: 'usuario-teste',
      displayName: 'Usuário Teste',
      profileUrl: 'https://open.spotify.com/user/usuario-teste',
    });
  });

  it('rejeita token vazio', async () => {
    await expect(getSpotifyCurrentUser(' '))
      .rejects.toThrow('Token de acesso do Spotify inválido.');
  });

  it('trata resposta HTTP não autorizada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }));

    await expect(getSpotifyCurrentUser('token-expirado'))
      .rejects.toThrow('O Spotify recusou a consulta ao perfil.');
  });

  it('trata falhas de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('Erro de conexão privado'),
    ));

    await expect(getSpotifyCurrentUser('access-token-teste'))
      .rejects.toThrow('Não foi possível consultar o perfil do Spotify.');
  });
});
