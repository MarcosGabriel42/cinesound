import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock, hashMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  hashMock: vi.fn(),
}));

vi.mock('../src/config/database.js', () => ({
  default: {
    query: queryMock,
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: hashMock,
  },
}));

import { registerUser } from '../src/services/auth.service.js';

describe('auth.service - registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hashMock.mockResolvedValue('$2b$12$hash-de-teste');

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

  it('deve cadastrar um usuário com dados válidos', async () => {
    const user = await registerUser({
      name: 'Usuario Teste',
      email: 'usuario.teste@example.com',
      password: 'SenhaLocal123!',
    });

    expect(user).toMatchObject({
      id: '1',
      name: 'Usuario Teste',
      email: 'usuario.teste@example.com',
    });

    expect(hashMock).toHaveBeenCalledWith('SenhaLocal123!', 12);

    expect(queryMock).toHaveBeenCalledOnce();
    expect(queryMock.mock.calls[0][0]).toContain(
      'INSERT INTO users',
    );

    expect(queryMock.mock.calls[0][1]).toEqual([
      'Usuario Teste',
      'usuario.teste@example.com',
      '$2b$12$hash-de-teste',
    ]);
  });

  it('deve normalizar o e-mail para letras minúsculas', async () => {
    await registerUser({
      name: 'Usuario Teste',
      email: 'USUARIO.TESTE@EXAMPLE.COM',
      password: 'SenhaLocal123!',
    });

    expect(queryMock.mock.calls[0][1][1]).toBe(
      'usuario.teste@example.com',
    );
  });

  it('não deve retornar o hash da senha', async () => {
    const user = await registerUser({
      name: 'Usuario Teste',
      email: 'usuario.teste@example.com',
      password: 'SenhaLocal123!',
    });

    expect(user).not.toHaveProperty('password_hash');
    expect(user).not.toHaveProperty('password');
  });

  it('deve rejeitar uma senha com menos de 8 caracteres', async () => {
    await expect(
      registerUser({
        name: 'Usuario Teste',
        email: 'usuario.teste@example.com',
        password: '123',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_REGISTRATION',
    });

    expect(hashMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve rejeitar um e-mail inválido', async () => {
    await expect(
      registerUser({
        name: 'Usuario Teste',
        email: 'email-invalido',
        password: 'SenhaLocal123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_REGISTRATION',
    });

    expect(hashMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve rejeitar um nome vazio', async () => {
    await expect(
      registerUser({
        name: '   ',
        email: 'usuario.teste@example.com',
        password: 'SenhaLocal123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_REGISTRATION',
    });

    expect(hashMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve informar quando o e-mail já está cadastrado', async () => {
    queryMock.mockRejectedValueOnce({
      code: '23505',
    });

    await expect(
      registerUser({
        name: 'Usuario Teste',
        email: 'usuario.teste@example.com',
        password: 'SenhaLocal123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_EXISTS',
    });
  });

  it('deve propagar erros inesperados do banco de dados', async () => {
    const databaseError = new Error('Falha simulada no banco');

    queryMock.mockRejectedValueOnce(databaseError);

    await expect(
      registerUser({
        name: 'Usuario Teste',
        email: 'usuario.teste@example.com',
        password: 'SenhaLocal123!',
      }),
    ).rejects.toBe(databaseError);
  });
});