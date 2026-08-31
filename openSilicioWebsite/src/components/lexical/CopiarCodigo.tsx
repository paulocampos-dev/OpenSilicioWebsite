import { useEffect, type RefObject } from 'react';

/* Botão de copiar nos blocos de código.

   Os tutoriais são cheios de comandos para colar no terminal, e selecionar
   várias linhas com o mouse dentro de um bloco rolável é chato o bastante para
   afastar o leitor do passo seguinte.

   O botão é injetado no DOM em vez de renderizado pelo React porque quem manda
   nessa árvore é o Lexical: o conteúdo é um editor em modo leitura, e não temos
   um ponto de montagem dentro de cada bloco. Isso é seguro aqui porque o
   leitor é read-only com estado fixo, então o Lexical não reconcilia depois da
   montagem. Um MutationObserver cobre a renderização assíncrona do conteúdo. */

const MARCA = 'data-os-copiar';

function montarBotao(bloco: HTMLElement) {
  if (bloco.querySelector(`[${MARCA}]`)) return;

  const botao = document.createElement('button');
  botao.setAttribute(MARCA, '');
  botao.className = 'os-copiar-codigo';
  botao.type = 'button';
  botao.textContent = 'copiar';
  botao.setAttribute('aria-label', 'Copiar o código deste bloco');

  botao.addEventListener('click', async (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    // innerText respeita as quebras de linha renderizadas; textContent juntaria
    // tudo numa linha só, porque cada linha é um nó separado.
    const codigo = [...bloco.childNodes]
      .filter((n) => n !== botao)
      .map((n) => (n as HTMLElement).innerText ?? n.textContent ?? '')
      .join('');
    try {
      await navigator.clipboard.writeText(codigo.trim());
      botao.textContent = 'copiado';
      botao.classList.add('os-copiar-codigo--ok');
    } catch {
      botao.textContent = 'falhou';
    }
    window.setTimeout(() => {
      botao.textContent = 'copiar';
      botao.classList.remove('os-copiar-codigo--ok');
    }, 1600);
  });

  bloco.appendChild(botao);
}

/** Percorre o container e coloca um botão de copiar em cada bloco de código. */
export function aplicarBotoesDeCopiar(raiz: HTMLElement) {
  raiz.querySelectorAll<HTMLElement>('code[data-language]').forEach(montarBotao);
}

/**
 * Liga os botões de copiar dentro do container recebido. Use no leitor de
 * conteúdo; o editor não precisa, porque lá o autor já tem o texto.
 */
export function useBotoesDeCopiar(ref: RefObject<HTMLElement | null>, conteudo: string) {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;

    // Inserir o botão é, ele próprio, uma mutação. Sem desligar o observador
    // enquanto mexemos, cada inserção reagenda o callback, e se o Lexical
    // decidir remover o botão numa reconciliação os dois ficam brigando em
    // laço infinito. Desligar durante a aplicação corta a realimentação.
    const observador = new MutationObserver(() => {
      observador.disconnect();
      aplicarBotoesDeCopiar(raiz);
      observador.observe(raiz, { childList: true, subtree: true });
    });

    aplicarBotoesDeCopiar(raiz);
    observador.observe(raiz, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [ref, conteudo]);
}
