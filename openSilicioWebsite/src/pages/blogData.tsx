import type { ReactNode } from 'react'

export type BlogCategory = 'Eletrônica' | 'Circuitos Integrados' | 'Projeto'

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  imageUrl: string
  category: BlogCategory
  content: ReactNode
}

export const categories: Array<'Todos' | BlogCategory> = [
  'Todos',
  'Eletrônica',
  'Circuitos Integrados',
  'Projeto',
]

export const blogPosts: BlogPost[] = [
  {
    slug: 'fundamentos-de-eletronica',
    title: 'Fundamentos de Eletrônica: por onde começar',
    excerpt: 'Um guia introdutório sobre os princípios essenciais da eletrônica.',
    author: 'João Silva',
    date: '26 Out 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAs3Hv8qZcJLf_ZjXfPMKwsWTo4HHYK6kSa3c8X2SKjL3yJu8RmCol6RPLswmDkT2BbaVftS4RXM5o-1BVY7yXjYkmOHnHkPI-LamvSP83ZgDsoMU107iw3BCLFS35wSoD3n1NztqW84jnFGVZBb91PZcC5ZF3jcaqpB-uhgnR320zAgI0WMbF0-eE2qE5J6Jb4ezve-AG-IRlLkIdu5nXeKxp5m-7jdG-r-Xvpgz0ewDnha5suClYnUGGSGr4zKx7kTWRcZlCT_Q',
    category: 'Eletrônica',
    content: (
      <>
        <p>
          Este artigo apresenta os conceitos fundamentais de eletrônica: tensão, corrente, resistência e potência. Ele
          serve como um ponto de partida para quem deseja compreender circuitos e iniciar experimentos práticos com
          componentes básicos.
        </p>
        <h2>Conceitos-chave</h2>
        <p>
          Começamos com a Lei de Ohm e analisamos elementos como resistores, capacitores e indutores, além de sua
          resposta no tempo e em frequência. Também discutimos boas práticas de medição e simulação.
        </p>
      </>
    ),
  },
  {
    slug: 'tecnicas-avancadas-circuitos-integrados',
    title: 'Técnicas avançadas em projeto de CI',
    excerpt: 'Métodos e ferramentas de ponta para projetar circuitos integrados complexos.',
    author: 'Maria Souza',
    date: '24 Out 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAETf7c1Yw5X7CbtUIwTyJYE8Hr0oTQ_sDiRk9H_dRBO-v70HMk52UV4HBv_E135uGZbYKc4OOgfJy09yVSk09uFIELAssTjYItoBOIj-gmAKLHo6ASw1aKo3n_vTkeI-irWVq38AOQ4Zvix-t5yZf2UggFMrqwgbi3LRLrdzJo9zWnxA84v3iHLhu3q87lEyyrdslLyTewlTQC5H-VFkE43PMIqsQaNvgLk-CfPGBbmD91r3NODNc6-0CLdrm-X5CPniWi05_UFg',
    category: 'Circuitos Integrados',
    content: (
      <>
        <p>
          Exploramos estratégias modernas de síntese lógica, temporização, place & route e verificação física.
          Apresentamos ainda considerações de consumo, área e desempenho.
        </p>
        <h2>Processo de projeto</h2>
        <p>
          Do RTL ao GDSII, revisamos etapas críticas e ferramentas que podem acelerar o desenvolvimento, com foco em
          fluxos reprodutíveis.
        </p>
      </>
    ),
  },
  {
    slug: 'vitrine-microcontrolador-customizado',
    title: 'Vitrine: construindo um microcontrolador customizado',
    excerpt: 'Um passo a passo de um projeto estudantil, com desafios e decisões.',
    author: 'Alex Pereira',
    date: '21 Out 2023',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBElfLMNEHseAJN4sN-PeAZmz3wN6_9Ya_2AxZR25rV4WWANKbX03xWKrQJQ46yBoU7DUFEyNzTx3ulcKQcZeoT3fCw9Uzw1Zbt9SAXZMm-WnAKNrdbYhWPY-ky03CXvoiYy7v2zy8OWDtFfBZ8HXMkQHIEpNJ9EDxg307HUpS-rtu8fprGTtTpXTW_JEUDY87IsDkMFqwc65osQR5vmh-j_AAzE00mcL9T_Wv7Mz5fWCyT702IC-gq4QqyDtXCp7NnqStJ13KdAA',
    category: 'Projeto',
    content: (
      <>
        <p>
          Apresentamos o escopo, a arquitetura e as escolhas de IPs para compor um microcontrolador simples, além dos
          principais obstáculos encontrados durante a implementação.
        </p>
        <h2>Resultados</h2>
        <p>
          Discutimos métricas de área, frequência alvo e consumo estimado, bem como ideias para evolução do projeto.
        </p>
      </>
    ),
  },
]


