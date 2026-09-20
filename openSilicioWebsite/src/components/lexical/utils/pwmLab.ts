export type AlternativaPwm = {
  texto: string
  correta: boolean
  explicacao: string
}

export type ConfiguracaoPwm = {
  titulo: string
  pergunta: string
  alternativas: AlternativaPwm[]
  dutyInicial: number
  frequenciaHz: number
  tensaoVolts: number
}

export type ResultadoConfiguracaoPwm =
  | { ok: true; config: ConfiguracaoPwm }
  | { ok: false; erro: string }

export type PwmMedidas = {
  periodoMs: number
  tempoAltoMs: number
  tensaoMediaVolts: number
}

export function calcularPwm(
  duty: number,
  frequenciaHz: number,
  tensaoVolts: number,
): PwmMedidas {
  const periodoMs = 1000 / frequenciaHz
  return {
    periodoMs,
    tempoAltoMs: periodoMs * (duty / 100),
    tensaoMediaVolts: tensaoVolts * duty / 100,
  }
}

export function criarCaminhoPwm(duty: number, ciclos: number): string {
  const periodo = 100
  const alto = periodo * duty / 100
  let caminho = 'M0 90'
  for (let ciclo = 0; ciclo < ciclos; ciclo += 1) {
    const inicio = ciclo * periodo
    caminho += `V10H${inicio + alto}V90H${inicio + periodo}`
  }
  return caminho
}

export async function parsearConfiguracaoPwm(
  fonte: string,
): Promise<ResultadoConfiguracaoPwm> {
  let valor: unknown
  try {
    const JSON5 = await import('json5').then((modulo) => modulo.default)
    valor = JSON5.parse(fonte) as unknown
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro)
    return { ok: false, erro: `JSON5 inválido: ${detalhe}` }
  }

  return validarConfiguracao(valor)
}

function validarConfiguracao(valor: unknown): ResultadoConfiguracaoPwm {
  if (!ehRegistro(valor)) return erroDeCampo('configuração')

  const { titulo, pergunta, alternativas, dutyInicial, frequenciaHz, tensaoVolts } = valor

  if (!ehTextoPreenchido(titulo)) return erroDeCampo('titulo')
  if (!ehTextoPreenchido(pergunta)) return erroDeCampo('pergunta')
  if (!Array.isArray(alternativas)) return erroDeCampo('alternativas')
  if (alternativas.length < 2 || alternativas.length > 4) {
    return { ok: false, erro: 'O campo "alternativas" deve ter entre 2 e 4 alternativas.' }
  }

  const alternativasValidadas: AlternativaPwm[] = []
  for (let indice = 0; indice < alternativas.length; indice += 1) {
    const alternativa = validarAlternativa(alternativas[indice], indice)
    if (!alternativa.ok) return alternativa
    alternativasValidadas.push(alternativa.alternativa)
  }

  if (alternativasValidadas.filter((alternativa) => alternativa.correta).length !== 1) {
    return { ok: false, erro: 'Deve haver exatamente uma alternativa correta.' }
  }
  if (!estaNoIntervalo(dutyInicial, 5, 95) || !Number.isInteger(dutyInicial)) {
    return erroDeCampo('dutyInicial')
  }
  if (!ehNumeroFinito(frequenciaHz) || frequenciaHz <= 0 || frequenciaHz > 100_000) {
    return erroDeCampo('frequenciaHz')
  }
  if (!ehNumeroFinito(tensaoVolts) || tensaoVolts <= 0 || tensaoVolts > 24) {
    return erroDeCampo('tensaoVolts')
  }

  return {
    ok: true,
    config: {
      titulo,
      pergunta,
      alternativas: alternativasValidadas,
      dutyInicial,
      frequenciaHz,
      tensaoVolts,
    },
  }
}

function validarAlternativa(
  valor: unknown,
  indice: number,
): ResultadoAlternativaPwm {
  if (!ehRegistro(valor)) return erroDeCampo(`alternativas[${indice}]`)

  const { texto, correta, explicacao } = valor
  if (!ehTextoPreenchido(texto)) return erroDeCampo(`alternativas[${indice}].texto`)
  if (typeof correta !== 'boolean') return erroDeCampo(`alternativas[${indice}].correta`)
  if (!ehTextoPreenchido(explicacao)) return erroDeCampo(`alternativas[${indice}].explicacao`)

  return { ok: true, alternativa: { texto, correta, explicacao } }
}

type ResultadoAlternativaPwm =
  | { ok: true; alternativa: AlternativaPwm }
  | { ok: false; erro: string }

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function estaNoIntervalo(valor: unknown, minimo: number, maximo: number): valor is number {
  return ehNumeroFinito(valor) && valor >= minimo && valor <= maximo
}

function ehNumeroFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor)
}

function ehTextoPreenchido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0
}

function erroDeCampo(campo: string): { ok: false; erro: string } {
  return { ok: false, erro: `O campo "${campo}" é inválido.` }
}
