import { Router } from 'express';
import { search, getById } from '../controllers/movies.controller.js';

const router = Router();

// A ordem importa: rotas fixas (/search) antes das dinâmicas (/:id)
router.get('/search', search);
router.get('/:id', getById);

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Busca detalhes de um filme
 *     description: Retorna detalhes do filme, gêneros e nomes dos compositores identificados no TMDB.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9]\d{0,9}$'
 *         description: ID inteiro positivo do filme no TMDB, com até 10 dígitos
 *         example: '157336'
 *     responses:
 *       '200':
 *         description: Filme encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movie:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     tagline:
 *                       type: string
 *                       nullable: true
 *                     overview:
 *                       type: string
 *                     releaseDate:
 *                       type: string
 *                       nullable: true
 *                     posterUrl:
 *                       type: string
 *                       nullable: true
 *                     genres:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                     composers:
 *                       type: array
 *                       items:
 *                         type: string
 *       '400':
 *         description: ID inválido
 *       '404':
 *         description: Filme não encontrado
 *       '502':
 *         description: Falha ao consultar o serviço externo de filmes
 */

export default router;
