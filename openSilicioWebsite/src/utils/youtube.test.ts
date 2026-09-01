import { describe, it, expect } from 'vitest'
import { extrairIdDoYouTube } from './youtube'

/**
 * O par destes casos vive em `backend/src/utils/youtube.test.ts`. As duas
 * cópias do extrator precisam aceitar as mesmas formas: se o formulário
 * reconhecer menos que a API, ele recusa um endereço que o servidor gravaria.
 */
describe('extrairIdDoYouTube', () => {
  const ID = 'dQw4w9WgXcQ'

  it('aceita as formas que o autor de fato cola', () => {
    expect(extrairIdDoYouTube(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID)
    expect(extrairIdDoYouTube(`https://youtu.be/${ID}`)).toBe(ID)
    expect(extrairIdDoYouTube(`https://www.youtube.com/embed/${ID}`)).toBe(ID)
    expect(extrairIdDoYouTube(`https://www.youtube.com/shorts/${ID}`)).toBe(ID)
    expect(extrairIdDoYouTube(`https://www.youtube.com/live/${ID}`)).toBe(ID)
    expect(extrairIdDoYouTube(ID)).toBe(ID)
  })

  it('acha o id mesmo com os parâmetros que o botão Compartilhar pendura', () => {
    expect(extrairIdDoYouTube(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`)).toBe(ID)
    expect(extrairIdDoYouTube(`https://youtu.be/${ID}?si=xYz123`)).toBe(ID)
  })

  it('recusa o que não é um vídeo do YouTube', () => {
    expect(extrairIdDoYouTube('https://vimeo.com/123456')).toBeNull()
    expect(extrairIdDoYouTube('https://www.youtube.com/watch?v=curto')).toBeNull()
    expect(extrairIdDoYouTube('https://www.youtube.com/@opensilicio')).toBeNull()
    expect(extrairIdDoYouTube('')).toBeNull()
    expect(extrairIdDoYouTube(null)).toBeNull()
    expect(extrairIdDoYouTube(undefined)).toBeNull()
  })
})
