import express from 'express';
import healthRoutes from './routes/health.routes.js';
import moviesRoutes from './routes/movies.routes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';
import cors from 'cors';

const app = express();

app.use(express.json());

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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;