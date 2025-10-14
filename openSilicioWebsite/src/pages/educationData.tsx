import type { ReactNode } from 'react'

export type Level = 'Iniciante' | 'Intermediário' | 'Avançado'
export type Kind = 'Projetos' | 'Guias' | 'Tutoriais'

export type Resource = {
  id: string
  title: string
  description: string
  imageUrl: string
  duration: string
  level: Level
  kind: Kind
  content: ReactNode
}

export const educationResources: Resource[] = [
  {
    id: 'led-circuit',
    title: 'Projete um circuito de LED simples',
    description:
      'Aprenda o básico de projeto de circuitos criando um circuito de LED. Conceitos de tensão, corrente e resistência.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD47G-wNFd_oo2axYvPVhtruPDxd_YFk4yR1bmwj1n6H5N4MxueDmKVZTQKMwXSOvMBuH6de5fQ65bDRCxKC3UPnP-HLMBd2UGmzvNH9b1YR6BQC6kAYovl6fZsf9SSdMKWGRYEDrnsungFpaJRRw1FPExtJqK4QbtN5Vow8NQOCgSRwMPaXlfHoZrQEEVhKnyuouQkMy6ieqwcqIqszEIzjE04PWizgT05rOuUR-cbl4J6FIMLrv57tGhlrDuZtzxnCiRTSkFW5w',
    duration: '~ 1 hora',
    level: 'Iniciante',
    kind: 'Projetos',
    content: (
      <>
        <h2>Objetivo</h2>
        <p>Construir um circuito de LED com resistor limitador, entendendo Lei de Ohm e polaridade.</p>
        <h2>Materiais</h2>
        <ul>
          <li>LED 5mm</li>
          <li>Resistor 330Ω</li>
          <li>Fonte 5V e protoboard</li>
        </ul>
      </>
    ),
  },
  {
    id: 'basic-amplifier',
    title: 'Monte um amplificador básico',
    description:
      'Explore os princípios de amplificação montando um amplificador simples. Introdução a transistores e ganho.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABuLHEir8LtxNd6CT6OGcXQ-T-GZSnM4k0EgmSaUjyuH1vhhnKLETVeSPnIrmSi_QeIlUwgF3HQelGFkEPKG80QxD95s3EYBW3VIanGGDtircgkFRMomHw1gTFIZ-ueJNnLg2GX138VpfjhTVIir8CmSC_hxcOGat9vQFmhbNhZqTX7vR5UgpaTBU_QM3hmSOaekPWWMKGmD55qkT_Q7V_-xg8BclrQIzxapXYqHfkxJ38-L2iPsyABRGafC5-RcLHPi3nmWTE9w',
    duration: '~ 2 horas',
    level: 'Iniciante',
    kind: 'Projetos',
    content: (
      <>
        <h2>Visão geral</h2>
        <p>Montagem de um amplificador emissor-comum com BJT e medição de ganho.</p>
      </>
    ),
  },
  {
    id: 'logic-gate',
    title: 'Crie uma porta lógica digital',
    description: 'Projete uma porta AND/OR/NOT usando transistores. Introdução à lógica digital.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCP4zGMLTANW8VQBPqNHHy31oDsTXiBx5SH0Cqmpw_NXsMcW2tKBeylXSJuurgOQFt1mWULAGYDbmES0UUxb0bREqRkpUIgUuiV1ZMzc4gsjg6AuWUzUofWycoDnnCtbT5j_XCm16Ph4TukOkBwV97EvgbZCBzdmt2CnyiKE7JQqldPl7Knbo5vClHldzQRw8TrQcX2ykVpMBlFGvSRyZ9LlyUTbteaX78x-orcpjajzP8Avmm4cJoLCP3y6HYb6zuK0Dl6MAE-4Q',
    duration: '~ 3 horas',
    level: 'Intermediário',
    kind: 'Projetos',
    content: (
      <>
        <h2>Teoria</h2>
        <p>Portas lógicas como redes de transistores. Tabelas verdade e margens de ruído.</p>
      </>
    ),
  },
  {
    id: 'ic-simulation',
    title: 'Simule um circuito integrado',
    description: 'Aprenda a simular um CI com ferramentas do mercado. Conceitos de simulação e análise.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAlqd0Jf3n7hX3TDEuUq8PFttTUp5uYHXaI_lKGQm_sCedbXFgPNdewFgEtl9jDCij7cI8bama1E0jpokjyMCwCrDeoXtnbmAUJz-SaAlkKdx4F3E9AcGvrUBOjCGNRhNG8JdSwRE18j3Jdn7ugIV4vVpVhaswi9pXXP8w1fq6MwTfHDRpjg_cvLVPfELpNk8GXSWPtY6SW6P0oQGHIVWf3sB7DbXoqhiymk9LsSveQ5rp4NcEiRotby-P-7yAhVEXBpB8w_TPzdw',
    duration: '~ 5 horas',
    level: 'Intermediário',
    kind: 'Tutoriais',
    content: (
      <>
        <h2>Ferramentas</h2>
        <p>Introdução a simuladores SPICE e fluxos de verificação.</p>
      </>
    ),
  },
  {
    id: 'power-supply',
    title: 'Projete uma fonte de alimentação',
    description: 'Entenda regulação e filtragem projetando uma fonte simples.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCz4FMYT3BIUnYsJqbqdH_tF8-rET-rAxKMjAPu_dn5d57z--pddqgSDh5RksKW3xXoPmY2oIYW7OC5EXS7htBMPqNTeIQJPMweQNZbEMDDWWYmDYTos166tna6yTrJ3pJruEKlkLfZnu0jKI_Akwy8qo83ECozAJC7H3y_do1jNqCWaSaAJ3NF96oS1zLx5F-IMeJZCSebeYbUV9xIn9WBWlpvwUZQx6Lv0A4Upkk46kAxT4IclwMbUxcL6F_WRst5tvcfb_L3pw',
    duration: '~ 8 horas',
    level: 'Avançado',
    kind: 'Guias',
    content: (
      <>
        <h2>Projeto</h2>
        <p>Dimensionamento de reguladores lineares e filtros LC.</p>
      </>
    ),
  },
]


