import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { DatabaseClient, Migration, MigrationFile } from '../core/types';

export class MigrationRunner {
  private db: DatabaseClient;
  private migrationsDir: string;

  constructor(db: DatabaseClient, migrationsDir: string = './migrations') {
    this.db = db;
    this.migrationsDir = migrationsDir;
  }

  // Initialize migrations table
  async init(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS _movejs_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Get applied migrations
  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query(
      'SELECT name FROM _movejs_migrations ORDER BY applied_at'
    );
    return result.map((r: any) => r.name);
  }

  // Get pending migrations
  async getPendingMigrations(): Promise<MigrationFile[]> {
    await this.init();
    const applied = await this.getAppliedMigrations();
    const files = await this.getMigrationFiles();

    return files.filter((f) => !applied.includes(f.name));
  }

  // Run all pending migrations
  async runAll(): Promise<void> {
    const pending = await this.getPendingMigrations();

    for (const migration of pending) {
      await this.run(migration.name);
    }
  }

  // Run a specific migration
  async run(name: string): Promise<void> {
    const filePath = join(this.migrationsDir, name);
    const migration = await import(filePath);

    console.log(`Running migration: ${name}`);

    await this.db.transaction(async (client) => {
      // Execute migration up
      await migration.up(client);

      // Record migration
      await client.execute(
        'INSERT INTO _movejs_migrations (name) VALUES ($1)',
        [name]
      );
    });

    console.log(`Completed migration: ${name}`);
  }

  // Rollback last migration
  async rollback(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = applied[applied.length - 1];
    await this.rollbackTo(lastMigration);
  }

  // Rollback to a specific migration
  async rollbackTo(name: string): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const index = applied.indexOf(name);

    if (index === -1) {
      throw new Error(`Migration ${name} not found in applied migrations`);
    }

    // Rollback in reverse order
    for (let i = applied.length - 1; i > index; i--) {
      await this.rollbackMigration(applied[i]);
    }
  }

  // Rollback a specific migration
  private async rollbackMigration(name: string): Promise<void> {
    const filePath = join(this.migrationsDir, name);
    const migration = await import(filePath);

    console.log(`Rolling back migration: ${name}`);

    await this.db.transaction(async (client) => {
      // Execute migration down
      await migration.down(client);

      // Remove migration record
      await client.execute(
        'DELETE FROM _movejs_migrations WHERE name = $1',
        [name]
      );
    });

    console.log(`Rolled back migration: ${name}`);
  }

  // Get migration files from directory
  private async getMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const files = await readdir(this.migrationsDir);
      return files
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
        .map((f) => ({
          name: f.replace(/\.(ts|js)$/, ''),
          timestamp: parseInt(f.split('_')[0]) || 0,
          applied: false
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch {
      return [];
    }
  }

  // Create a new migration file
  async create(name: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.ts`;
    const filePath = join(this.migrationsDir, filename);

    await mkdir(this.migrationsDir, { recursive: true });

    const content = `
import type { DatabaseClient } from '@movejs/data';

export async function up(db: DatabaseClient): Promise<void> {
  // Add your migration here
  // Example:
  // await db.execute(\`
  //   CREATE TABLE users (
  //     id SERIAL PRIMARY KEY,
  //     email VARCHAR(255) NOT NULL UNIQUE,
  //     name VARCHAR(255),
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //   )
  // \`);
}

export async function down(db: DatabaseClient): Promise<void> {
  // Add your rollback here
  // Example:
  // await db.execute('DROP TABLE IF EXISTS users');
}
`;

    await writeFile(filePath, content);
    return filePath;
  }
}

// Schema definition helpers
export function defineSchema(name: string, columns: Record<string, any>): string {
  const columnDefs = Object.entries(columns)
    .map(([name, config]) => {
      let def = `  ${name} ${getColumnType(config)}`;

      if (config.primary) def += ' PRIMARY KEY';
      if (config.autoIncrement) def += ' GENERATED ALWAYS AS IDENTITY';
      if (!config.nullable) def += ' NOT NULL';
      if (config.unique) def += ' UNIQUE';
      if (config.default !== undefined) def += ` DEFAULT ${config.default}`;

      return def;
    })
    .join(',\n');

  return `CREATE TABLE ${name} (\n${columnDefs}\n);`;
}

function getColumnType(config: any): string {
  switch (config.type) {
    case 'string':
      return `VARCHAR(${config.length || 255})`;
    case 'text':
      return 'TEXT';
    case 'integer':
      return 'INTEGER';
    case 'bigint':
      return 'BIGINT';
    case 'float':
      return 'REAL';
    case 'decimal':
      return `DECIMAL(${config.precision || 10}, ${config.scale || 2})`;
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'datetime':
    case 'timestamp':
      return 'TIMESTAMP';
    case 'json':
    case 'jsonb':
      return 'JSONB';
    case 'uuid':
      return 'UUID';
    default:
      return 'TEXT';
  }
}
