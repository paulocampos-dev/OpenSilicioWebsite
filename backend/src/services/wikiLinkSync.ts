import pool from '../config/database';
import { extrairVerbetes } from '../utils/extrairVerbetes';

/**
 * Mantém `content_wiki_links` em dia com o texto.
 *
 * A tabela alimenta duas coisas na página do leitor: os chips de "Termos usados
 * aqui" e a definição que aparece no popover ao passar o mouse num verbete. Sem
 * a linha, o `useWikiGlossary` não acha o slug e cai no ramo de "termo ainda não
 * criado", então o verbete aparece pendente e sem definição.
 *
 * Antes disso a tabela nunca era escrita: o diálogo "Adicionar Link da Wiki"
 * inseria o nó no conteúdo e mais nada, e `wikiApi.createLink` não era chamado
 * de lugar nenhum. Derivar do conteúdo, em vez de gravar no momento da
 * inserção, resolve o problema pela raiz e ainda elimina a possibilidade de
 * divergência: apagar o link do texto tira o chip sozinho, e conteúdo colado de
 * fora do diálogo passa a valer igual.
 */

/**
 * Reescreve as ligações de um conteúdo para bater com o texto dele. Devolve
 * quantas ficaram gravadas.
 *
 * Roda em transação, e substitui em vez de acumular, para o resultado ser o
 * mesmo rodando uma ou dez vezes. Slug que não existe em `wiki_entries` é
 * descartado: o verbete pode ter sido apagado depois de citado, e uma linha
 * órfã derrubaria o INSERT pela chave estrangeira.
 */
export async function sincronizarLinksDeWiki(
  contentType: 'blog' | 'education' | 'curso_aula',
  contentId: string,
  campos: Array<string | null | undefined>,
): Promise<number> {
  const citados = extrairVerbetes(campos);
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');
    await cliente.query(
      'DELETE FROM content_wiki_links WHERE content_type = $1 AND content_id = $2',
      [contentType, contentId],
    );

    let gravados = 0;
    if (citados.length > 0) {
      const { rows } = await cliente.query<{ id: string; slug: string }>(
        'SELECT id, slug FROM wiki_entries WHERE slug = ANY($1)',
        [citados.map((c) => c.slug)],
      );
      const idPorSlug = new Map(rows.map((r) => [r.slug, r.id]));

      for (const { slug, texto } of citados) {
        const wikiEntryId = idPorSlug.get(slug);
        if (!wikiEntryId) continue;
        await cliente.query(
          `INSERT INTO content_wiki_links (content_type, content_id, wiki_entry_id, link_text)
           VALUES ($1, $2, $3, $4)`,
          [contentType, contentId, wikiEntryId, texto],
        );
        gravados++;
      }
    }

    await cliente.query('COMMIT');
    return gravados;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}
