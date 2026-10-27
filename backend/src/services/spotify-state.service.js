
import crypto from 'node:crypto';
import { HttpError } from '../utils/http-error.js';

const STATE_TTL_MS = 10 * 60 * 1000;
export const MAX_PENDING_STATES = 1000;
const pendingStates = new Map();

function removeExpiredStates(now) {
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) {
      pendingStates.delete(state);
    }
  }
}

export function createPendingSpotifyState() {
  const now = Date.now();
  removeExpiredStates(now);

  if (pendingStates.size >= MAX_PENDING_STATES) {
    throw new HttpError(
      503,
      'SPOTIFY_STATE_CAPACITY_REACHED',
      'O fluxo de autorização está temporariamente indisponível. Tente novamente em instantes.',
    );
  }

  const state = crypto.randomBytes(32).toString('hex');

  pendingStates.set(state, now + STATE_TTL_MS);

  return state;
}

export function consumePendingSpotifyState(state) {
  const now = Date.now();
  removeExpiredStates(now);

  if (typeof state !== 'string') {
    return false;
  }

  const expiresAt = pendingStates.get(state);

  if (!expiresAt) {
    return false;
  }

  pendingStates.delete(state);

  return now < expiresAt;
}
