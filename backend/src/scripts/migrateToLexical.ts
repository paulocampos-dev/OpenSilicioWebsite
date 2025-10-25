import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simple BlockNote to Lexical converter
function convertBlockNoteToLexical(blockNoteContent: string): string {
  try {
    const parsed = JSON.parse(blockNoteContent);

    // If it's already Lexical format (has root), return as-is
    if (parsed.root) {
      console.log('  Already in Lexical format, skipping...');
      return blockNoteContent;
    }

    // If it's not an array, it's invalid
    if (!Array.isArray(parsed)) {
      console.log('  Invalid format, creating empty Lexical document...');
      return createEmptyLexicalDocument();
    }

    // Convert BlockNote blocks to Lexical nodes
    const lexicalChildren: any[] = [];

    for (const block of parsed) {
      const lexicalNode = convertBlockNoteBlock(block);
      if (lexicalNode) {
        lexicalChildren.push(lexicalNode);
      }
    }

    // Create Lexical document structure
    const lexicalDoc = {
      root: {
        children: lexicalChildren,
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };

    return JSON.stringify(lexicalDoc);
  } catch (error) {
    console.error('  Error converting content:', error);
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

    case 'bulletListItem':
    case 'numberedListItem':
      // Lexical uses ListNode and ListItemNode
      return {
        children: [
          {
            children: convertInlineContent(content),
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            version: 1,
            value: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'list',
        version: 1,
        listType: type === 'numberedListItem' ? 'number' : 'bullet',
        start: 1,
        tag: type === 'numberedListItem' ? 'ol' : 'ul',
      };

    default:
      // For unknown types, convert to paragraph
      console.log(`  Unknown block type: ${type}, converting to paragraph`);
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

      // Apply styles
      if (item.styles) {
        let format = 0;
        if (item.styles.bold) format |= 1; // Bold
        if (item.styles.italic) format |= 2; // Italic
        if (item.styles.underline) format |= 8; // Underline
        if (item.styles.strikethrough) format |= 4; // Strikethrough
        if (item.styles.code) format |= 16; // Code
        textNode.format = format;
      }

      result.push(textNode);
    } else if (item.type === 'link') {
      // Create a link node
      const linkNode = {
        children: convertInlineContent(item.content || []),
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'link',
        version: 1,
        rel: null,
        target: null,
        title: null,
        url: item.href || '',
      };
      result.push(linkNode);
    }
  }

  return result;
}

async function migrateTable(tableName: string, contentColumn: string) {
  console.log(`\n📋 Migrating ${tableName}...`);

  try {
    // Fetch all rows
    const result = await pool.query(`SELECT id, ${contentColumn} FROM ${tableName}`);
    console.log(`  Found ${result.rows.length} rows`);

    let migrated = 0;
    let skipped = 0;

    for (const row of result.rows) {
      const id = row.id;
      const oldContent = row[contentColumn];

      if (!oldContent) {
        console.log(`  Row ${id}: No content, skipping...`);
        skipped++;
        continue;
      }

      console.log(`  Row ${id}: Converting...`);
      const newContent = convertBlockNoteToLexical(oldContent);

      if (newContent !== oldContent) {
        await pool.query(
          `UPDATE ${tableName} SET ${contentColumn} = $1 WHERE id = $2`,
          [newContent, id]
        );
        console.log(`  Row ${id}: ✅ Migrated`);
        migrated++;
      } else {
        console.log(`  Row ${id}: Already in Lexical format, skipped`);
        skipped++;
      }
    }

    console.log(`\n✅ ${tableName}: ${migrated} migrated, ${skipped} skipped`);
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting BlockNote to Lexical migration...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Migrate each table
    await migrateTable('blog_posts', 'content');
    await migrateTable('education_resources', 'content');
    await migrateTable('wiki_entries', 'definition');
    await migrateTable('site_settings', 'about_content');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
