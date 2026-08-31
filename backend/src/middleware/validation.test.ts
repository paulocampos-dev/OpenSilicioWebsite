import {
  blogPostUpdateSchema,
  educationResourceUpdateSchema,
  wikiEntryUpdateSchema,
} from './validation';

/**
 * Regressão: o formulário do admin carrega o recurso da API e devolve o objeto
 * inteiro ao salvar. Colunas nulas no banco chegam de volta como null, não como
 * undefined, e `.optional()` sozinho rejeita null. Com isso, nenhum recurso sem
 * carta de apresentação e sem imagem de capa podia ser salvo, que é o estado de
 * todo conteúdo criado antes das migrações 010 e 011.
 */
describe('campos anuláveis aceitam null vindo do formulário', () => {
  const base = { title: 'Título', description: 'Descrição', content: '{"root":{}}' };

  it('aceita cover_letter e image_url nulos num recurso de educação', () => {
    const r = educationResourceUpdateSchema.safeParse({
      ...base,
      cover_letter: null,
      image_url: null,
      overview: null,
      resources: null,
      series: null,
      series_order: null,
      toc_items: [],
    });
    expect(r.success).toBe(true);
  });

  it('aceita cover_letter e image_url nulos num post de blog', () => {
    const r = blogPostUpdateSchema.safeParse({
      ...base,
      slug: 'um-post',
      excerpt: 'resumo',
      cover_letter: null,
      image_url: null,
    });
    expect(r.success).toBe(true);
  });

  it('aceita cover_letter nulo num verbete de wiki', () => {
    const r = wikiEntryUpdateSchema.safeParse({
      term: 'PDK',
      slug: 'pdk',
      definition: 'definição',
      cover_letter: null,
    });
    expect(r.success).toBe(true);
  });

  it('continua rejeitando uma URL de imagem inválida', () => {
    const r = educationResourceUpdateSchema.safeParse({ ...base, image_url: 'nao-e-url' });
    expect(r.success).toBe(false);
  });
});
