
import swaggerJsdoc from 'swagger-jsdoc';


const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CineSound API',
      version: '1.0.0',
      description:
        'API para pesquisa de filmes e geração de perfis musicais inspirados em filmes.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desenvolvimento',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Verificação de funcionamento da API',
      },
      {
        name: 'Movies',
        description: 'Pesquisa e consulta de filmes',
      },
      {
        name: 'Recommendations',
        description: 'Geração de perfis musicais baseados em filmes',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
