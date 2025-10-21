import pool from '../config/database';

/**
 * Fix script to convert HTML about settings to BlockNote JSON format
 * This script can be run manually to fix databases that have HTML content
 * instead of BlockNote JSON in about settings.
 */
async function fixAboutSettings() {
  try {
    console.log('🔧 Fixing about settings - converting HTML to BlockNote JSON...');

    const settingsToFix = [
      {
        key: 'about_content',
        value: JSON.stringify([{
          "id":"1",
          "type":"paragraph",
          "props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},
          "content":[{"type":"text","text":"O OpenSilício é uma iniciativa dedicada a democratizar o conhecimento em eletrônica e projeto de circuitos integrados. Nossa missão é fornecer recursos educacionais de qualidade e fomentar uma comunidade ativa de aprendizado.","styles":{}}],
          "children":[]
        }])
      },
      {
        key: 'about_mission',
        value: JSON.stringify([{
          "id":"1",
          "type":"paragraph",
          "props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},
          "content":[{"type":"text","text":"Democratizar o acesso ao conhecimento em eletrônica e projeto de circuitos integrados, capacitando estudantes e profissionais através de recursos educacionais de alta qualidade.","styles":{}}],
          "children":[]
        }])
      },
      {
        key: 'about_vision',
        value: JSON.stringify([{
          "id":"1",
          "type":"paragraph",
          "props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},
          "content":[{"type":"text","text":"Ser referência no ensino de eletrônica e design de circuitos integrados, criando uma comunidade global de inovadores e desenvolvedores.","styles":{}}],
          "children":[]
        }])
      },
      {
        key: 'about_history',
        value: JSON.stringify([{
          "id":"1",
          "type":"paragraph",
          "props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},
          "content":[{"type":"text","text":"O OpenSilício nasceu da paixão de estudantes e professores pela área de eletrônica e circuitos integrados. Com o objetivo de facilitar o aprendizado e compartilhar conhecimento, criamos esta plataforma para reunir recursos, tutoriais e projetos práticos.","styles":{}}],
          "children":[]
        }])
      }
    ];

    let fixedCount = 0;
    let skippedCount = 0;

    for (const setting of settingsToFix) {
      // Check if setting exists and if it's HTML
      const result = await pool.query(
        'SELECT value FROM site_settings WHERE key = $1',
        [setting.key]
      );

      if (result.rows.length === 0) {
        console.log(`   ⚠️  ${setting.key}: não encontrado, pulando...`);
        skippedCount++;
        continue;
      }

      const currentValue = result.rows[0].value;

      // Check if it's HTML (starts with '<') or empty
      if (!currentValue || currentValue === '' || currentValue.trim().startsWith('<')) {
        await pool.query(
          'UPDATE site_settings SET value = $1, updated_at = NOW() WHERE key = $2',
          [setting.value, setting.key]
        );
        console.log(`   ✅ ${setting.key}: convertido para BlockNote JSON`);
        fixedCount++;
      } else if (currentValue.trim().startsWith('[')) {
        console.log(`   ℹ️  ${setting.key}: já está em formato BlockNote JSON, pulando...`);
        skippedCount++;
      } else {
        console.log(`   ⚠️  ${setting.key}: formato desconhecido, pulando...`);
        skippedCount++;
      }
    }

    console.log('\n✅ Correção concluída!');
    console.log(`   📊 Estatísticas:`);
    console.log(`      - Corrigidos: ${fixedCount}`);
    console.log(`      - Pulados: ${skippedCount}`);

    if (fixedCount > 0) {
      console.log('\n💡 As configurações foram atualizadas. Recarregue a página About no frontend.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir configurações:', error);
    process.exit(1);
  }
}

fixAboutSettings();
