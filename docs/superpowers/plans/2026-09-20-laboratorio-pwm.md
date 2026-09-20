# Laboratório PWM: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma bancada PWM interativa às aulas e inserir a primeira instância, ainda em rascunho, na aula "Misturador de cores RGB".

**Architecture:** Um módulo puro valida a fonte JSON5, calcula as medidas e gera a onda. Um componente React cuida apenas da interação e da apresentação. Um `DecoratorBlockNode` liga o componente ao Lexical e segue o mesmo fluxo de autoria dos widgets existentes.

**Tech Stack:** React 19, TypeScript estrito, Lexical 0.37, JSON5, CSS do design system, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-laboratorio-pwm-design.md`

## Restrições globais

- Não adicionar dependências de produção.
- Manter `LEXICAL_NODES` como a única lista de nós usada pelo editor e pelo leitor.
- Carregar JSON5 por `import()` dinâmico, como WaveDrom e Anatomia, para não aumentar o bundle inicial de todas as páginas.
- Aceitar de duas a quatro alternativas, exatamente uma correta, `dutyInicial` inteiro de 5 a 95, `frequenciaHz` maior que 0 e no máximo 100.000, e `tensaoVolts` maior que 0 e no máximo 24.
- Começar com o slider desabilitado. Qualquer hipótese o habilita, sem bloquear a aula ou exigir acerto.
- Não persistir interação, não chamar API e não somar o laboratório ao progresso.
- Animar somente `transform` e `opacity`, por 140 ms, e respeitar `prefers-reduced-motion`.
- Usar os tokens existentes, cantos retos e a moldura `.os-widget`.
- Preservar `exactOptionalPropertyTypes` e não usar `any`.
- Manter a aula piloto como rascunho.

## Foco da revisão

- Uma fonte muda antes de o `import('json5')` anterior terminar. O resultado antigo não pode substituir a configuração nova. O teste do nó cobre a troca durante a carga.
- O atributo `data-os-pwm-lab=""` chega vazio pela colagem. O importador deve criar o nó e mostrar um erro editável, não descartar o bloco. O teste de DOM cobre esse caso.
- Valores válidos nos limites, 5%, 95%, 0,01 ms e 24 V, precisam continuar finitos e legíveis. Os testes do módulo puro cobrem os extremos.
- O aluno troca de hipótese depois de mover o slider. A nova explicação deve aparecer sem redefinir o duty cycle. O teste do componente cobre a sequência.
- Um autor salva JSON5 sintaticamente válido com formas erradas, como `alternativas: null` ou duas corretas. O parser deve devolver uma mensagem específica e a aula deve continuar renderizando. Os testes do parser e do nó cobrem essas formas.

---

## Mapa de arquivos

### Novos

- `openSilicioWebsite/src/components/lexical/utils/pwmLab.ts`: tipos, validação, cálculos e caminho SVG.
- `openSilicioWebsite/src/components/lexical/utils/pwmLab.test.ts`: testes do domínio PWM.
- `openSilicioWebsite/src/components/lexical/widgets/PwmLab.tsx`: bancada pública, sem dependência de Lexical.
- `openSilicioWebsite/src/components/lexical/widgets/PwmLab.test.tsx`: testes de interação e acessibilidade.
- `openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.tsx`: serialização, carga assíncrona e controles de autoria.
- `openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.test.tsx`: testes de serialização, DOM, erro e corrida assíncrona.
- `openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.tsx`: comando de inserção do nó.
- `openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.test.tsx`: integração do comando com um editor real.

### Modificados

- `openSilicioWebsite/src/components/lexical/nodeSet.ts`: registrar `PwmLabNode`.
- `openSilicioWebsite/src/components/lexical/widgets.tsx`: montar `PwmLabPlugin` no editor.
- `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx`: botão "Inserir Laboratório PWM".
- `openSilicioWebsite/src/styles/design-system/patterns/widgets.css`: layout, estados e responsividade da bancada.
- `conteudo/cursos/projeto-digital/02-1-misturador-rgb.md`: registrar o widget no ponto didático correto.
- `conteudo/cursos/projeto-digital/02-1-misturador-rgb.html`: saída regenerada para a autoria.
- `conteudo/index.html`: índice regenerado pelo `build.js`.
- `docs/course-authoring-improvements.md`: registrar atritos reais encontrados ao inserir o laboratório.
- `AGENTS.md`: documentar o formato, a carga dinâmica e a regra de estado transitório do novo nó.

## Tarefa 1: domínio PWM validado e testado

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/utils/pwmLab.ts`
- Create: `openSilicioWebsite/src/components/lexical/utils/pwmLab.test.ts`

**Interfaces:**
- Consumes: `json5` por importação dinâmica.
- Produces: `AlternativaPwm`, `ConfiguracaoPwm`, `ResultadoConfiguracaoPwm`, `PwmMedidas`, `parsearConfiguracaoPwm()`, `calcularPwm()` e `criarCaminhoPwm()`.

- [ ] **Step 1: escrever testes que fixem tipos, limites, matemática e onda**

Criar `pwmLab.test.ts` com estes casos concretos:

```ts
import { describe, expect, it } from 'vitest'
import {
  calcularPwm,
  criarCaminhoPwm,
  parsearConfiguracaoPwm,
} from './pwmLab'

const fonteValida = `{
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda?',
  alternativas: [
    { texto: 'Frequência', correta: false, explicacao: 'Permanece igual.' },
    { texto: 'Brilho', correta: true, explicacao: 'Aumenta.' },
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3,
}`

describe('calcularPwm', () => {
  it.each([
    [25, 10, 2.5, 0.825],
    [50, 10, 5, 1.65],
    [75, 10, 7.5, 2.475],
  ])('calcula %s%%', (duty, periodoMs, tempoAltoMs, tensaoMediaVolts) => {
    expect(calcularPwm(duty, 100, 3.3)).toEqual({
      periodoMs,
      tempoAltoMs,
      tensaoMediaVolts,
    })
  })

  it('mantém medidas finitas nos limites válidos', () => {
    const medidas = calcularPwm(95, 100_000, 24)
    expect(medidas).toEqual({ periodoMs: 0.01, tempoAltoMs: 0.0095, tensaoMediaVolts: 22.8 })
    expect(Object.values(medidas).every(Number.isFinite)).toBe(true)
  })
})

describe('criarCaminhoPwm', () => {
  it('gera quatro pulsos com largura proporcional ao duty cycle', () => {
    expect(criarCaminhoPwm(25, 4)).toBe(
      'M0 90V10H25V90H100V10H125V90H200V10H225V90H300V10H325V90H400',
    )
  })

  it.each([5, 95])('gera caminho nos limites, %s%%', (duty) => {
    expect(criarCaminhoPwm(duty, 4)).toMatch(/^M0 90V10/)
  })
})

describe('parsearConfiguracaoPwm', () => {
  it('aceita JSON5 com comentário e vírgula final', async () => {
    const resultado = await parsearConfiguracaoPwm(`// comentário\n${fonteValida}`)
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.config.alternativas).toHaveLength(2)
    expect(resultado.config.alternativas.filter((a) => a.correta)).toHaveLength(1)
  })

  it.each([
    ['{', 'JSON5 inválido'],
    ['{}', 'campo "titulo"'],
    [fonteValida.replace('alternativas: [', 'alternativas: null, ignoradas: ['), 'campo "alternativas"'],
    [fonteValida.replace("correta: false", "correta: true"), 'exatamente uma alternativa correta'],
    [fonteValida.replace('dutyInicial: 25', 'dutyInicial: 4'), 'dutyInicial'],
    [fonteValida.replace('frequenciaHz: 100', 'frequenciaHz: 0'), 'frequenciaHz'],
    [fonteValida.replace('tensaoVolts: 3.3', 'tensaoVolts: 25'), 'tensaoVolts'],
  ])('rejeita forma inválida com mensagem útil', async (fonte, mensagem) => {
    const resultado = await parsearConfiguracaoPwm(fonte)
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain(mensagem)
  })
})
```

Ao implementar, ajustar a entrada de objeto vazio para uma string JSON5 válida,
`{}`, se a interpolação acima ficar menos legível no teste final. Não ampliar a
matriz de casos além das regras da especificação.

- [ ] **Step 2: rodar apenas o teste novo e confirmar a falha**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/utils/pwmLab.test.ts
```

Expected: FAIL porque `./pwmLab` ainda não existe.

- [ ] **Step 3: implementar tipos, parser e cálculos sem dependência de React**

Criar `pwmLab.ts` com estas interfaces e retornos discriminados:

```ts
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
    tempoAltoMs: periodoMs * duty / 100,
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
```

O parser deve começar assim e passar o valor `unknown` por guardas locais antes
de construir `ConfiguracaoPwm`:

```ts
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
```

Usar `typeof valor === 'object' && valor !== null`, `Array.isArray` e acessos
estreitados por `Record<string, unknown>`. Não fazer cast direto para
`ConfiguracaoPwm`. Validar cada alternativa e devolver a primeira mensagem
específica encontrada.

- [ ] **Step 4: rodar o teste focado até passar**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/utils/pwmLab.test.ts
```

Expected: PASS para todos os casos.

- [ ] **Step 5: rodar typecheck e registrar a entrega**

Run:

```bash
cd openSilicioWebsite
npm run typecheck
```

Expected: exit 0.

Commit:

```bash
git add openSilicioWebsite/src/components/lexical/utils/pwmLab.ts openSilicioWebsite/src/components/lexical/utils/pwmLab.test.ts
git commit -m "feat(cursos): add PWM lab domain model"
```

## Tarefa 2: bancada React acessível e responsiva

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/widgets/PwmLab.tsx`
- Create: `openSilicioWebsite/src/components/lexical/widgets/PwmLab.test.tsx`
- Modify: `openSilicioWebsite/src/styles/design-system/patterns/widgets.css`

**Interfaces:**
- Consumes: `ConfiguracaoPwm`, `calcularPwm()` e `criarCaminhoPwm()` da tarefa 1.
- Produces: `PwmLab({ configuracao }: { configuracao: ConfiguracaoPwm })`.

- [ ] **Step 1: escrever o teste de comportamento antes do componente**

Criar `PwmLab.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PwmLab } from './PwmLab'
import type { ConfiguracaoPwm } from '../utils/pwmLab'

const configuracao: ConfiguracaoPwm = {
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda quando o duty cycle passa de 25% para 75%?',
  alternativas: [
    { texto: 'A frequência triplica.', correta: false, explicacao: 'Ela permanece em 100 Hz.' },
    { texto: 'O LED parece mais brilhante.', correta: true, explicacao: 'O tempo alto aumenta.' },
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3,
}

describe('PwmLab', () => {
  it('exige uma hipótese antes de liberar a bancada', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    const slider = screen.getByRole('slider', { name: /duty cycle/i })
    expect(slider).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /frequência triplica/i }))

    expect(slider).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Ela permanece em 100 Hz.')
  })

  it('atualiza onda e leituras sem persistir ou chamar rede', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))

    const slider = screen.getByRole('slider', { name: /duty cycle/i })
    fireEvent.change(slider, { target: { value: '75' } })

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('7,5 ms')).toBeInTheDocument()
    expect(screen.getByText('2,48 V')).toBeInTheDocument()
    expect(screen.getByTestId('onda-pwm')).toHaveAttribute(
      'd',
      'M0 90V10H75V90H100V10H175V90H200V10H275V90H300V10H375V90H400',
    )
  })

  it('troca a explicação sem redefinir o ajuste atual', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } })
    await user.click(screen.getByRole('button', { name: /frequência triplica/i }))

    expect(screen.getByRole('slider')).toHaveValue('75')
    expect(screen.getByRole('status')).toHaveTextContent('Ela permanece em 100 Hz.')
  })
})
```

- [ ] **Step 2: rodar o teste e confirmar que o componente não existe**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/widgets/PwmLab.test.tsx
```

Expected: FAIL ao resolver `./PwmLab`.

- [ ] **Step 3: implementar a máquina de estado pequena da bancada**

Criar `PwmLab.tsx`. O estado e a derivação devem seguir esta forma:

```tsx
import { useEffect, useMemo, useState } from 'react'
import {
  calcularPwm,
  criarCaminhoPwm,
  type ConfiguracaoPwm,
} from '../utils/pwmLab'

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function PwmLab({ configuracao }: { configuracao: ConfiguracaoPwm }) {
  const [alternativa, setAlternativa] = useState<number | null>(null)
  const [duty, setDuty] = useState(configuracao.dutyInicial)
  const [pulso, setPulso] = useState(false)
  const medidas = useMemo(
    () => calcularPwm(duty, configuracao.frequenciaHz, configuracao.tensaoVolts),
    [configuracao.frequenciaHz, configuracao.tensaoVolts, duty],
  )

  useEffect(() => {
    setAlternativa(null)
    setDuty(configuracao.dutyInicial)
  }, [configuracao])

  const mudarDuty = (novoDuty: number) => {
    setDuty(novoDuty)
    setPulso(false)
    requestAnimationFrame(() => setPulso(true))
  }

  return (
    <div className="os-pwm">
      <section className="os-pwm__previsao" aria-labelledby="os-pwm-pergunta">
        <p className="os-pwm__rotulo">Preveja antes de testar</p>
        <h3 id="os-pwm-pergunta">{configuracao.pergunta}</h3>
        <p>Escolha uma hipótese. Você poderá tentar de novo.</p>
        <div className="os-pwm__alternativas" role="group" aria-label="Hipóteses">
          {configuracao.alternativas.map((item, indice) => (
            <button
              key={`${indice}-${item.texto}`}
              type="button"
              aria-pressed={alternativa === indice}
              onClick={() => setAlternativa(indice)}
            >
              <span aria-hidden="true">{String.fromCharCode(65 + indice)}</span>
              {item.texto}
            </button>
          ))}
        </div>
        <div className="os-pwm__feedback" role="status" aria-live="polite">
          {alternativa === null ? '' : configuracao.alternativas[alternativa]?.explicacao}
        </div>
      </section>

      <section className="os-pwm__bancada" aria-label={configuracao.titulo}>
        <svg viewBox="0 0 400 100" role="img" aria-label={`Forma de onda PWM em ${duty}%`}>
          <path data-testid="onda-pwm" d={criarCaminhoPwm(duty, 4)} />
        </svg>
        <dl className="os-pwm__leituras">
          <div><dt>Período</dt><dd>{numero.format(medidas.periodoMs)} ms</dd></div>
          <div><dt>Frequência</dt><dd>{numero.format(configuracao.frequenciaHz)} Hz</dd></div>
          <div><dt>Tempo alto</dt><dd>{numero.format(medidas.tempoAltoMs)} ms</dd></div>
          <div><dt>Tensão média</dt><dd>{numero.format(medidas.tensaoMediaVolts)} V</dd></div>
        </dl>
        <label className="os-pwm__controle">
          <span>Duty cycle <output>{duty}%</output></span>
          <input
            type="range"
            min="5"
            max="95"
            step="5"
            value={duty}
            disabled={alternativa === null}
            aria-label="Duty cycle em porcentagem"
            onChange={(evento) => mudarDuty(Number(evento.currentTarget.value))}
          />
        </label>
        <span className="os-pwm__led" style={{ opacity: Math.max(.08, duty / 100) }} aria-hidden="true">
          <span
            className="os-pwm__led-pulso"
            data-pulso={pulso || undefined}
            onAnimationEnd={() => setPulso(false)}
          />
        </span>
      </section>
    </div>
  )
}
```

Limpar `pulso` ao fim da animação com `onAnimationEnd`. Não criar timer. O
elemento externo mantém a opacidade proporcional ao duty cycle e o filho recebe
a animação, para o pulso não apagar a leitura de brilho. Manter as leituras
dentro do `dl`, pois elas carregam a informação acessível que o SVG apenas
ilustra.

- [ ] **Step 4: adicionar CSS seguindo a opção A**

Acrescentar uma seção `/* laboratório PWM */` a `widgets.css`. Usar grade de
duas colunas acima de `900px`, uma coluna abaixo, bordas com `--color-line`,
fundo `--color-bg-alt`, monoespaçada nas medidas e aço apenas em seleção,
onda e controle. O estado selecionado deve ter texto e borda, não apenas cor.

O pulso permitido é:

```css
@keyframes os-pwm-pulso {
  0% { opacity: .72; transform: scale(1); }
  50% { opacity: 1; transform: scale(.88); }
  100% { opacity: .72; transform: scale(1); }
}

.os-pwm__led-pulso[data-pulso] {
  animation: os-pwm-pulso 140ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .os-pwm__led-pulso[data-pulso] { animation: none; }
}
```

Não animar caminho SVG, largura, cor, sombra ou filtro. O `opacity` inline do
LED externo representa o duty cycle; a animação do filho não altera esse valor.

- [ ] **Step 5: rodar teste focado, typecheck e build**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/widgets/PwmLab.test.tsx
npm run typecheck
npm run build
```

Expected: todos terminam com exit 0.

- [ ] **Step 6: registrar a entrega visual**

```bash
git add openSilicioWebsite/src/components/lexical/widgets/PwmLab.tsx openSilicioWebsite/src/components/lexical/widgets/PwmLab.test.tsx openSilicioWebsite/src/styles/design-system/patterns/widgets.css
git commit -m "feat(cursos): add interactive PWM bench"
```

## Tarefa 3: nó Lexical e autoria no editor

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.tsx`
- Create: `openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.test.tsx`
- Create: `openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.tsx`
- Create: `openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.test.tsx`
- Modify: `openSilicioWebsite/src/components/lexical/nodeSet.ts`
- Modify: `openSilicioWebsite/src/components/lexical/widgets.tsx`
- Modify: `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx`

**Interfaces:**
- Consumes: `PwmLab`, `parsearConfiguracaoPwm()` e `ResultadoConfiguracaoPwm`.
- Produces: `PwmLabNode`, `$createPwmLabNode()`, `$isPwmLabNode()`, `PWM_LAB_EXEMPLO` e `INSERT_PWM_LAB_COMMAND`.

- [ ] **Step 1: escrever testes do nó e do comando**

Em `PwmLabNode.test.tsx`, usar `createHeadlessEditor({ nodes: [PwmLabNode] })`
para verificar a ida e volta:

```tsx
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'
import {
  $createPwmLabNode,
  $isPwmLabNode,
  PwmLabNode,
  PWM_LAB_EXEMPLO,
} from './PwmLabNode'

describe('PwmLabNode', () => {
  it('serializa e desserializa a fonte sem perda', () => {
    const editor = createHeadlessEditor({ nodes: [PwmLabNode] })
    editor.update(() => {
      const node = $createPwmLabNode(PWM_LAB_EXEMPLO)
      $getRoot().append(node)
      const serializado = node.exportJSON()
      const restaurado = PwmLabNode.importJSON(serializado)
      expect(restaurado.getFonte()).toBe(PWM_LAB_EXEMPLO)
      expect(restaurado.exportJSON()).toMatchObject({ type: 'os-pwm-lab', version: 1 })
    }, { discrete: true })
  })

  it('importa até uma fonte vazia para que o autor possa corrigir', () => {
    const elemento = document.createElement('div')
    elemento.setAttribute('data-os-pwm-lab', '')
    const oferta = PwmLabNode.importDOM()?.div?.(elemento)
    expect(oferta).not.toBeNull()
    const saida = oferta?.conversion(elemento)
    expect($isPwmLabNode(saida?.node)).toBe(true)
  })
})
```

Adicionar um teste React com `vi.mock('../utils/pwmLab')` e duas promises
controladas. Renderizar o nó dentro de um `LexicalComposer`, trocar `fonte`
antes de resolver a primeira promise e confirmar que somente o segundo resultado
chega à bancada. No mesmo arquivo, fazer o parser devolver `{ ok: false,
erro: 'campo "alternativas" ausente' }` e verificar `.os-widget__erro` sem erro
lançado pelo editor.

Em `PwmLabPlugin.test.tsx`, seguir o padrão de `EquationPlugin.test.tsx`. Capturar
o editor com `useLexicalComposerContext`, disparar o comando e inspecionar a
raiz:

```tsx
act(() => {
  editor.dispatchCommand(INSERT_PWM_LAB_COMMAND, {})
})

await waitFor(() => {
  const tipos = editor.getEditorState().read(() => $getRoot().getChildren().map((node) => node.getType()))
  expect(tipos).toContain('os-pwm-lab')
})
```

- [ ] **Step 2: rodar os dois testes e confirmar as falhas**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/nodes/PwmLabNode.test.tsx src/components/lexical/plugins/PwmLabPlugin.test.tsx
```

Expected: FAIL porque nó, plugin e comando ainda não existem.

- [ ] **Step 3: implementar o nó com carga cancelável**

Definir a fonte padrão como constante exportada. Ela deve usar a pergunta e as
três alternativas aprovadas no mock. O núcleo da carga precisa ignorar resultado
antigo:

```tsx
const [resultado, setResultado] = React.useState<ResultadoConfiguracaoPwm | null>(null)

React.useEffect(() => {
  let ativo = true
  setResultado(null)
  void parsearConfiguracaoPwm(fonte).then((novoResultado) => {
    if (ativo) setResultado(novoResultado)
  })
  return () => {
    ativo = false
  }
}, [fonte])
```

Renderizar `Carregando laboratório...`, `.os-widget__erro` ou
`<PwmLab configuracao={resultado.config} />`. Manter os botões `editar` e
`remover` na barra apenas quando `editor.isEditable()` for verdadeiro. `editar`
usa `window.prompt`, chama `node.setFonte(nova)` dentro de `editor.update()` e
não faz nada quando o autor cancela.

`importDOM()` deve verificar `hasAttribute`, não a verdade do valor:

```ts
static importDOM(): DOMConversionMap | null {
  return {
    div: (domNode) => domNode.hasAttribute('data-os-pwm-lab')
      ? { conversion: converterElemento, priority: 2 }
      : null,
  }
}

function converterElemento(domNode: HTMLElement): DOMConversionOutput {
  return { node: $createPwmLabNode(domNode.getAttribute('data-os-pwm-lab') ?? '') }
}
```

`getTextContent()` devolve `this.__fonte`. Assim título, pergunta e alternativas
continuam disponíveis em texto bruto sem importar JSON5 de modo síncrono.

- [ ] **Step 4: implementar o plugin e registrar o nó nos dois lados do Lexical**

Criar `PwmLabPlugin.tsx` seguindo o contrato:

```tsx
export type InserirPwmLabPayload = { fonte?: string }

export const INSERT_PWM_LAB_COMMAND: LexicalCommand<InserirPwmLabPayload> =
  createCommand('INSERT_PWM_LAB_COMMAND')

export default function PwmLabPlugin(): null {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!editor.hasNodes([PwmLabNode])) {
      throw new Error('PwmLabPlugin: PwmLabNode não registrado no editor')
    }
    return editor.registerCommand(
      INSERT_PWM_LAB_COMMAND,
      ({ fonte }) => {
        $insertNodes([$createPwmLabNode(fonte ?? PWM_LAB_EXEMPLO)])
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])
  return null
}
```

Depois:

- importar `PwmLabNode` e adicioná-lo ao fim de `LEXICAL_NODES`;
- importar e montar `<PwmLabPlugin />` em `OsWidgetPlugins`;
- importar `INSERT_PWM_LAB_COMMAND` e um ícone MUI já instalado no toolbar;
- criar `inserirPwmLab` com `editor.dispatchCommand(INSERT_PWM_LAB_COMMAND, {})`;
- adicionar um `IconButton` com tooltip "Inserir Laboratório PWM" na seção de
  widgets.

- [ ] **Step 5: rodar testes focados e a suíte completa**

Run:

```bash
cd openSilicioWebsite
npx vitest run src/components/lexical/nodes/PwmLabNode.test.tsx src/components/lexical/plugins/PwmLabPlugin.test.tsx
npm run test
npm run typecheck
npm run build
```

Expected: todos terminam com exit 0. `npm run lint` não entra no gate porque o
parser ESLint do projeto continua quebrado fora deste trabalho.

- [ ] **Step 6: registrar a integração do editor**

```bash
git add openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.tsx openSilicioWebsite/src/components/lexical/nodes/PwmLabNode.test.tsx openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.tsx openSilicioWebsite/src/components/lexical/plugins/PwmLabPlugin.test.tsx openSilicioWebsite/src/components/lexical/nodeSet.ts openSilicioWebsite/src/components/lexical/widgets.tsx openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx
git commit -m "feat(cursos): add PWM lab authoring"
```

## Tarefa 4: revisão, documentação e conteúdo piloto

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/course-authoring-improvements.md`
- Modify ignored source: `conteudo/cursos/projeto-digital/02-1-misturador-rgb.md`
- Regenerate ignored outputs: `conteudo/cursos/projeto-digital/02-1-misturador-rgb.html`, `conteudo/index.html`

**Interfaces:**
- Consumes: laboratório pronto, toolbar funcional e fonte padrão validada.
- Produces: documentação permanente e corpo da aula preparado para inserção.

- [ ] **Step 1: revisar o diff completo contra a especificação**

Run:

```bash
git diff 983118f...HEAD -- openSilicioWebsite/src
```

Conferir especificamente:

- nenhum `any`, fetch, axios, `localStorage` ou `sessionStorage` entrou;
- `PwmLabNode` está em `LEXICAL_NODES` e o plugin está em `OsWidgetPlugins`;
- o slider começa desabilitado e qualquer hipótese o habilita;
- o CSS não anima largura, sombra, filtro ou propriedades de layout;
- fonte vazia e parser inválido deixam o botão de edição disponível.

Corrigir achados reais com teste de regressão no arquivo que já pertence à
falha. Não criar suíte genérica de smoke tests.

- [ ] **Step 2: executar o gate final do frontend**

Run:

```bash
cd openSilicioWebsite
npm run test
npm run typecheck
npm run build
```

Expected: três comandos com exit 0.

- [ ] **Step 3: atualizar a documentação técnica**

Adicionar a `AGENTS.md`, na seção do editor Lexical:

```markdown
- **`PwmLabNode` (`os-pwm-lab`) mantém o experimento dentro da aula.** A fonte
  é JSON5 e carrega de modo assíncrono; uma mudança de fonte invalida a carga
  anterior. A interação do aluno é transitória, não toca em progresso nem
  `localStorage`. `data-os-pwm-lab` vazio ainda importa um nó para o autor poder
  corrigir a configuração no editor.
```

Registrar em `docs/course-authoring-improvements.md` somente o atrito que de
fato aparecer durante a inserção. Se o `window.prompt` for suficiente, registrar
ainda assim a oportunidade concreta de um painel de propriedades, com prioridade
baixa e o JSON5 como contorno atual.

- [ ] **Step 4: preparar a fonte da aula**

Em `conteudo/cursos/projeto-digital/02-1-misturador-rgb.md`, após o parágrafo que
define duty cycle e antes do código `out <= count < level;`, inserir:

```markdown
> **WIDGET.** Laboratório PWM: peça uma previsão sobre 25% e 75%, depois permita variar o duty cycle e comparar forma de onda, tempo em nível alto, tensão média e brilho percebido.
```

Manter o marcador de imagem do GTKWave. Ele documenta a simulação real, enquanto
o laboratório ensina o conceito.

Regenerar:

```bash
cd conteudo
node build.js
```

Expected: o build gera `02-1-misturador-rgb.html` e `index.html` sem erro. Avisos
de outros arquivos são aceitáveis somente se já existiam antes desta mudança.

- [ ] **Step 5: registrar documentação rastreada**

O diretório `conteudo/` é gitignored. Não usar `git add -f`.

```bash
git add AGENTS.md docs/course-authoring-improvements.md
git commit -m "docs(cursos): document PWM lab authoring"
```

## Tarefa 5: publicar a capacidade e inserir o rascunho real

**Files:**
- No tracked source changes expected after deploy.
- Production draft: aula `misturador-de-cores-rgb` in `https://opensilicio.com.br/admin/cursos`.

**Interfaces:**
- Consumes: commits verificados das tarefas 1 a 4 e sessão autenticada do admin.
- Produces: site com suporte ao widget e aula piloto salva como rascunho.

- [ ] **Step 1: atualizar a base antes do deploy**

Run:

```bash
git fetch origin
git rebase origin/main
```

Expected: rebase sem conflitos. Se houver conflito, parar o deploy e resolver
com o fluxo de conflito do projeto antes de continuar.

- [ ] **Step 2: repetir o gate na revisão exata que será enviada**

Run:

```bash
cd openSilicioWebsite
npm run test
npm run typecheck
npm run build
```

Expected: três comandos com exit 0 depois do rebase.

- [ ] **Step 3: enviar `main` e acompanhar o deploy**

Run:

```bash
git push origin main
```

Acompanhar `.github/workflows/deploy.yml` até terminar. Conferir no log que o
backup do banco tem tamanho compatível com os deploys recentes e que migração,
backend e frontend terminam sem erro. Não existe migração nesta entrega.

- [ ] **Step 4: verificar a capacidade publicada antes de editar conteúdo**

Abrir a área administrativa e uma aula de teste em modo de edição. Confirmar que
o tooltip "Inserir Laboratório PWM" aparece. Inserir o exemplo, conferir que a
bancada renderiza, testar uma hipótese, mover o slider, usar `editar`, cancelar
e remover. Não salvar a aula de teste.

- [ ] **Step 5: inserir o laboratório na aula RGB pelo editor real**

Abrir a aula `misturador-de-cores-rgb`. Encontrar a seção "Transforme um número
em intensidade com PWM" e inserir o widget depois do parágrafo que compara 25%
e 75%.

Editar a fonte para este conteúdo:

```js
{
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda quando o duty cycle passa de 25% para 75%?',
  alternativas: [
    {
      texto: 'A frequência triplica.',
      correta: false,
      explicacao: 'A frequência permanece igual. O que muda é a fração do período em nível alto.'
    },
    {
      texto: 'O LED parece mais brilhante.',
      correta: true,
      explicacao: 'O sinal passa mais tempo em nível alto e entrega mais energia média ao LED.'
    },
    {
      texto: 'A tensão alta passa de 3,3 V.',
      correta: false,
      explicacao: 'O nível lógico continua em 3,3 V. A largura do pulso é que aumenta.'
    }
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3
}
```

Salvar pelo botão real do formulário. Manter `Publicado` desligado.

- [ ] **Step 6: confirmar o estado armazenado**

Abrir a mesma aula em uma segunda aba do admin. Confirmar:

- o nó permanece na posição escolhida;
- o título, as três alternativas e as explicações estão corretos;
- 25% mostra período de 10 ms, tempo alto de 2,5 ms e tensão média de 0,83 V;
- 75% mostra tempo alto de 7,5 ms e tensão média de 2,48 V;
- teclado, tela estreita, modo claro, modo escuro e movimento reduzido funcionam;
- a aula continua em rascunho;
- a porcentagem do curso não mudou por causa do laboratório.

- [ ] **Step 7: conferir o site público e encerrar**

Abrir `https://opensilicio.com.br`, verificar uma aula já publicada e confirmar
que o leitor Lexical continua renderizando conteúdo sem widget. Como a aula RGB
está em rascunho, não tentar expor sua URL pública.

Registrar no relatório final o commit publicado, os três comandos do gate, o
resultado do deploy e o estado de rascunho da aula.
