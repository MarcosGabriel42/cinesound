import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../src/config/database.js', () => ({
  default: {
    query: queryMock,
  },
}));

import app from '../src/app.js';

describe('auth.routes - GET /api/auth/me', () => {
  const secret = 'segredo-exclusivo-para-testes-do-cinesound';

  let token;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubEnv('JWT_SECRET', secret);

    token = jwt.sign(
      {
        name: 'Usuario Teste',
        email: 'usuario.teste@example.com',
      },
      secret,
      {
        subject: '1',
        expiresIn: '15m',
        issuer: 'cinesound-api',
        audience: 'cinesound-app',
      },
    );

    queryMock.mockResolvedValue({
      rows: [
        {
          id: '1',
          name: 'Usuario Teste',
          email: 'usuario.teste@example.com',
          created_at: '2026-10-19T12:00:00.000Z',
        },
      ],
    });
  });

  it('deve retornar os dados do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      status: 'success',
      user: {
        id: '1',
        name: 'Usuario Teste',
        email: 'usuario.teste@example.com',
      },
    });

    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('password_hash');

    expect(queryMock).toHaveBeenCalledOnce();
  });

  it('deve rejeitar uma requisição sem token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe(
      'AUTHENTICATION_REQUIRED',
    );

    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve rejeitar um token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);

    expect(response.body.error.code).toBe('INVALID_TOKEN');

    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve retornar 404 quando o usuário não existir', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });
});
