import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Box, Stack, Typography } from '@mui/material'
import { wikiApi } from '../services/api'
import type { AparicaoDeVerbete, WikiEntry } from '../types'
import BlueprintFrame from '../components/design/BlueprintFrame'
import LexicalContent from '../components/LexicalContent'
import CoverLetterDisplay from '../components/CoverLetterDisplay'
import BlankSheet from '../components/design/BlankSheet'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'

export default function WikiDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [entry, setEntry] = useState<WikiEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [pendingTerm, setPendingTerm] = useState('')
  const [aparicoes, setAparicoes] = useState<AparicaoDeVerbete[]>([])

  useEffect(() => {
    if (slug) {
      loadEntry()
    }
  }, [slug])

  const loadEntry = async () => {
    try {
      if (slug?.startsWith('pending-')) {
        setIsPending(true)
        setPendingTerm(slug.replace('pending-', '').replace(/-/g, ' '))
      } else {
        const data = await wikiApi.getBySlug(slug!)
        setEntry(data)
        // Acessório: sem a lista de aparições o verbete continua completo.
        wikiApi.getAparicoes(slug!).then(setAparicoes).catch(() => {})
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar entrada:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DetailPageSkeleton withHeroImage={false} />
  }

  if (isPending) {
    return (
      <RevealOnLoad>
      <Stack spacing={3}>
        <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          <RouterLink to="/wiki">Wiki</RouterLink> / {pendingTerm}
        </Typography>
        <BlankSheet
          title={pendingTerm}
          body="Esta entrada ainda não foi criada. Estamos trabalhando para adicionar mais conteúdo à nossa wiki."
          ctas={[
            { label: 'Ver todas as entradas', to: '/wiki' },
            { label: 'Ver a Educação', to: '/educacao', variant: 'secondary' },
          ]}
        />
      </Stack>
      </RevealOnLoad>
    )
  }

  if (!entry) {
    return (
      <RevealOnLoad>
        <BlankSheet
          title="Entrada não encontrada"
          body="O termo que você procura não existe na wiki."
          ctas={[{ label: 'Voltar para a Wiki', to: '/wiki' }]}
        />
      </RevealOnLoad>
    )
  }

  return (
    <RevealOnLoad>
    <Stack spacing={4}>
      <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        <RouterLink to="/wiki">Wiki</RouterLink> / {entry.term}
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: '62ch' }}>
        <Typography component="h1" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '36px', md: '48px' }, lineHeight: { xs: '38px', md: '50px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)' }}>
          {entry.term}
        </Typography>
        <Typography sx={{ fontSize: '18px', lineHeight: '28px', color: 'var(--color-text-muted)' }}>{entry.definition}</Typography>
        <CoverLetterDisplay text={entry.cover_letter} variant="quote" />

        {entry.aliases && entry.aliases.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Também conhecido como:</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {entry.aliases.map((alias) => (
                <span key={alias} className="tag tag-outline">{alias}</span>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>

      <Box className="caption-rule" />

      {entry.content && (
        <Box sx={{ border: '1px solid var(--color-line)', p: { xs: 3, md: 5 } }}>
          <LexicalContent content={entry.content} />
        </Box>
      )}

      {aparicoes.length > 0 && (
        <BlueprintFrame sx={{ p: 2.5, maxWidth: '62ch' }}>
          <span className="kicker">Onde aparece</span>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {aparicoes.map((aparicao) => (
              <Typography key={`${aparicao.content_type}-${aparicao.content_id}`} sx={{ fontSize: 15, lineHeight: '22px' }}>
                <RouterLink to={aparicao.href}>{aparicao.titulo}</RouterLink>
                {aparicao.contexto && (
                  <span style={{ color: 'var(--color-text-faint)' }}> · {aparicao.contexto}</span>
                )}
              </Typography>
            ))}
          </Stack>
        </BlueprintFrame>
      )}
    </Stack>
    </RevealOnLoad>
  )
}
