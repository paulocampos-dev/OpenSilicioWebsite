import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  listarCursos,
  listarCursosAdmin,
  getCursoById,
  getCurso,
  getCursoCompleto,
  getAula,
  getAulaById,
  criarCurso,
  atualizarCurso,
  deletarCurso,
  criarModulo,
  atualizarModulo,
  deletarModulo,
  criarAula,
  atualizarAula,
  deletarAula,
  reordenarModulos,
  reordenarAulas,
} from '../controllers/cursoController';
import { authMiddleware } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import {
  validate,
  cursoSchema,
  cursoUpdateSchema,
  moduloSchema,
  moduloUpdateSchema,
  aulaSchema,
  aulaUpdateSchema,
  reordenarSchema,
} from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';
import { NotFoundError } from '../errors/AppError';

const router = Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Um id malformado vira 404, e não o 500 que o Postgres devolveria ao recusar
 * o texto como uuid (22P02). O recurso não existe: é essa a resposta certa.
 */
const exigirUuid =
  (parametro: string, recurso = 'Curso') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const valor = req.params[parametro];
    if (!valor || !UUID.test(valor)) return next(new NotFoundError(recurso));
    next();
  };

// As rotas de segmento fixo vêm antes das de parâmetro, senão /aulas/:id cairia
// no lugar errado quando um curso tivesse o slug "aulas".

// — leitura autenticada (admin) —
router.get('/admin/todos', authMiddleware, listarCursosAdmin);
router.get('/id/:id', authMiddleware, exigirUuid('id'), getCursoById);
router.get('/aulas/:id', authMiddleware, exigirUuid('id', 'Aula'), getAulaById);
router.get('/completo/:slug', authMiddleware, getCursoCompleto);

// — leitura pública —
router.get('/', cacheMiddleware({ ttl: 120 }), listarCursos);
router.get('/:slug', cacheMiddleware({ ttl: 120 }), getCurso);
router.get('/:slug/aulas/:aulaSlug', cacheMiddleware({ ttl: 120 }), getAula);

// — escrita: curso —
router.post('/', authMiddleware, createLimiter, validate(cursoSchema), criarCurso);
router.put('/:id', authMiddleware, exigirUuid('id'), validate(cursoUpdateSchema), atualizarCurso);
router.delete('/:id', authMiddleware, exigirUuid('id'), deletarCurso);

// — escrita: módulos —
router.post('/:cursoId/modulos', authMiddleware, exigirUuid('cursoId'), validate(moduloSchema), criarModulo);
router.put('/:cursoId/modulos/ordem', authMiddleware, exigirUuid('cursoId'), validate(reordenarSchema), reordenarModulos);
router.put('/modulos/:id', authMiddleware, exigirUuid('id', 'Módulo'), validate(moduloUpdateSchema), atualizarModulo);
router.delete('/modulos/:id', authMiddleware, exigirUuid('id', 'Módulo'), deletarModulo);

// — escrita: aulas —
router.post('/:cursoId/aulas', authMiddleware, exigirUuid('cursoId'), validate(aulaSchema), criarAula);
router.put('/modulos/:moduloId/aulas/ordem', authMiddleware, exigirUuid('moduloId', 'Módulo'), validate(reordenarSchema), reordenarAulas);
router.put('/aulas/:id', authMiddleware, exigirUuid('id', 'Aula'), validate(aulaUpdateSchema), atualizarAula);
router.delete('/aulas/:id', authMiddleware, exigirUuid('id', 'Aula'), deletarAula);

export default router;
