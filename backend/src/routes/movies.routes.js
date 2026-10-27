
import { Router } from 'express';
import { search, getById } from '../controllers/movies.controller.js';

const router = Router();

/**
 * @openapi
 * /api/movies/search:
 *   get:
 *     summary: Busca filmes pelo título
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Título ou termo de busca do filme.
 *     responses:
 *       200:
 *         description: Filmes encontrados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       overview:
 *                         type: string
 *                       releaseDate:
 *                         type: string
 *                         nullable: true
 *                       posterUrl:
 *                         type: string
 *                         nullable: true
 *                       genreIds:
 *                         type: array
 *                         items:
 *                           type: integer
 *       400:
 *         description: Parâmetro de busca ausente ou inválido.
 *       502:
 *         description: Serviço externo indisponível.
 */

// A rota /search precisa vir antes da rota dinâmica /:id.
router.get('/search', search);

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     summary: Consulta os detalhes de um filme
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do filme no TMDB.
 *     responses:
 *       200:
 *         description: Detalhes do filme encontrados.
 *       400:
 *         description: ID do filme inválido.
 *       404:
 *         description: Filme não encontrado.
 *       502:
 *         description: Serviço externo indisponível.
 */
router.get('/:id', getById);

export default router;
