import { useReducedMotion } from 'framer-motion'
import { useEffect, useId, useMemo, useState } from 'react'
import {
  calcularPwm,
  criarCaminhoPwm,
  type ConfiguracaoPwm,
} from '../utils/pwmLab'

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function PwmLab({ configuracao }: { configuracao: ConfiguracaoPwm }) {
  const perguntaId = useId()
  const movimentoReduzido = useReducedMotion() ?? false
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

  useEffect(() => {
    if (movimentoReduzido) setPulso(false)
  }, [movimentoReduzido])

  const mudarDuty = (novoDuty: number) => {
    setDuty(novoDuty)
    setPulso(false)
    if (movimentoReduzido) return
    requestAnimationFrame(() => setPulso(true))
  }

  return (
    <div className="os-pwm">
      <section className="os-pwm__previsao" aria-labelledby={perguntaId}>
        <p className="os-pwm__rotulo">Preveja antes de testar</p>
        <h3 id={perguntaId}>{configuracao.pergunta}</h3>
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
          <span>Duty cycle <output aria-hidden="true">{duty}%</output></span>
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
          {pulso && (
            <span
              className="os-pwm__led-pulso"
              data-pulso
              onAnimationEnd={() => setPulso(false)}
            />
          )}
        </span>
      </section>
    </div>
  )
}
