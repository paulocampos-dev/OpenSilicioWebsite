import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

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
  content: z
    .string({
      required_error: 'Conteúdo é obrigatório',
    })
    .min(1, 'Conteúdo não pode ser vazio')
    .max(100000, 'Conteúdo deve ter no máximo 100000 caracteres'),
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
    .optional(),
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .trim()
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
  content: z
    .string({
      required_error: 'Conteúdo é obrigatório',
    })
    .min(1, 'Conteúdo não pode ser vazio')
    .max(100000, 'Conteúdo deve ter no máximo 100000 caracteres'),
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
    .max(100000, 'Visão geral deve ter no máximo 100000 caracteres')
    .nullish(),
  resources: z
    .string()
    .max(100000, 'Recursos deve ter no máximo 100000 caracteres')
    .nullish(),
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
  content: z
    .string()
    .max(100000, 'Conteúdo deve ter no máximo 100000 caracteres')
    .optional(),
  published: z.boolean().optional(),
});

// Partial schema for wiki entry updates (all fields optional)
export const wikiEntryUpdateSchema = wikiEntrySchema.partial().strip();

// Wiki link validation schema
export const wikiLinkSchema = z.object({
  contentType: z.enum(['blog', 'education'], {
    errorMap: () => ({ message: 'Tipo de conteúdo deve ser blog ou education' }),
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
