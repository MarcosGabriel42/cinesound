import { Router } from 'express';
import { recommend } from '../controllers/recommendations.controller.js';

const router = Router();

router.post('/', recommend);

export default router;


/**
 * @openapi
 * /api/recommendations:
 *   post:
 *     tags:
 *       - Recommendations
 *     summary: Gera um perfil musical baseado em filmes
 *     description: Recebe IDs de filmes do TMDB e retorna os filmes selecionados, compositores identificados e um perfil musical sugerido por regras. Não retorna faixas musicais específicas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieIds
 *             properties:
 *               movieIds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 5
 *                 uniqueItems: true
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 9999999999
 *                 description: IDs dos filmes selecionados no TMDB
 *                 example:
 *                   - 157336
 *     responses:
 *       '200':
 *         description: Perfil musical gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       releaseDate:
 *                         type: string
 *                         nullable: true
 *                       posterUrl:
 *                         type: string
 *                         nullable: true
 *                       genres:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                 verified:
 *                   type: object
 *                   properties:
 *                     source:
 *                       type: string
 *                       enum: [tmdb]
 *                     composers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           movieId:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           names:
 *                             type: array
 *                             items:
 *                               type: string
 *                 ruleBased:
 *                   type: object
 *                   description: Perfil sugerido por regras, sem faixas ou artistas específicos
 *                   properties:
 *                     method:
 *                       type: string
 *                       enum: [rules]
 *                     tracksIncluded:
 *                       type: boolean
 *                       enum: [false]
 *                     disclaimer:
 *                       type: string
 *                     styles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     moods:
 *                       type: array
 *                       items:
 *                         type: string
 *                     instrumentation:
 *                       type: array
 *                       items:
 *                         type: string
 *                     searchTerms:
 *                       type: array
 *                       items:
 *                         type: string
 *                     basedOnGenres:
 *                       type: array
 *                       items:
 *                         type: string
 *                     unmappedGenres:
 *                       type: array
 *                       items:
 *                         type: string
 *       '400':
 *         description: Lista de IDs ausente, vazia ou inválida, ou com mais de cinco filmes distintos
 *       '404':
 *         description: Um ou mais filmes não foram encontrados
 *       '502':
 *         description: Falha ao consultar o serviço externo de filmes
 *       '503':
 *         description: Serviço externo temporariamente sobrecarregado
 */
