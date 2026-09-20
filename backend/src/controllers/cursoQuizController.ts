import { Response } from 'express';
import { BadRequestError } from '../errors/AppError';
import { clearCache } from '../middleware/cache';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { cursoQuizService, type QuizInput } from '../services/CursoQuizService';

const limparCache = () => clearCache('GET:/api/cursos');
const aparado = (valor: string): string => valor.trim();

const normalizarQuestoes = (questoes: QuizInput['questoes']): QuizInput['questoes'] =>
  questoes.map((questao) => ({
    enunciado: aparado(questao.enunciado),
    explicacao: aparado(questao.explicacao),
    alternativas: questao.alternativas.map((alternativa) => ({
      texto: aparado(alternativa.texto),
      correta: alternativa.correta,
    })),
  }));

export const getQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quiz = await cursoQuizService.getPublico(req.params.slug, req.params.quizSlug);
  res.json(quiz);
});

export const getQuizById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quiz = await cursoQuizService.getById(req.params.id);
  res.json(quiz);
});

export const criarQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const corpo = req.body as QuizInput;
  if (corpo.modulo_id !== req.params.moduloId) {
    throw new BadRequestError('O módulo do corpo não corresponde ao endereço');
  }

  const quiz = await cursoQuizService.criar(req.params.cursoId, {
    ...corpo,
    modulo_id: req.params.moduloId,
    slug: aparado(corpo.slug),
    titulo: aparado(corpo.titulo),
    questoes: normalizarQuestoes(corpo.questoes),
  });
  limparCache();
  res.status(201).json(quiz);
});

export const atualizarQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const corpo = req.body as Partial<QuizInput>;
  const quiz = await cursoQuizService.atualizar(req.params.id, {
    ...corpo,
    ...(corpo.slug === undefined ? {} : { slug: aparado(corpo.slug) }),
    ...(corpo.titulo === undefined ? {} : { titulo: aparado(corpo.titulo) }),
    ...(corpo.questoes === undefined ? {} : { questoes: normalizarQuestoes(corpo.questoes) }),
  });
  limparCache();
  res.json(quiz);
});

export const deletarQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cursoQuizService.deletar(req.params.id);
  limparCache();
  res.json({ message: 'Quiz deletado com sucesso' });
});
