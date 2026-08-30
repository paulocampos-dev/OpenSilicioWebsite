import BlankSheet from '../components/design/BlankSheet'

export default function NotFound() {
  return (
    <BlankSheet
      kicker="404"
      title="Página não encontrada"
      body="O endereço que você acessou não existe ou foi movido."
      ctas={[{ label: 'Voltar para o início', to: '/' }]}
    />
  )
}
