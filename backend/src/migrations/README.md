# Database Migrations

This directory contains database migration files for the OpenSilício project.

## How It Works

- Migrations are SQL files numbered sequentially: `001_initial_schema.sql`, `002_add_feature.sql`, etc.
- The system tracks which migrations have been applied in the `migrations` table
- Migrations are applied in order and only once

## Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Or using ts-node directly
npx ts-node src/migrations/migrate.ts
```

## Creating a New Migration

1. Create a new SQL file with the next number: `00X_description.sql`
2. Write your SQL changes (CREATE TABLE, ALTER TABLE, etc.)
3. Run `npm run migrate` to apply it

## Migration File Naming Convention

Format: `XXX_description.sql`

Examples:
- `001_initial_schema.sql` - Initial database setup
- `002_add_user_roles.sql` - Add roles to users table
- `003_create_comments_table.sql` - Create comments feature

## Important Notes

- **Never modify existing migrations** that have been applied
- Migrations run inside transactions and rollback on error
- Always test migrations on a development database first
- Migrations are applied automatically on server startup in development
