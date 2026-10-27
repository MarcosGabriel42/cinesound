
import crypto from 'node:crypto';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';

const REQUIRED_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
];

export function createSpotifyAuthorizationUrl(state) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Configuração do Spotify ausente.');
  }

  if (typeof state !== 'string' || state.length < 16) {
    throw new Error('Estado de autorização inválido.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPES.join(' '),
    state,
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
}

export function generateSpotifyState() {
  return crypto.randomBytes(32).toString('hex');
}


export async function exchangeSpotifyCode(code) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Configuração do Spotify ausente.');
  }

  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('Código de autorização inválido.');
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString('base64');

  let response;

  try {
    response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error('Não foi possível conectar ao Spotify.');
  }

  if (!response.ok) {
    throw new Error('O Spotify recusou a troca do código de autorização.');
  }

  const tokens = await response.json();

  if (
    typeof tokens.access_token !== 'string' ||
    typeof tokens.token_type !== 'string'
  ) {
    throw new Error('Resposta inválida recebida do Spotify.');
  }

  return {
    accessToken: tokens.access_token,
    tokenType: tokens.token_type,
    expiresIn: tokens.expires_in,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope,
  };
}


export async function getSpotifyCurrentUser(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Token de acesso do Spotify inválido.');
  }

  let response;

  try {
    response = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error('Não foi possível consultar o perfil do Spotify.');
  }

  if (!response.ok) {
    throw new Error('O Spotify recusou a consulta ao perfil.');
  }

  const profile = await response.json();

  if (
    typeof profile.id !== 'string' ||
    typeof profile.display_name !== 'string' &&
      profile.display_name !== null
  ) {
    throw new Error('Resposta inválida recebida do Spotify.');
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    profileUrl: profile.external_urls?.spotify ?? null,
  };
}
