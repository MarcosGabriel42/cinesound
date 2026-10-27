
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

import spotifyRoutes from './routes/spotify.routes.js';
import healthRoutes from './routes/health.routes.js';
import moviesRoutes from './routes/movies.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import authRoutes from './routes/auth.routes.js';

import {
  notFoundHandler,
  errorHandler,
} from './middlewares/error.middleware.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));

app.use(express.json());

app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/auth', authRoutes);

// Estes middlewares precisam ficar depois de todas as rotas.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
