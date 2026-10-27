import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middlewares/auth.middleware.js';

describe('auth.middleware - authenticateToken', () => {
  const secret = 'segredo-exclusivo-para-testes-do-cinesound';

  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', secret);

    req = {
      headers: {},
    };

    res = {};

    next = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('deve rejeitar uma requisição sem token', () => {
    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
    });

    expect(req.user).toBeUndefined();
  });

  it('deve rejeitar um token inválido', () => {
    req.headers.authorization = 'Bearer token-invalido';

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  });

  it('deve rejeitar um token expirado', () => {
    const token = jwt.sign(
      { name: 'Usuario Teste' },
      secret,
      {
        subject: '1',
        expiresIn: -1,
        issuer: 'cinesound-api',
        audience: 'cinesound-app',
      },
    );

    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  });

  it('deve rejeitar um token com emissor incorreto', () => {
    const token = jwt.sign(
      { name: 'Usuario Teste' },
      secret,
      {
        subject: '1',
        expiresIn: '15m',
        issuer: 'outro-emissor',
        audience: 'cinesound-app',
      },
    );

    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  });

  it('deve aceitar um token válido e preencher req.user', () => {
    const token = jwt.sign(
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

    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();

    expect(req.user).toEqual({
      id: '1',
      name: 'Usuario Teste',
      email: 'usuario.teste@example.com',
    });
  });

  it('deve informar erro se JWT_SECRET não estiver configurado', () => {
    vi.stubEnv('JWT_SECRET', '');

    req.headers.authorization = 'Bearer token-qualquer';

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 500,
      code: 'SERVER_MISCONFIGURED',
    });
  });
});