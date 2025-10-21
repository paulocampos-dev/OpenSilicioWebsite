import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert simple text to BlockNote JSON
function textToBlockNote(text: string) {
  return JSON.stringify([{
    "id": "1",
    "type": "paragraph",
    "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
    "content": [{"type": "text", "text": text, "styles": {}}],
    "children": []
  }]);
}

// Sample blog posts data
const blogPosts = [
  {
    slug: 'fundamentos-de-eletronica',
    title: 'Fundamentos de Eletrônica: por onde começar',
    excerpt: 'Um guia introdutório sobre os princípios essenciais da eletrônica.',
    author: 'João Silva',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs3Hv8qZcJLf_ZjXfPMKwsWTo4HHYK6kSa3c8X2SKjL3yJu8RmCol6RPLswmDkT2BbaVftS4RXM5o-1BVY7yXjYkmOHnHkPI-LamvSP83ZgDsoMU107iw3BCLFS35wSoD3n1NztqW84jnFGVZBb91PZcC5ZF3jcaqpB-uhgnR320zAgI0WMbF0-eE2qE5J6Jb4ezve-AG-IRlLkIdu5nXeKxp5m-7jdG-r-Xvpgz0ewDnha5suClYnUGGSGr4zKx7kTWRcZlCT_Q',
    category: 'Eletrônica',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Este artigo apresenta os conceitos fundamentais de eletrônica: tensão, corrente, resistência e potência. Ele serve como um ponto de partida para quem deseja compreender circuitos e iniciar experimentos práticos com componentes básicos.", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Conceitos-chave", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Começamos com a Lei de Ohm e analisamos elementos como resistores, capacitores e indutores, além de sua resposta no tempo e em frequência. Também discutimos boas práticas de medição e simulação.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
  {
    slug: 'tecnicas-avancadas-circuitos-integrados',
    title: 'Técnicas avançadas em projeto de CI',
    excerpt: 'Métodos e ferramentas de ponta para projetar circuitos integrados complexos.',
    author: 'Maria Souza',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAETf7c1Yw5X7CbtUIwTyJYE8Hr0oTQ_sDiRk9H_dRBO-v70HMk52UV4HBv_E135uGZbYKc4OOgfJy09yVSk09uFIELAssTjYItoBOIj-gmAKLHo6ASw1aKo3n_vTkeI-irWVq38AOQ4Zvix-t5yZf2UggFMrqwgbi3LRLrdzJo9zWnxA84v3iHLhu3q87lEyyrdslLyTewlTQC5H-VFkE43PMIqsQaNvgLk-CfPGBbmD91r3NODNc6-0CLdrm-X5CPniWi05_UFg',
    category: 'Circuitos Integrados',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Exploramos estratégias modernas de síntese lógica, temporização, place & route e verificação física. Apresentamos ainda considerações de consumo, área e desempenho.", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Processo de projeto", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Do RTL ao GDSII, revisamos etapas críticas e ferramentas que podem acelerar o desenvolvimento, com foco em fluxos reprodutíveis.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
  {
    slug: 'vitrine-microcontrolador-customizado',
    title: 'Vitrine: construindo um microcontrolador customizado',
    excerpt: 'Um passo a passo de um projeto estudantil, com desafios e decisões.',
    author: 'Alex Pereira',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBElfLMNEHseAJN4sN-PeAZmz3wN6_9Ya_2AxZR25rV4WWANKbX03xWKrQJQ46yBoU7DUFEyNzTx3ulcKQcZeoT3fCw9Uzw1Zbt9SAXZMm-WnAKNrdbYhWPY-ky03CXvoiYy7v2zy8OWDtFfBZ8HXMkQHIEpNJ9EDxg307HUpS-rtu8fprGTtTpXTW_JEUDY87IsDkMFqwc65osQR5vmh-j_AAzE00mcL9T_Wv7Mz5fWCyT702IC-gq4QqyDtXCp7NnqStJ13KdAA',
    category: 'Projeto',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Apresentamos o escopo, a arquitetura e as escolhas de IPs para compor um microcontrolador simples, além dos principais obstáculos encontrados durante a implementação.", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Resultados", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Discutimos métricas de área, frequência alvo e consumo estimado, bem como ideias para evolução do projeto.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
];

// Sample education resources data
const educationResources = [
  {
    title: 'Introdução à Eletrônica Digital',
    description: 'Aprenda os fundamentos da eletrônica digital, incluindo portas lógicas, álgebra booleana e circuitos combinacionais.',
    category: 'Guias',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Objetivos de Aprendizagem", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Ao final deste módulo, você será capaz de entender os princípios básicos da eletrônica digital, identificar e usar portas lógicas básicas, aplicar álgebra booleana em circuitos e projetar circuitos combinacionais simples.", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Conteúdo", "styles": {}}],
        "children": []
      },
      {
        "id": "4",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Este módulo cobre os conceitos essenciais da eletrônica digital, começando com uma introdução aos sistemas digitais e suas vantagens sobre os sistemas analógicos.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
  {
    title: 'Projeto de Circuitos Analógicos',
    description: 'Domine as técnicas de projeto de circuitos analógicos, desde amplificadores operacionais até filtros.',
    category: 'Tutoriais',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Introdução", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "O projeto de circuitos analógicos é uma habilidade fundamental para qualquer engenheiro eletrônico. Este tutorial aborda os conceitos essenciais e técnicas práticas.", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Tópicos Abordados", "styles": {}}],
        "children": []
      },
      {
        "id": "4",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Amplificadores operacionais, filtros ativos e passivos, estabilidade e compensação, simulação e análise.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
];

// Sample wiki entries data
const wikiEntries = [
  {
    term: 'CMOS',
    slug: 'cmos',
    definition: 'Complementary Metal-Oxide-Semiconductor - tecnologia de fabricação de circuitos integrados',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Definição", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "CMOS (Complementary Metal-Oxide-Semiconductor) é uma tecnologia de fabricação de circuitos integrados que utiliza transistores MOSFET complementares (nMOS e pMOS) para criar circuitos lógicos.", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Características", "styles": {}}],
        "children": []
      },
      {
        "id": "4",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Baixo consumo de energia, alta densidade de integração, boa imunidade a ruído e escalabilidade.", "styles": {}}],
        "children": []
      },
      {
        "id": "5",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Aplicações", "styles": {}}],
        "children": []
      },
      {
        "id": "6",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "CMOS é amplamente utilizado em microprocessadores, memórias, sensores de imagem e muitos outros dispositivos eletrônicos modernos.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
  {
    term: 'FPGA',
    slug: 'fpga',
    definition: 'Field-Programmable Gate Array - dispositivo lógico programável',
    content: JSON.stringify([
      {
        "id": "1",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Definição", "styles": {}}],
        "children": []
      },
      {
        "id": "2",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "FPGA (Field-Programmable Gate Array) é um dispositivo semicondutor que contém uma matriz de blocos lógicos programáveis interconectados que podem ser configurados pelo usuário após a fabricação.", "styles": {}}],
        "children": []
      },
      {
        "id": "3",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Vantagens", "styles": {}}],
        "children": []
      },
      {
        "id": "4",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "Flexibilidade de design, prototipação rápida, reconfigurabilidade e paralelismo.", "styles": {}}],
        "children": []
      },
      {
        "id": "5",
        "type": "heading",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2},
        "content": [{"type": "text", "text": "Usos Comuns", "styles": {}}],
        "children": []
      },
      {
        "id": "6",
        "type": "paragraph",
        "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
        "content": [{"type": "text", "text": "FPGAs são utilizados em processamento de sinais, comunicação, computação de alto desempenho e prototipagem de ASICs.", "styles": {}}],
        "children": []
      }
    ]),
    published: true,
  },
];

async function migrateData() {
  try {
    console.log('🔄 Iniciando migração de dados...');

    // Insert blog posts
    console.log('📝 Inserindo posts do blog...');
    for (const post of blogPosts) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO blog_posts
         (id, slug, title, excerpt, content, author, image_url, category, published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [id, post.slug, post.title, post.excerpt, post.content, post.author, post.image_url, post.category, post.published]
      );
    }

    // Insert education resources
    console.log('🎓 Inserindo recursos educacionais...');
    for (const resource of educationResources) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO education_resources
         (id, title, description, content, category, published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [id, resource.title, resource.description, resource.content, resource.category, resource.published]
      );
    }

    // Insert wiki entries
    console.log('📚 Inserindo entradas da wiki...');
    for (const entry of wikiEntries) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO wiki_entries
         (id, term, slug, definition, content, published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (term) DO NOTHING`,
        [id, entry.term, entry.slug, entry.definition, entry.content, entry.published]
      );
    }

    console.log('✅ Migração de dados concluída com sucesso!');
    console.log(`📊 Dados inseridos:`);
    console.log(`   - ${blogPosts.length} posts do blog`);
    console.log(`   - ${educationResources.length} recursos educacionais`);
    console.log(`   - ${wikiEntries.length} entradas da wiki`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migrateData();
