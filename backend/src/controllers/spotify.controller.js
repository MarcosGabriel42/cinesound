
import {
  createSpotifyAuthorizationUrl,
  exchangeSpotifyCode,
  getSpotifyCurrentUser,
} from '../services/spotify.service.js';

import {
  createPendingSpotifyState,
  consumePendingSpotifyState,
} from '../services/spotify-state.service.js';

export function spotifyLogin(req, res, next) {
  try {
    const state = createPendingSpotifyState();
    const authorizationUrl = createSpotifyAuthorizationUrl(state);

    return res.redirect(302, authorizationUrl);
  } catch (error) {
    return next(error);
  }
}

export async function spotifyCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;

    // Valida o state antes de processar qualquer retorno do Spotify.
    if (
      typeof state !== 'string' ||
      !consumePendingSpotifyState(state)
    ) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SPOTIFY_STATE',
          message: 'Estado de autenticação inválido ou expirado.',
        },
      });
    }

    if (error) {
      return res.status(400).json({
        error: {
          code: 'SPOTIFY_AUTH_DENIED',
          message: 'A autorização do Spotify foi recusada.',
        },
      });
    }

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SPOTIFY_CODE',
          message: 'O Spotify não retornou um código de autorização válido.',
        },
      });
    }

    // Troca o código recebido por tokens.
    const tokens = await exchangeSpotifyCode(code);
    const profile = await getSpotifyCurrentUser(tokens.accessToken);

    // Não exponha tokens na resposta HTTP.
    return res.status(200).json({
    status: 'authorized',
    message:
        'Conta Spotify autorizada. O armazenamento seguro dos tokens ainda não foi implementado.',
    user: {
        id: profile.id,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
    },
    expiresIn: tokens.expiresIn,
    scope: tokens.scope,
    });
  } catch (error) {
    return next(error);
  }
}
