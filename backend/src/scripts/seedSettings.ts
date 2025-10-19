import pool from '../config/database';

async function seedSettings() {
  try {
    console.log('⚙️  Inserindo configurações iniciais da página Sobre...');

    // Check if about settings already exist and have content
    const existingSettings = await pool.query(
      'SELECT * FROM site_settings WHERE key = $1',
      ['about_content']
    );

    if (existingSettings.rows.length > 0 && existingSettings.rows[0].value && existingSettings.rows[0].value !== '') {
      console.log('ℹ️  Configurações da página Sobre já existem com conteúdo, pulando seed...');
      process.exit(0);
    }

    console.log('📝 Inserindo/Atualizando configurações da página Sobre...');

    // Insert default about page settings
    const settingsToInsert = [
      {
        key: 'about_title',
        value: 'Sobre o OpenSilício'
      },
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
      },
      {
        key: 'about_team_members',
        value: '[]'
      }
    ];

    for (const setting of settingsToInsert) {
      await pool.query(`
        INSERT INTO site_settings (key, value, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW()
      `, [setting.key, setting.value]);
    }

    console.log('✅ Configurações iniciais da página Sobre inseridas com sucesso!');
    console.log(`   - about_title`);
    console.log(`   - about_content`);
    console.log(`   - about_mission`);
    console.log(`   - about_vision`);
    console.log(`   - about_history`);
    console.log(`   - about_team_members`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inserir configurações:', error);
    process.exit(1);
  }
}

seedSettings();

