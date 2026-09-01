/**
 * Slugs de curso e de aula, que são o endereço público das duas coisas.
 *
 * São duas funções porque digitar e gravar são momentos diferentes. Enquanto o
 * autor digita, um hífen no fim é um hífen a caminho da próxima palavra: se a
 * normalização completa rodar a cada tecla, "meu-" vira "meu" e nunca dá para
 * escrever um slug com hífen à mão. Na hora de salvar, aí sim vale a forma
 * final.
 */

const SEM_ACENTO = /[\u0300-\u036f]/g
const NAO_PERMITIDO = /[^a-z0-9-]+/g
const HIFENS_SEGUIDOS = /-{2,}/g
const HIFENS_NAS_PONTAS = /^-+|-+$/g

const base = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(SEM_ACENTO, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(NAO_PERMITIDO, '')
    .replace(HIFENS_SEGUIDOS, '-')
    .slice(0, 255)

/** A forma final: sem hífen sobrando nas pontas. Use ao gerar e ao salvar. */
export const emSlug = (texto: string): string => base(texto).replace(HIFENS_NAS_PONTAS, '')

/**
 * A forma tolerante, para o campo enquanto está sendo digitado: mantém um
 * hífen no fim, porque quem digitou provavelmente vai continuar escrevendo.
 */
export const emSlugDigitado = (texto: string): string => base(texto).replace(/^-+/, '')
