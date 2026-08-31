import { useEffect, useRef, useState, type RefObject } from 'react';

/* Botão de copiar nos blocos de código.

   Os tutoriais são cheios de comandos para colar no terminal, e selecionar
   várias linhas com o mouse dentro de um bloco rolável afasta o leitor do
   passo seguinte.

   A primeira versão disto inseria o botão dentro do <code>. Não funciona: o
   Lexical vigia o próprio contenteditable e desfaz qualquer nó estranho, então
   o botão era removido, o observador reinseria, e os dois se revezavam em laço
   infinito até travar a aba. Um post com doze blocos de código derrubava a
   página inteira, inclusive a pré-visualização do admin.

   Agora os botões são uma camada à parte, irmã do editor e fora do
   contenteditable, posicionada por medida sobre cada bloco. O Lexical não
   enxerga essa camada, e continuam sendo <button> de verdade, alcançáveis pelo
   teclado. */

interface Posicao {
  topo: number;
  esquerda: number;
}

function iguais(a: Posicao[], b: Posicao[]) {
  if (a.length !== b.length) return false;
  return a.every((p, i) => Math.round(p.topo) === Math.round(b[i]!.topo)
    && Math.round(p.esquerda) === Math.round(b[i]!.esquerda));
}

/** Copia com os planos B e C, porque nem todo contexto libera a API moderna. */
async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // cai para o método antigo
  }
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export function BotoesDeCopiar({
  containerRef,
  conteudo,
}: {
  containerRef: RefObject<HTMLElement | null>;
  conteudo: string;
}) {
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [copiado, setCopiado] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const raiz = containerRef.current;
    if (!raiz) return;
    let vivo = true;

    const medir = () => {
      if (!vivo) return;
      const base = raiz.getBoundingClientRect();
      const novas = [...raiz.querySelectorAll<HTMLElement>('code[data-language]')].map((b) => {
        const r = b.getBoundingClientRect();
        return { topo: r.top - base.top, esquerda: r.right - base.left };
      });
      // Só reposiciona quando algo realmente mudou. Sem esta guarda, o
      // ResizeObserver e o setState se realimentam.
      setPosicoes((antes) => (iguais(antes, novas) ? antes : novas));
    };

    medir();
    // O leitor mostra um esqueleto por um instante antes do conteúdo real.
    const atrasos = [150, 500, 1200].map((ms) => window.setTimeout(medir, ms));
    const observador = new ResizeObserver(medir);
    observador.observe(raiz);
    window.addEventListener('resize', medir);

    return () => {
      vivo = false;
      atrasos.forEach(window.clearTimeout);
      observador.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [containerRef, conteudo]);

  const aoCopiar = async (indice: number) => {
    const raiz = containerRef.current;
    const bloco = raiz?.querySelectorAll<HTMLElement>('code[data-language]')[indice];
    if (!bloco) return;

    // innerText respeita as quebras de linha renderizadas, que é o que o leitor
    // quer colar. textContent as ignoraria, grudando tudo numa linha. O jsdom
    // não implementa innerText, daí o segundo caminho.
    const ok = await copiar(bloco.innerText ?? bloco.textContent ?? '');
    if (!ok) {
      // Plano C: deixa o bloco selecionado, sobrando um Ctrl+C para o leitor.
      const intervalo = document.createRange();
      intervalo.selectNodeContents(bloco);
      const selecao = window.getSelection();
      selecao?.removeAllRanges();
      selecao?.addRange(intervalo);
    }
    setCopiado(indice);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopiado(null), 1800);
  };

  if (posicoes.length === 0) return null;

  return (
    <>
      {posicoes.map((p, i) => (
        <button
          key={i}
          type="button"
          className="os-copiar-codigo"
          style={{ top: `${p.topo + 4}px`, left: `${p.esquerda - 4}px` }}
          onClick={() => void aoCopiar(i)}
          aria-label={`Copiar o código do bloco ${i + 1}`}
        >
          {copiado === i ? 'copiado' : 'copiar'}
        </button>
      ))}
    </>
  );
}
