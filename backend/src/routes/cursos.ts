import { Router } from 'express';
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

const router = Router();

// As rotas de segmento fixo vêm antes das de parâmetro, senão /aulas/:id cairia
// no lugar errado quando um curso tivesse o slug "aulas".

// — leitura autenticada (admin) —
router.get('/admin/todos', authMiddleware, listarCursosAdmin);
router.get('/id/:id', authMiddleware, getCursoById);
router.get('/aulas/:id', authMiddleware, getAulaById);
router.get('/completo/:slug', authMiddleware, getCursoCompleto);

// — leitura pública —
router.get('/', cacheMiddleware({ ttl: 120 }), listarCursos);
router.get('/:slug', cacheMiddleware({ ttl: 120 }), getCurso);
router.get('/:slug/aulas/:aulaSlug', cacheMiddleware({ ttl: 120 }), getAula);

// — escrita: curso —
router.post('/', authMiddleware, createLimiter, validate(cursoSchema), criarCurso);
router.put('/:id', authMiddleware, validate(cursoUpdateSchema), atualizarCurso);
router.delete('/:id', authMiddleware, deletarCurso);

// — escrita: módulos —
router.post('/:cursoId/modulos', authMiddleware, validate(moduloSchema), criarModulo);
router.put('/:cursoId/modulos/ordem', authMiddleware, validate(reordenarSchema), reordenarModulos);
router.put('/modulos/:id', authMiddleware, validate(moduloUpdateSchema), atualizarModulo);
router.delete('/modulos/:id', authMiddleware, deletarModulo);

// — escrita: aulas —
router.post('/:cursoId/aulas', authMiddleware, validate(aulaSchema), criarAula);
router.put('/modulos/:moduloId/aulas/ordem', authMiddleware, validate(reordenarSchema), reordenarAulas);
router.put('/aulas/:id', authMiddleware, validate(aulaUpdateSchema), atualizarAula);
router.delete('/aulas/:id', authMiddleware, deletarAula);

export default router;
