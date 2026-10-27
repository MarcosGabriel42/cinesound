import { Router } from 'express';

import {
  register,
  login,
  getMe,
} from '../controllers/auth.controller.js';

import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Cadastrar um usuário
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Usuario Teste
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SenhaSegura123!
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       400:
 *         description: Dados de cadastro inválidos
 *       409:
 *         description: E-mail já cadastrado
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SenhaSegura123!
 *     responses:
 *       200:
 *         description: Login realizado com sucesso; retorna um token JWT
 *       400:
 *         description: Dados de login inválidos
 *       401:
 *         description: E-mail ou senha incorretos
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Consultar o usuário autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *       401:
 *         description: Token ausente, inválido ou expirado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/me', authenticateToken, getMe);

export default router;