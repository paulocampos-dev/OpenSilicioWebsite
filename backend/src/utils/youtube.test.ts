import { extrairIdDoYouTube } from './youtube';

describe('extrairIdDoYouTube', () => {
  const ID = 'dQw4w9WgXcQ';

  it('aceita as formas que o autor de fato cola', () => {
    expect(extrairIdDoYouTube(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(extrairIdDoYouTube(`https://youtu.be/${ID}`)).toBe(ID);
    expect(extrairIdDoYouTube(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(extrairIdDoYouTube(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(extrairIdDoYouTube(`https://www.youtube.com/live/${ID}`)).toBe(ID);
    expect(extrairIdDoYouTube(ID)).toBe(ID);
  });

  it('acha o id mesmo com os parâmetros que o botão Compartilhar pendura', () => {
    expect(extrairIdDoYouTube(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`)).toBe(ID);
    expect(extrairIdDoYouTube(`https://youtu.be/${ID}?si=xYz123`)).toBe(ID);
  });

  it('ignora espaço em volta', () => {
    expect(extrairIdDoYouTube(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it('recusa o que não é um vídeo do YouTube', () => {
    expect(extrairIdDoYouTube('https://vimeo.com/123456')).toBeNull();
    expect(extrairIdDoYouTube('https://www.youtube.com/watch?v=curto')).toBeNull();
    expect(extrairIdDoYouTube('só um texto qualquer')).toBeNull();
    expect(extrairIdDoYouTube('')).toBeNull();
    expect(extrairIdDoYouTube(null)).toBeNull();
    expect(extrairIdDoYouTube(undefined)).toBeNull();
  });

  it('não confunde o canal com o vídeo', () => {
    expect(extrairIdDoYouTube('https://www.youtube.com/@opensilicio')).toBeNull();
  });
});
