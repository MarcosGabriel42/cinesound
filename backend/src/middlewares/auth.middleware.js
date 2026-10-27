import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http-error.js';

export function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(
      new HttpError(
        401,
        'AUTHENTICATION_REQUIRED',
        'É necessário estar autenticado para acessar este recurso.',
      ),
    );
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return next(
      new HttpError(
        401,
        'INVALID_TOKEN',
        'O token de autenticação é inválido.',
      ),
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(
      new HttpError(
        500,
        'SERVER_MISCONFIGURED',
        'A autenticação não está configurada corretamente.',
      ),
    );
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'cinesound-api',
      audience: 'cinesound-app',
    });

    if (!payload.sub) {
      throw new Error('Token sem identificador de usuário.');
    }

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    return next();
  } catch {
    return next(
      new HttpError(
        401,
        'INVALID_TOKEN',
        'O token é inválido ou expirou. Faça login novamente.',
      ),
    );
  }
}