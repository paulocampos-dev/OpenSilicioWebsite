/**
 * Dev-only helper: seeds a handful of realistic blog posts, education
 * resources and wiki entries (matching the copy from the redesign mockups)
 * so pages can be previewed locally with real-looking content instead of
 * empty states. Safe to re-run — everything is upserted by slug/term.
 */
import 'dotenv/config';
import pool from '../config/database';
import { settingsService } from '../services/SettingsService';

function lexical(blocks: Array<{ heading?: 'h3' | 'h4'; text: string } | string>): string {
  const children = blocks.map((b) => {
    const block = typeof b === 'string' ? { text: b } : b;
    return {
      children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: block.text, type: 'text', version: 1 }],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: block.heading ? 'heading' : 'paragraph',
      ...(block.heading ? { tag: block.heading } : {}),
      version: 1,
    };
  });
  return JSON.stringify({ root: { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } });
}

const CHIP_PHOTO = '/hero-chip-closeup.jpg';
const BOARD_PHOTO = '/sobre-bancada-placa.jpg';

async function upsertWikiEntry(term: string, slug: string, definition: string, aliases: string[], content: string) {
  const existing = await pool.query('SELECT id FROM wiki_entries WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE wiki_entries SET definition = $1, aliases = $2, content = $3, published = true WHERE id = $4`,
      [definition, aliases, content, existing.rows[0].id]
    );
    return existing.rows[0].id as string;
  }
  const result = await pool.query(
    `INSERT INTO wiki_entries (term, slug, definition, aliases, content, published)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
    [term, slug, definition, aliases, content]
  );
  return result.rows[0].id as string;
}

async function upsertEducation(opts: {
  title: string; description: string; category: string; difficulty?: string;
  content: string; overview?: string; resources?: string; cover_letter?: string; image_url?: string;
}) {
  const existing = await pool.query('SELECT id FROM education_resources WHERE title = $1', [opts.title]);
  const fields = [opts.description, opts.category, opts.difficulty || null, opts.content, opts.overview || null, opts.resources || null, opts.cover_letter || null, opts.image_url || null];
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE education_resources SET description=$1, category=$2, difficulty=$3, content=$4, overview=$5, resources=$6, cover_letter=$7, image_url=$8, published=true WHERE id=$9`,
      [...fields, existing.rows[0].id]
    );
    return existing.rows[0].id as string;
  }
  const result = await pool.query(
    `INSERT INTO education_resources (title, description, category, difficulty, content, overview, resources, cover_letter, image_url, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true) RETURNING id`,
    [opts.title, ...fields]
  );
  return result.rows[0].id as string;
}

async function upsertBlogPost(opts: {
  slug: string; title: string; excerpt: string; content: string; author: string;
  category: string; cover_letter?: string; image_url?: string; toc_items?: string[];
}) {
  const existing = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [opts.slug]);
  const fields = [opts.title, opts.excerpt, opts.content, opts.author, opts.category, opts.cover_letter || null, opts.image_url || null, opts.toc_items || []];
  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE blog_posts SET title=$1, excerpt=$2, content=$3, author=$4, category=$5, cover_letter=$6, image_url=$7, toc_items=$8, published=true WHERE id=$9`,
      [...fields, existing.rows[0].id]
    );
    return existing.rows[0].id as string;
  }
  const result = await pool.query(
    `INSERT INTO blog_posts (slug, title, excerpt, content, author, category, cover_letter, image_url, toc_items, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true) RETURNING id`,
    [opts.slug, ...fields]
  );
  return result.rows[0].id as string;
}

async function linkWikiTerm(contentType: 'blog' | 'education', contentId: string, wikiEntryId: string, linkText: string) {
  const existing = await pool.query(
    'SELECT id FROM content_wiki_links WHERE content_type=$1 AND content_id=$2 AND wiki_entry_id=$3',
    [contentType, contentId, wikiEntryId]
  );
  if (existing.rows.length > 0) return;
  await pool.query(
    `INSERT INTO content_wiki_links (content_type, content_id, wiki_entry_id, link_text) VALUES ($1,$2,$3,$4)`,
    [contentType, contentId, wikiEntryId, linkText]
  );
}

async function seed() {
  console.log('🌱 Seeding mock content...');

  // --- Wiki entries ---
  const drcId = await upsertWikiEntry(
    'DRC', 'drc',
    'Verificação automática de que o layout obedece às regras geométricas do processo de fabricação.',
    ['Design Rule Check'],
    lexical(['DRC (Design Rule Check) compara cada polígono do layout contra as regras mínimas de largura, espaçamento e área do PDK. Erros de DRC bloqueiam o tape-out.'])
  );
  const netlistId = await upsertWikiEntry(
    'Netlist', 'netlist',
    'Lista de componentes e conexões de um circuito, saída da síntese e entrada do roteamento.',
    ['lista de ligações'],
    lexical(['Um netlist descreve o circuito como um grafo: instâncias de células e os nós que as conectam, sem nenhuma informação geométrica ainda.'])
  );
  const stdCellId = await upsertWikiEntry(
    'Standard cell', 'standard-cell',
    'Bloco lógico pré-caracterizado, de altura fixa, que a ferramenta posiciona em fileiras.',
    ['célula padrão'],
    lexical(['Cada standard cell (um inversor, uma porta NAND, um flip-flop) vem com uma view de layout e um arquivo Liberty descrevendo seu comportamento elétrico.'])
  );
  const tapeoutId = await upsertWikiEntry(
    'Tape-out', 'tape-out',
    'Envio dos arquivos finais de layout à fábrica — o ponto em que o projeto deixa de ser editável.',
    ['fechamento de máscara'],
    lexical(['O tape-out empacota o GDSII final, os relatórios de assinatura (DRC, LVS, timing) e a documentação exigida pela fábrica em um único envio.'])
  );

  // --- Education resources ---
  const openlaneId = await upsertEducation({
    title: 'Seu primeiro chip com OpenLane',
    description: 'Do RTL ao GDSII no PDK Sky130, com todos os arquivos do fluxo publicados.',
    category: 'Projetos',
    difficulty: 'Intermediário',
    cover_letter: 'Este roteiro nasceu de uma oficina de quatro sábados. Se você nunca rodou um fluxo digital, faça primeiro o guia de instalação do PDK — o resto assume um ambiente já pronto e cerca de duas horas de máquina livre.',
    image_url: CHIP_PHOTO,
    overview: lexical([
      'O projeto leva um bloco digital simples — um contador com saída serial — por todo o fluxo aberto: síntese com Yosys, place and route com OpenLane e verificação final no Magic. Ao final você tem um GDSII válido para o Sky130 e um relatório de timing que dá para defender numa banca.',
      'Cada etapa é publicada em um commit próprio, então é possível entrar no meio do caminho. Os erros que aparecem em sala — largura mínima de metal, violação de DRC em vias, densidade de preenchimento — estão documentados com a mensagem original da ferramenta.',
      { heading: 'h4', text: 'O que você vai entregar' },
      'RTL sintetizável e testbench com cobertura mínima. Relatórios de área, potência e timing pós-roteamento. GDSII aprovado no DRC do PDK.',
    ]),
    content: lexical([
      'O fluxo completo está descrito aqui, etapa por etapa: síntese lógica, floorplan, place and route, extração de parasitas e assinatura final (DRC/LVS).',
      'Netlist de saída da síntese, verificação de standard cell por standard cell, e o pacote final de tape-out — cada um desses termos técnicos tem uma entrada própria na wiki, ligada diretamente no texto.',
    ]),
    resources: lexical(['Repositório do fluxo, arquivos de configuração do OpenLane e o PDK Sky130A usados neste projeto.']),
  });

  const pdkId = await upsertEducation({
    title: 'Instalando o PDK Sky130',
    description: 'Ambiente completo em Linux e WSL, com as versões que realmente funcionam juntas.',
    category: 'Guias',
    difficulty: 'Iniciante',
    content: lexical(['Passo a passo de instalação do PDK Sky130A, do open_pdks às variáveis de ambiente que o OpenLane espera encontrar.']),
  });

  const teoriaId = await upsertEducation({
    title: 'Par diferencial: teoria para a prova',
    description: 'Ganho, modo comum e polarização, com a dedução que costuma cair na P2.',
    category: 'Teóricos',
    difficulty: 'Intermediário',
    content: lexical(['Dedução completa do ganho diferencial e de modo comum de um par diferencial polarizado por fonte de corrente, com os pontos que mais confundem em prova.']),
  });

  const verilogId = await upsertEducation({
    title: 'Verilog do zero em seis exercícios',
    description: 'De um somador a uma máquina de estados, simulando tudo no Icarus e no GTKWave.',
    category: 'Tutoriais',
    difficulty: 'Iniciante',
    content: lexical(['Seis exercícios progressivos de Verilog, cada um com testbench pronto para simular no Icarus Verilog e visualizar as formas de onda no GTKWave.']),
  });

  await upsertEducation({
    title: 'Referência de tensão bandgap',
    description: 'Projeto analógico completo: esquemático, layout, DRC/LVS e medições do protótipo.',
    category: 'Projetos',
    difficulty: 'Avançado',
    image_url: BOARD_PHOTO,
    content: lexical(['Projeto de uma referência bandgap do esquemático ao silício: dimensionamento, layout com casamento de dispositivos, e as medições do protótipo fabricado.']),
  });

  await upsertEducation({
    title: 'Lendo um datasheet de célula padrão',
    description: 'Timing, potência e área de uma standard cell, linha por linha do Liberty.',
    category: 'Guias',
    difficulty: 'Intermediário',
    content: lexical(['Como interpretar um arquivo Liberty (.lib) de uma standard cell: tabelas de timing, potência e as condições de operação que elas assumem.']),
  });

  // Wiki links on the OpenLane project (matches the mockup's "Termos usados aqui")
  await linkWikiTerm('education', openlaneId, drcId, 'DRC');
  await linkWikiTerm('education', openlaneId, netlistId, 'Netlist');
  await linkWikiTerm('education', openlaneId, stdCellId, 'Standard cell');

  // --- Blog posts ---
  const tapeoutPostId = await upsertBlogPost({
    slug: 'nosso-primeiro-tape-out-no-sky130',
    title: 'Nosso primeiro tape-out no Sky130',
    excerpt: 'Seis meses, quatro alunos e um bloco de 1 mm² enviado à fábrica. O que deu certo e o que refazemos.',
    category: 'Circuitos Integrados',
    author: 'Equipe OpenSilício',
    image_url: CHIP_PHOTO,
    cover_letter: 'Seis meses, quatro alunos e um bloco de 1 mm² enviado à fábrica. Este texto é o registro honesto do que atrasou, do que consertamos na véspera e do que faríamos diferente na próxima rodada.',
    toc_items: ['A especificação de meia página', 'Onde o tempo foi gasto', 'O que refaríamos'],
    content: lexical([
      'Começamos em fevereiro com uma especificação de meia página: um contador de eventos com interface serial, área máxima de 1 mm², sem blocos analógicos. A restrição foi deliberada — queríamos atravessar o fluxo inteiro, não projetar o circuito mais interessante possível.',
      'A síntese foi a parte fácil. O netlist fechou na primeira semana e o timing tinha folga confortável a 50 MHz. O tempo real foi consumido pelo que ninguém coloca no cronograma: alinhar versões de ferramenta, entender o que o relatório de densidade estava reclamando e refazer o floorplan duas vezes porque os pinos de alimentação não cabiam onde imaginávamos.',
      { heading: 'h4', text: 'O que refaríamos' },
      'Congelaríamos as versões das ferramentas no primeiro dia e escreveríamos o testbench antes do RTL. As duas decisões custaram, somadas, umas três semanas — e nenhuma delas tem a ver com projeto de circuitos.',
    ]),
  });

  await upsertBlogPost({
    slug: 'por-que-adotamos-o-klayout-na-oficina',
    title: 'Por que adotamos o KLayout na oficina',
    excerpt: 'Comparamos três editores de layout com alunos do primeiro ano e medimos onde eles travam.',
    category: 'Ferramentas abertas',
    author: 'M. Tavares',
    content: lexical(['Testamos três editores de layout com uma turma de calouros e cronometramos onde cada um travava. O KLayout venceu por ser o único que ninguém travou tentando apenas abrir um arquivo GDSII.']),
  });

  await upsertBlogPost({
    slug: 'oficina-de-layout-em-escola-tecnica',
    title: 'Oficina de layout em escola técnica',
    excerpt: 'Levamos um inversor CMOS para 40 estudantes do ensino médio. O roteiro está aberto.',
    category: 'Extensão',
    author: 'A. Ribeiro',
    content: lexical(['Levamos o desenho de um inversor CMOS para 40 estudantes de uma escola técnica em um sábado. O roteiro completo da oficina está publicado e é livre para reuso.']),
  });

  await linkWikiTerm('blog', tapeoutPostId, tapeoutId, 'Tape-out');
  await linkWikiTerm('blog', tapeoutPostId, netlistId, 'Netlist');

  // --- Featured on Landing ---
  await settingsService.updateMultiple({
    featured_education_ids: [openlaneId, pdkId, teoriaId],
    featured_blog_ids: [tapeoutPostId],
  } as any);

  console.log('✅ Mock content seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
