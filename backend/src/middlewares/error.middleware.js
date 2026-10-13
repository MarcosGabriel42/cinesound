import { HttpError } from '../utils/http-error.js';

// Chamado quando nenhuma rota respondeu à requisição
export function notFoundHandler(req, res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'Rota não encontrada.'));
}

// Middleware de erro: precisa ter exatamente 4 parâmetros
export function errorHandler(err, req, res, next) {
  // Se a resposta já começou a ser enviada, delega ao tratador padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // Erros conhecidos do express.json()
  if (err.type === 'entity.parse.failed') {
    err = new HttpError(400, 'INVALID_JSON', 'O corpo da requisição não é um JSON válido.');
  } else if (err.type === 'entity.too.large') {
    err = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'O corpo da requisição é grande demais.');
  }

  // Erros que nós mesmos lançamos: seguros para enviar ao cliente
  if (err instanceof HttpError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Qualquer outro erro é inesperado: loga no servidor, responde algo genérico
  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  });
}