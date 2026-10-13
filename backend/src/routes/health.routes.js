import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CineSound API funcionando',
    timestamp: new Date().toISOString(),
  });
});

export default router;


/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verifica se a API está funcionando
 *     responses:
 *       '200':
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: CineSound API funcionando
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2026-10-11T16:00:00.000Z'
 */
