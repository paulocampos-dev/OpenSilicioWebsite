/**
 * Conversão entre os segundos que o banco guarda e o `mm:ss` que o autor digita
 * e o leitor lê.
 *
 * A duração é informada à mão porque buscá-la no YouTube exigiria uma chave de
 * API só para um número que o autor já tem na frente dele.
 */

/** `mm:ss` ou `h:mm:ss` em segundos. Devolve null para o que não for isso. */
export function segundosDe(entrada: string): number | null {
  const limpo = entrada.trim();
  if (limpo === '') return null;

  const partes = limpo.split(':');
  if (partes.length < 2 || partes.length > 3) return null;
  if (partes.some((p) => !/^\d+$/.test(p))) return null;

  const numeros = partes.map(Number);
  // Só o primeiro campo pode passar de 59: 90:00 é uma hora e meia.
  if (numeros.slice(1).some((n) => n > 59)) return null;

  const total =
    numeros.length === 3
      ? numeros[0]! * 3600 + numeros[1]! * 60 + numeros[2]!
      : numeros[0]! * 60 + numeros[1]!;

  return total > 0 ? total : null;
}

/** Segundos em `mm:ss`, ou `h:mm:ss` quando passa de uma hora. */
export function comoRelogio(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restantes = segundos % 60;
  const doisDigitos = (n: number) => String(n).padStart(2, '0');

  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(restantes)}`
    : `${minutos}:${doisDigitos(restantes)}`;
}

/**
 * Duração por extenso, para as linhas de metadados: "14 min", "3h20".
 * Arredonda para o minuto porque ninguém escolhe uma aula por causa de segundos.
 */
export function duracaoPorExtenso(segundos: number): string {
  if (segundos <= 0) return '';

  const totalMinutos = Math.round(segundos / 60);
  if (totalMinutos < 60) return `${totalMinutos} min`;

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return minutos === 0 ? `${horas}h` : `${horas}h${String(minutos).padStart(2, '0')}`;
}
