import { describe, it, expect } from 'vitest';
import { segundosDe, comoRelogio, duracaoPorExtenso } from './duracao';

describe('segundosDe', () => {
  it('lê mm:ss e h:mm:ss', () => {
    expect(segundosDe('14:20')).toBe(860);
    expect(segundosDe('0:45')).toBe(45);
    expect(segundosDe('1:02:03')).toBe(3723);
  });

  it('aceita o primeiro campo passando de 59', () => {
    // 90 minutos é uma forma legítima de escrever uma hora e meia.
    expect(segundosDe('90:00')).toBe(5400);
  });

  it('recusa o que não é duração', () => {
    expect(segundosDe('')).toBeNull();
    expect(segundosDe('14')).toBeNull();
    expect(segundosDe('14:60')).toBeNull();
    expect(segundosDe('1:2:3:4')).toBeNull();
    expect(segundosDe('quatorze minutos')).toBeNull();
    expect(segundosDe('0:00')).toBeNull();
  });
});

describe('comoRelogio', () => {
  it('volta ao formato que o autor digitou', () => {
    expect(comoRelogio(860)).toBe('14:20');
    expect(comoRelogio(45)).toBe('0:45');
    expect(comoRelogio(3723)).toBe('1:02:03');
  });

  it('sobrevive à ida e à volta', () => {
    for (const texto of ['14:20', '0:45', '1:02:03']) {
      expect(comoRelogio(segundosDe(texto)!)).toBe(texto);
    }
  });
});

describe('duracaoPorExtenso', () => {
  it('escreve como a linha de metadados mostra', () => {
    expect(duracaoPorExtenso(860)).toBe('14 min');
    expect(duracaoPorExtenso(12000)).toBe('3h20');
    expect(duracaoPorExtenso(7200)).toBe('2h');
    expect(duracaoPorExtenso(0)).toBe('');
  });
});
