import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { extrairIdDoYouTube } from '../utils/youtube';

// Generic validation middleware
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados de entrada inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Auth validation schemas
export const loginSchema = z.object({
  username: z
    .string({
      required_error: 'Nome de usuário é obrigatório',
    })
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .trim(),
  password: z
    .string({
      required_error: 'Senha é obrigatória',
    })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({
      required_error: 'Senha atual é obrigatória',
    })
    .min(1, 'Senha atual não pode ser vazia'),
  newPassword: z
    .string({
      required_error: 'Nova senha é obrigatória',
    })
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'
    ),
});

// Blog validation schemas
export const blogPostSchema = z.object({
  slug: z
    .string({
      required_error: 'Slug é obrigatório',
    })
    .min(1, 'Slug não pode ser vazio')
    .max(255, 'Slug deve ter no máximo 255 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .trim(),
  title: z
    .string({
      required_error: 'Título é obrigatório',
    })
    .min(1, 'Título não pode ser vazio')
    .max(500, 'Título deve ter no máximo 500 caracteres')
    .trim(),
  excerpt: z
    .string({
      required_error: 'Resumo é obrigatório',
    })
    .min(1, 'Resumo não pode ser vazio')
    .max(1000, 'Resumo deve ter no máximo 1000 caracteres')
    .trim(),
  cover_letter: z
    .string()
    .max(2000, 'Carta de apresentação deve ter no máximo 2000 caracteres')
    .trim()
    .nullish(),
  content: z
    .string({
      required_error: 'Conteúdo é obrigatório',
    })
    .min(1, 'Conteúdo não pode ser vazio')
    .max(50000000, 'Conteúdo deve ter no máximo 50000000 caracteres'),
  author: z
    .string()
    .max(255, 'Nome do autor deve ter no máximo 255 caracteres')
    .trim()
    .optional(),
  image_url: z
    .string()
    .max(2048, 'URL da imagem deve ter no máximo 2048 caracteres')
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'URL da imagem inválida',
    })
    .nullish(),
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  toc_items: z
    .array(z.string().max(200, 'Cada item deve ter no máximo 200 caracteres').trim())
    .max(20, 'No máximo 20 itens')
    .optional(),
  published: z.boolean().optional(),
});

// Partial schema for blog post updates (all fields optional)
export const blogPostUpdateSchema = blogPostSchema.partial().strip();

// Education resource validation schema
export const educationResourceSchema = z.object({
  title: z
    .string({
      required_error: 'Título é obrigatório',
    })
    .min(1, 'Título não pode ser vazio')
    .max(500, 'Título deve ter no máximo 500 caracteres')
    .trim(),
  description: z
    .string({
      required_error: 'Descrição é obrigatória',
    })
    .min(1, 'Descrição não pode ser vazia')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim(),
  cover_letter: z
    .string()
    .max(2000, 'Carta de apresentação deve ter no máximo 2000 caracteres')
    .trim()
    .nullish(),
  image_url: z
    .string()
    .max(2048, 'URL da imagem deve ter no máximo 2048 caracteres')
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'URL da imagem inválida',
    })
    .nullish(),
  content: z
    .string({
      required_error: 'Conteúdo é obrigatório',
    })
    .min(1, 'Conteúdo não pode ser vazio')
    .max(50000000, 'Conteúdo deve ter no máximo 50000000 caracteres'),
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  difficulty: z
    .enum(['Iniciante', 'Intermediário', 'Avançado'], {
      errorMap: () => ({ message: 'Dificuldade deve ser Iniciante, Intermediário ou Avançado' }),
    })
    .nullish(),
  overview: z
    .string()
    .max(50000000, 'Visão geral deve ter no máximo 50000000 caracteres')
    .nullish(),
  resources: z
    .string()
    .max(50000000, 'Recursos deve ter no máximo 50000000 caracteres')
    .nullish(),
  toc_items: z
    .array(z.string().max(200, 'Cada item deve ter no máximo 200 caracteres').trim())
    .max(20, 'No máximo 20 itens')
    .optional(),
  // A normalização de string vazia acontece no controller, não aqui: o
  // middleware validate() descarta o resultado do parse, então qualquer
  // .transform() neste arquivo nunca chega ao req.body.
  series: z
    .string()
    .max(120, 'Série deve ter no máximo 120 caracteres')
    .trim()
    .nullish(),
  series_order: z
    .number()
    .int('Ordem na série deve ser um número inteiro')
    .min(0, 'Ordem na série não pode ser negativa')
    .nullish(),
  // Data de publicação editável. Serve para datar conteúdo que foi escrito
  // antes de entrar no site, em vez de todo post nascer com a data em que
  // alguém colou o texto. Só o update aceita: no create a coluna tem default,
  // e listar o campo no INSERT gravaria NULL quando ele não viesse.
  created_at: z
    .string()
    .datetime({ message: 'Data de publicação deve ser ISO 8601, ex.: 2026-06-01T12:00:00.000Z' })
    .optional(),
  published: z.boolean().optional(),
});

// Partial schema for education resource updates (all fields optional)
export const educationResourceUpdateSchema = educationResourceSchema.partial().strip();

// Wiki entry validation schema
export const wikiEntrySchema = z.object({
  term: z
    .string({
      required_error: 'Termo é obrigatório',
    })
    .min(1, 'Termo não pode ser vazio')
    .max(255, 'Termo deve ter no máximo 255 caracteres')
    .trim(),
  slug: z
    .string({
      required_error: 'Slug é obrigatório',
    })
    .min(1, 'Slug não pode ser vazio')
    .max(255, 'Slug deve ter no máximo 255 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .trim(),
  definition: z
    .string({
      required_error: 'Definição é obrigatória',
    })
    .min(1, 'Definição não pode ser vazia')
    .max(2000, 'Definição deve ter no máximo 2000 caracteres')
    .trim(),
  cover_letter: z
    .string()
    .max(2000, 'Carta de apresentação deve ter no máximo 2000 caracteres')
    .trim()
    .nullish(),
  content: z
    .string()
    .max(50000000, 'Conteúdo deve ter no máximo 50000000 caracteres')
    .optional(),
  published: z.boolean().optional(),
});

// Partial schema for wiki entry updates (all fields optional)
export const wikiEntryUpdateSchema = wikiEntrySchema.partial().strip();

// Wiki link validation schema
export const wikiLinkSchema = z.object({
  contentType: z.enum(['blog', 'education', 'curso_aula'], {
    errorMap: () => ({ message: 'Tipo de conteúdo deve ser blog, education ou curso_aula' }),
  }),
  contentId: z
    .string({
      required_error: 'ID do conteúdo é obrigatório',
    })
    .uuid('ID do conteúdo deve ser um UUID válido'),
  wikiEntryId: z
    .string({
      required_error: 'ID da entrada da wiki é obrigatório',
    })
    .uuid('ID da entrada da wiki deve ser um UUID válido'),
  linkText: z
    .string({
      required_error: 'Texto do link é obrigatório',
    })
    .min(1, 'Texto do link não pode ser vazio')
    .max(255, 'Texto do link deve ter no máximo 255 caracteres')
    .trim(),
});

// — Cursos —
//
// Lembrete que vale para todos os schemas abaixo: validate() joga fora o
// resultado do parse e passa o req.body cru adiante, então .transform() aqui
// seria código morto. Normalização (slug, id do vídeo) fica no controller.

const slug = z
  .string({ required_error: 'Slug é obrigatório' })
  .min(1, 'Slug não pode ser vazio')
  .max(255, 'Slug deve ter no máximo 255 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter só minúsculas, números e hífens');

export const cursoSchema = z.object({
  slug,
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(1, 'Título não pode ser vazio')
    .max(500, 'Título deve ter no máximo 500 caracteres')
    .trim(),
  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(1, 'Descrição não pode ser vazia')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim(),
  ementa: z.string().max(50000000, 'Ementa longa demais').nullish(),
  image_url: z
    .string()
    .max(2048, 'URL da imagem deve ter no máximo 2048 caracteres')
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'URL da imagem inválida',
    })
    .nullish(),
  nivel: z
    .enum(['Iniciante', 'Intermediário', 'Avançado'], {
      errorMap: () => ({ message: 'Nível deve ser Iniciante, Intermediário ou Avançado' }),
    })
    .nullish(),
  publicado: z.boolean().optional(),
});

export const cursoUpdateSchema = cursoSchema.partial().strip();

export const moduloSchema = z.object({
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(1, 'Título não pode ser vazio')
    .max(500, 'Título deve ter no máximo 500 caracteres')
    .trim(),
  resumo: z.string().max(2000, 'Resumo deve ter no máximo 2000 caracteres').trim().nullish(),
});

export const moduloUpdateSchema = moduloSchema.partial().strip();

export const aulaSchema = z.object({
  modulo_id: z
    .string({ required_error: 'Módulo é obrigatório' })
    .uuid('ID do módulo deve ser um UUID válido'),
  slug,
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(1, 'Título não pode ser vazio')
    .max(500, 'Título deve ter no máximo 500 caracteres')
    .trim(),
  // Aceita o que o autor colar: URL do watch, do youtu.be, do embed, ou o id
  // sozinho. Quem converte para o id de 11 caracteres é o controller, porque
  // um .transform() aqui seria descartado pelo validate().
  video_id: z
    .string()
    .max(200, 'Endereço do vídeo longo demais')
    .refine((val) => val === '' || extrairIdDoYouTube(val) !== null, {
      message: 'Não reconheci um vídeo do YouTube nesse endereço',
    })
    .nullish(),
  duracao_seg: z
    .number()
    .int('Duração deve ser um número inteiro de segundos')
    .positive('Duração deve ser maior que zero')
    .max(86400, 'Duração deve ser menor que 24 horas')
    .nullish(),
  conteudo: z.string().max(50000000, 'Conteúdo longo demais').nullish(),
  publicado: z.boolean().optional(),
});

export const aulaUpdateSchema = aulaSchema.partial().strip();

export const reordenarSchema = z.object({
  ids: z
    .array(z.string().uuid('Cada id deve ser um UUID válido'))
    .min(1, 'A lista de ids não pode ser vazia')
    .max(500, 'No máximo 500 itens por reordenação'),
});
