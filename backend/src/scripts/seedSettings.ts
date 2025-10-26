import pool from '../config/database';

// Helper functions to create Lexical format nodes

function createTextNode(text: string, format = 0): any {
  return {
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  };
}

function createParagraphNode(text: string): any {
  return {
    children: [createTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  };
}

function createLexicalDocument(nodes: any[]): string {
  return JSON.stringify({
    root: {
      children: nodes,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

async function seedSettings() {
  try {
    console.log('⚙️  Verificando configurações da página Sobre...');

    // Check if about settings already exist
    const existingSettings = await pool.query(
      'SELECT * FROM site_settings WHERE key = $1',
      ['about_content']
    );

    if (existingSettings.rows.length > 0) {
      console.log('ℹ️  Configurações da página Sobre já existem, pulando seed...');
      console.log('💡 Dica: As configurações são gerenciadas automaticamente pelas migrações.');
      console.log('    Se precisar resetar, execute a migração 006 novamente.');
      process.exit(0);
    }

    console.log('📝 Inserindo configurações iniciais da página Sobre...');

    // Insert default about page settings
    const settingsToInsert = [
      {
        key: 'about_title',
        value: 'Sobre o OpenSilício'
      },
      {
        key: 'about_content',
        value: createLexicalDocument([
          createParagraphNode('O OpenSilício é uma iniciativa dedicada a democratizar o conhecimento em eletrônica e projeto de circuitos integrados. Nossa missão é fornecer recursos educacionais de qualidade e fomentar uma comunidade ativa de aprendizado.')
        ])
      },
      {
        key: 'about_mission',
        value: createLexicalDocument([
          createParagraphNode('Democratizar o acesso ao conhecimento em eletrônica e projeto de circuitos integrados, capacitando estudantes e profissionais através de recursos educacionais de alta qualidade.')
        ])
      },
      {
        key: 'about_vision',
        value: createLexicalDocument([
          createParagraphNode('Ser referência no ensino de eletrônica e design de circuitos integrados, criando uma comunidade global de inovadores e desenvolvedores.')
        ])
      },
      {
        key: 'about_history',
        value: createLexicalDocument([
          createParagraphNode('O OpenSilício nasceu da paixão de estudantes e professores pela área de eletrônica e circuitos integrados. Com o objetivo de facilitar o aprendizado e compartilhar conhecimento, criamos esta plataforma para reunir recursos, tutoriais e projetos práticos.')
        ])
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

