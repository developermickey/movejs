import type { DatabaseConfig, DatabaseClient, TransactionOptions } from './types';

// Database Client Factory
export function createDatabaseClient(config: DatabaseConfig): DatabaseClient {
  switch (config.provider) {
    case 'postgresql':
      return new PostgresClient(config);
    case 'mysql':
      return new MySQLClient(config);
    case 'sqlite':
      return new SQLiteClient(config);
    case 'mongodb':
      return new MongoDBClient(config);
    default:
      throw new Error(`Unsupported database provider: ${config.provider}`);
  }
}

// Base Database Client
abstract class BaseClient implements DatabaseClient {
  protected config: DatabaseConfig;
  protected pool: any;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  abstract query(sql: string, params?: any[]): Promise<any>;
  abstract execute(sql: string, params?: any[]): Promise<any>;
  abstract close(): Promise<void>;

  async transaction<T>(
    fn: (client: DatabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    throw new Error('transaction() must be implemented by subclass');
  }
}

// PostgreSQL Client
class PostgresClient extends BaseClient {
  private client: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  private async getClient(): Promise<any> {
    if (!this.client) {
      // Dynamic import for pg
      const pg = await import('pg');
      this.client = new pg.Client({
        connectionString: this.config.url,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false
      });
      await this.client.connect();
    }
    return this.client;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    const result = await client.query(sql, params);
    return result.rows;
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    const result = await client.query(sql, params);
    return { rowCount: result.rowCount, rows: result.rows };
  }

  async transaction<T>(
    fn: (client: DatabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const client = await this.getClient();
    await client.query('BEGIN');
    try {
      const result = await fn(this);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}

// MySQL Client
class MySQLClient extends BaseClient {
  private client: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  private async getClient(): Promise<any> {
    if (!this.client) {
      const mysql = await import('mysql2/promise');
      this.client = await mysql.createConnection(this.config.url);
    }
    return this.client;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    const [rows] = await client.execute(sql, params);
    return rows;
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    const [result] = await client.execute(sql, params);
    return { rowCount: result.affectedRows, rows: [] };
  }

  async transaction<T>(
    fn: (client: DatabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const client = await this.getClient();
    await client.beginTransaction();
    try {
      const result = await fn(this);
      await client.commit();
      return result;
    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}

// SQLite Client
class SQLiteClient extends BaseClient {
  private db: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  private async getDb(): Promise<any> {
    if (!this.db) {
      const sqlite3 = await import('better-sqlite3');
      this.db = new sqlite3.default(this.config.url);
    }
    return this.db;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const db = await this.getDb();
    return db.prepare(sql).all(params || []);
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    const db = await this.getDb();
    const result = db.prepare(sql).run(params || []);
    return { rowCount: result.changes, rows: [] };
  }

  async transaction<T>(
    fn: (client: DatabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const db = await this.getDb();
    const transaction = db.transaction(() => fn(this));
    return transaction();
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// MongoDB Client
class MongoDBClient extends BaseClient {
  private client: any;
  private db: any;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  private async getClient(): Promise<any> {
    if (!this.client) {
      const { MongoClient } = await import('mongodb');
      this.client = new MongoClient(this.config.url);
      await this.client.connect();
      this.db = this.client.db();
    }
    return this.db;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    // MongoDB doesn't use SQL, this is a simplified adapter
    throw new Error('MongoDB uses different query syntax');
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    throw new Error('MongoDB uses different query syntax');
  }

  async transaction<T>(
    fn: (client: DatabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    // MongoDB transactions
    const session = this.client.startSession();
    try {
      await session.startTransaction();
      const result = await fn(this);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}
