import { extrairVerbetes } from './extrairVerbetes';

/* A tabela content_wiki_links nunca era escrita: o diálogo inseria o nó no
   conteúdo e `wikiApi.createLink` não era chamado de lugar nenhum. Sem a linha,
   o leitor via todo verbete como pendente e sem definição. Agora ela é derivada
   do texto, e é esta extração que decide o que vai para o banco. */

const estado = (...filhos: unknown[]) =>
  JSON.stringify({ root: { type: 'root', children: filhos } });

const paragrafo = (...filhos: unknown[]) => ({ type: 'paragraph', children: filhos });
const texto = (t: string) => ({ type: 'text', text: t });
const verbete = (slug: string, t: string) => ({
  type: 'wikilink',
  url: `/wiki/${slug}`,
  children: [texto(t)],
});

describe('extrairVerbetes', () => {
  it('acha o slug e o texto do link', () => {
    const campo = estado(paragrafo(texto('Abrimos o '), verbete('pdk', 'PDK'), texto(' do sky130.')));
    expect(extrairVerbetes([campo])).toEqual([{ slug: 'pdk', texto: 'PDK' }]);
  });

  it('acha verbete aninhado em lista, não só no primeiro nível', () => {
    const campo = estado({
      type: 'list',
      children: [{ type: 'listitem', children: [paragrafo(verbete('yosys', 'Yosys'))] }],
    });
    expect(extrairVerbetes([campo])).toEqual([{ slug: 'yosys', texto: 'Yosys' }]);
  });

  it('junta os campos e não repete slug citado duas vezes', () => {
    const a = estado(paragrafo(verbete('pdk', 'PDK'), verbete('drc', 'DRC')));
    const b = estado(paragrafo(verbete('pdk', 'o PDK de novo')));
    expect(extrairVerbetes([a, b])).toEqual([
      { slug: 'pdk', texto: 'PDK' },
      { slug: 'drc', texto: 'DRC' },
    ]);
  });

  it('ignora verbete pendente, que não tem linha em wiki_entries', () => {
    const campo = estado(paragrafo(verbete('pending-abc', 'termo novo'), verbete('lvs', 'LVS')));
    expect(extrairVerbetes([campo])).toEqual([{ slug: 'lvs', texto: 'LVS' }]);
  });

  it('ignora link normal, que não é verbete', () => {
    const campo = estado(
      paragrafo({ type: 'link', url: 'https://github.com/x', children: [texto('repo')] }),
    );
    expect(extrairVerbetes([campo])).toEqual([]);
  });

  it('aguenta campo vazio, nulo ou texto puro sem quebrar', () => {
    expect(extrairVerbetes([null, undefined, '', 'conteúdo antigo em texto puro'])).toEqual([]);
  });

  it('aguenta JSON inválido sem quebrar o salvamento', () => {
    expect(extrairVerbetes(['{isso não fecha'])).toEqual([]);
  });

  it('cai para o slug quando o link está sem texto', () => {
    const campo = estado(paragrafo({ type: 'wikilink', url: '/wiki/cts', children: [] }));
    expect(extrairVerbetes([campo])).toEqual([{ slug: 'cts', texto: 'cts' }]);
  });
});
