import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function convertBlockNoteToLexical(blockNoteContent: string): string {
  try {
    const parsed = JSON.parse(blockNoteContent);

    if (parsed.root) {
      console.log('  Already in Lexical format');
      return blockNoteContent;
    }

    if (!Array.isArray(parsed)) {
      console.log('  Invalid format, creating empty document');
      return createEmptyLexicalDocument();
    }

    const lexicalChildren: any[] = [];

    for (const block of parsed) {
      const lexicalNode = convertBlockNoteBlock(block);
      if (lexicalNode) {
        lexicalChildren.push(lexicalNode);
      }
    }

    return JSON.stringify({
      root: {
        children: lexicalChildren,
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });
  } catch (error) {
    console.error('  Error converting:', error);
    return createEmptyLexicalDocument();
  }
}

function createEmptyLexicalDocument(): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

function convertBlockNoteBlock(block: any): any {
  const type = block.type;
  const content = block.content || [];

  switch (type) {
    case 'heading':
      const level = block.props?.level || 1;
      return {
        children: convertInlineContent(content),
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: `h${level}`,
      };

    case 'paragraph':
      return {
        children: convertInlineContent(content),
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      };

    default:
      return {
        children: convertInlineContent(content),
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      };
  }
}

function convertInlineContent(content: any[]): any[] {
  if (!Array.isArray(content)) {
    return [];
  }

  const result: any[] = [];

  for (const item of content) {
    if (item.type === 'text') {
      const textNode: any = {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: item.text || '',
        type: 'text',
        version: 1,
      };

      if (item.styles) {
        let format = 0;
        if (item.styles.bold) format |= 1;
        if (item.styles.italic) format |= 2;
        if (item.styles.underline) format |= 8;
        if (item.styles.strikethrough) format |= 4;
        if (item.styles.code) format |= 16;
        textNode.format = format;
      }

      result.push(textNode);
    }
  }

  return result;
}

async function migrateSiteSettings() {
  console.log('\n📋 Migrating site_settings...');

  const keysToMigrate = ['about_content', 'about_mission', 'about_vision', 'about_history'];

  for (const key of keysToMigrate) {
    try {
      const result = await pool.query('SELECT value FROM site_settings WHERE key = $1', [key]);

      if (result.rows.length === 0) {
        console.log(`  ${key}: Not found, skipping...`);
        continue;
      }

      const oldValue = result.rows[0].value;
      console.log(`  ${key}: Converting...`);

      const newValue = convertBlockNoteToLexical(oldValue);

      if (newValue !== oldValue) {
        await pool.query('UPDATE site_settings SET value = $1 WHERE key = $2', [newValue, key]);
        console.log(`  ${key}: ✅ Migrated`);
      } else {
        console.log(`  ${key}: Already in Lexical format`);
      }
    } catch (error) {
      console.error(`  ${key}: ❌ Error -`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting site_settings migration...\n');

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    await migrateSiteSettings();

    console.log('\n✅ Site settings migration completed!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
