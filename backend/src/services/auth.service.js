
import bcrypt from 'bcrypt';
import { z } from 'zod';
import pool from '../config/database.js';
import { HttpError } from '../utils/http-error.js';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z.string()
    .trim()
    .email('Informe um e-mail válido.')
    .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
    .transform((email) => email.toLowerCase()),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha excede o limite permitido.')
});

export async function registerUser(input) {
  const validation = registerSchema.safeParse(input);

  if (!validation.success) {
    throw new HttpError(
      400,
      'INVALID_REGISTRATION',
      'Os dados do cadastro são inválidos.',
      validation.error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
    );
  }

  const { name, email, password } = validation.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash],
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Já existe uma conta cadastrada com este e-mail.',
      );
    }

    throw error;
  }
}

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Informe um e-mail válido.')
    .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
    .transform((email) => email.toLowerCase()),
  password: z.string()
    .min(1, 'Informe sua senha.')
    .max(72, 'A senha excede o limite permitido.'),
});

export async function loginUser(input) {
  const validation = loginSchema.safeParse(input);

  if (!validation.success) {
    throw new HttpError(
      400,
      'INVALID_LOGIN',
      'Informe um e-mail e uma senha válidos.',
      validation.error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
    );
  }

  const { email, password } = validation.data;

  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    throw new HttpError(
      401,
      'INVALID_CREDENTIALS',
      'E-mail ou senha incorretos.',
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new HttpError(
      401,
      'INVALID_CREDENTIALS',
      'E-mail ou senha incorretos.',
    );
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new HttpError(
      500,
      'SERVER_MISCONFIGURED',
      'A autenticação não está configurada corretamente.',
    );
  }

  const token = jwt.sign(
    {
      name: user.name,
      email: user.email,
    },
    jwtSecret,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'cinesound-api',
      audience: 'cinesound-app',
    },
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
}

export async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  const user = result.rows[0];

  if (!user) {
    throw new HttpError(
      404,
      'USER_NOT_FOUND',
      'Usuário não encontrado.',
    );
  }

  return user;
}