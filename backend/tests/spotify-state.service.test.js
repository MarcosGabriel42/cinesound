
import { afterEach, describe, it, expect, vi } from 'vitest';

import {
  createPendingSpotifyState,
  consumePendingSpotifyState,
  MAX_PENDING_STATES,
} from '../src/services/spotify-state.service.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('Spotify state service', () => {
  it('gera um state aleatório de 64 caracteres hexadecimais', () => {
    const state = createPendingSpotifyState();

    expect(state).toMatch(/^[a-f0-9]{64}$/);
    expect(consumePendingSpotifyState(state)).toBe(true);
  });

  it('aceita um state válido uma única vez', () => {
    const state = createPendingSpotifyState();

    expect(consumePendingSpotifyState(state)).toBe(true);
    expect(consumePendingSpotifyState(state)).toBe(false);
  });

  it('rejeita um state desconhecido', () => {
    expect(consumePendingSpotifyState('state-desconhecido')).toBe(false);
  });

  it('rejeita valores que não são strings', () => {
    expect(consumePendingSpotifyState(undefined)).toBe(false);
    expect(consumePendingSpotifyState(null)).toBe(false);
    expect(consumePendingSpotifyState(123)).toBe(false);
  });

  it('rejeita um state expirado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const state = createPendingSpotifyState();

    vi.setSystemTime(new Date('2026-01-01T00:10:00.001Z'));

    expect(consumePendingSpotifyState(state)).toBe(false);
    expect(consumePendingSpotifyState(state)).toBe(false);
  });

  it('remove estados expirados durante a criação', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    for (let index = 0; index < MAX_PENDING_STATES; index += 1) {
      createPendingSpotifyState();
    }

    vi.setSystemTime(new Date('2026-01-01T00:10:00.001Z'));

    const state = createPendingSpotifyState();

    expect(consumePendingSpotifyState(state)).toBe(true);
  });

  it('remove estados expirados durante a validação', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const expiredState = createPendingSpotifyState();

    vi.setSystemTime(new Date('2026-01-01T00:10:00.001Z'));

    expect(consumePendingSpotifyState(expiredState)).toBe(false);

    const states = Array.from(
      { length: MAX_PENDING_STATES },
      () => createPendingSpotifyState(),
    );

    expect(consumePendingSpotifyState(states[0])).toBe(true);
    for (const state of states.slice(1)) {
      expect(consumePendingSpotifyState(state)).toBe(true);
    }
  });

  it('rejeita criação acima do limite sem remover estados válidos', () => {
    const states = Array.from(
      { length: MAX_PENDING_STATES },
      () => createPendingSpotifyState(),
    );

    expect(() => createPendingSpotifyState()).toThrowError(
      expect.objectContaining({
        statusCode: 503,
        code: 'SPOTIFY_STATE_CAPACITY_REACHED',
      }),
    );

    for (const state of states) {
      expect(consumePendingSpotifyState(state)).toBe(true);
    }
  });

  it('considera expirado um state exatamente no limite de validade', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const state = createPendingSpotifyState();

    vi.setSystemTime(new Date('2026-01-01T00:10:00.000Z'));

    expect(consumePendingSpotifyState(state)).toBe(false);
  });
});
