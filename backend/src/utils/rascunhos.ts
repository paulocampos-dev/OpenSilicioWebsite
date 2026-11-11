import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../errors/AppError';
import { parsePublishedFilter } from './parsePublishedFilter';

/**
 * Filtro de listagem: o admin (rota com authOpcional e token válido) escolhe
 * pelo `?published=`; o visitante recebe só o que está publicado, peça o que pedir.
 */
export function filtroDePublicacao(req: AuthRequest): boolean | undefined {
  return req.userId ? parsePublishedFilter(req.query) : true;
}

/**
 * Leitura de um item: para o visitante um rascunho responde 404, igual a um
 * item que não existe.
 */
export function exigirVisivel<T extends { published: boolean }>(req: AuthRequest, item: T, recurso: string): T {
  if (!item.published && !req.userId) throw new NotFoundError(recurso);
  return item;
}
