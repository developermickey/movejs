import type {
  DatabaseClient,
  DatabaseConfig,
  Model,
  ModelConfig,
  FindManyOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  UpsertOptions,
  QueryOptions,
  WhereClause
} from './types';
import { QueryBuilder } from '../query/builder';

// Schema definition
export interface SchemaField {
  type: 'string' | 'int' | 'integer' | 'text' | 'boolean' | 'float' | 'decimal' | 'datetime' | 'date' | 'json' | 'uuid' | 'enum' | 'array';
  primary?: boolean;
  unique?: boolean;
  default?: any;
  optional?: boolean;
  relations?: Record<string, string | boolean>;
  enumValues?: string[];
}

export interface Schema {
  [model: string]: Record<string, SchemaField>;
}

// MoveJS ORM - wraps DatabaseClient and QueryBuilder with a type-safe model API
export class ORM {
  private client: DatabaseClient;
  private schema: Schema = {};
  private models = new Map<string, Model>();

  constructor(client: DatabaseClient, schema?: Schema) {
    this.client = client;
    if (schema) {
      this.schema = schema;
    }
  }

  // Define or augment the schema
  defineSchema(schema: Schema): this {
    this.schema = { ...this.schema, ...schema };
    return this;
  }

  // Get a model by name (or define inline if not present)
  get<T = any>(name: string): Model<T> {
    const key = this.normalizeModel(name);
    if (this.models.has(key)) {
      return this.models.get(key) as Model<T>;
    }
    const model = this.createModel(key);
    this.models.set(key, model);
    return model as Model<T>;
  }

  private normalizeModel(name: string): string {
    // Convert PascalCase or model name to snake_case table name
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  private createModel<T>(table: string): Model<T> {
    const client = this.client;
    const orm = this;

    const model = {
      async findUnique(options: { where: Record<string, any>; include?: Record<string, any> }) {
        const rows = await orm.execQuery({ table, where: options.where, take: 1 });
        return (rows[0] ?? null) as T | null;
      },

      async findFirst(options?: QueryOptions) {
        const opt = { ...options, take: 1 };
        const rows = await orm.execQuery({ table, ...opt });
        return (rows[0] ?? null) as T | null;
      },

      async findMany(options?: FindManyOptions) {
        return (await orm.execQuery({ table, ...(options || {}) })) as T[];
      },

      async create(options: CreateOptions) {
        return (await orm.execMutation('query', table, options.data)) as T;
      },

      async createMany(options: { data: Record<string, any>[]; skipDuplicates?: boolean }) {
        for (const row of options.data) {
          await orm.execMutation('query', table, row);
        }
        return { count: options.data.length };
      },

      async update(options: UpdateOptions) {
        await orm.execMutation('execute', table, options.data, options.where);
        const rows = await orm.execQuery({ table, where: options.where, take: 1 });
        return rows[0] as T;
      },

      async updateMany(options: { where: WhereClause; data: Record<string, any> }) {
        const result = await orm.execMutation('execute', table, options.data, options.where);
        return { count: result.rowCount ?? 0 };
      },

      async upsert(options: UpsertOptions) {
        const existing = await orm.execQuery({ table, where: options.where, take: 1 });
        if (existing[0]) {
          await orm.execMutation('execute', table, options.update, options.where);
          return (await orm.execQuery({ table, where: options.where, take: 1 }))[0] as T;
        }
        return (await orm.execMutation('query', table, options.create)) as T;
      },

      async delete(options: DeleteOptions) {
        const rows = await orm.execQuery({ table, where: options.where, take: 1 });
        await orm.execMutation('delete', table, {}, options.where);
        return rows[0] as T;
      },

      async deleteMany(options: { where?: WhereClause }) {
        const result = await orm.execMutation('delete', table, {}, options.where || {});
        return { count: result.rowCount ?? result.affectedRows ?? 0 };
      },

      async count(options?: { where?: WhereClause }) {
        const rows = await orm.execQuery({ table, where: options?.where || {} });
        return rows.length;
      },

      async aggregate(options: any) {
        return await orm.execAggregate({ table, ...options });
      },

      async groupBy(options: any) {
        return await orm.execGroupBy({ table, ...options });
      }
    };

    return model as Model<T>;
  }

  // Query execution helpers
  private async execQuery(opts: { table: string; where?: WhereClause; take?: number; skip?: number; orderBy?: any; select?: any }): Promise<any[]> {
    const qb = new QueryBuilder(opts.table);
    const { select, where, orderBy, take, skip } = opts;

    if (select) {
      const cols = Array.isArray(select) ? select : Object.keys(select);
      qb.select(...cols);
    }

    if (where && Object.keys(where).length) {
      qb.where(where);
    }

    if (orderBy) {
      const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
      for (const e of entries) {
        for (const [col, dir] of Object.entries(e)) {
          qb.orderBy(col, (dir as any) === 'desc' ? 'desc' : 'asc');
        }
      }
    }

    if (take !== undefined) qb.limit(take);
    if (skip !== undefined) qb.offset(skip);

    const { sql, params } = qb.toSQL();
    return await this.client.query(sql, params);
  }

  private async execMutation(
    op: 'query' | 'execute' | 'delete' | 'insert',
    table: string,
    data: Record<string, any>,
    where?: WhereClause
  ): Promise<{ rowCount?: number; affectedRows?: number; rows?: any[]; returning?: any[] }> {
    if (op === 'delete') {
      const builder = new QueryBuilder(table);
      if (where && Object.keys(where).length) {
        builder.where(where);
      }
      const sql = `DELETE FROM ${table} WHERE ${this.buildDeleteWhere(where)}`;
      const { params } = builder['toSQL']();
      const result = await this.client.execute(sql, params);
      return { rowCount: result?.rowCount, affectedRows: result?.affectedRows, rows: result?.rows };
    }

    // INSERT
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const insertSql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.client.query(insertSql, values);
    if (op === 'query') {
      return { rows: result, returning: result };
    }
    return { rowCount: result?.length, rows: result };
  }

  private buildDeleteWhere(where?: WhereClause): string {
    if (!where || Object.keys(where).length === 0) return 'TRUE';
    const qb = new QueryBuilder('dummy');
    const builder = qb as any;
    // Reuse the WHERE builder logic from QueryBuilder
    const params: any[] = [];
    const sql = this.buildWhereString(where, params);
    return sql;
  }

  private buildWhereString(clause: WhereClause, params: any[]): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(clause)) {
      if (key === 'AND' && Array.isArray(value)) {
        parts.push(`(${value.map((v) => this.buildWhereString(v, params)).join(' AND ')})`);
      } else if (key === 'OR' && Array.isArray(value)) {
        parts.push(`(${value.map((v) => this.buildWhereString(v, params)).join(' OR ')})`);
      } else if (key === 'NOT' && typeof value === 'object' && value) {
        parts.push(`NOT (${this.buildWhereString(value, params)})`);
      } else if (typeof value === 'object' && value !== null) {
        for (const [op, val] of Object.entries(value)) {
          parts.push(this.buildOp(key, op, val, params));
        }
      } else {
        params.push(value);
        parts.push(`${key} = $${params.length}`);
      }
    }
    return parts.join(' AND ');
  }

  private buildOp(field: string, operator: string, value: any, params: any[]): string {
    switch (operator) {
      case 'eq': params.push(value); return `${field} = $${params.length}`;
      case 'ne': params.push(value); return `${field} != $${params.length}`;
      case 'gt': params.push(value); return `${field} > $${params.length}`;
      case 'gte': params.push(value); return `${field} >= $${params.length}`;
      case 'lt': params.push(value); return `${field} < $${params.length}`;
      case 'lte': params.push(value); return `${field} <= $${params.length}`;
      case 'in':
        const ph = value.map((v: any) => { params.push(v); return `$${params.length}`; });
        return `${field} IN (${ph.join(', ')})`;
      case 'contains': params.push(`%${value}%`); return `${field} LIKE $${params.length}`;
      case 'isNull': return `${field} IS NULL`;
      case 'isNotNull': return `${field} IS NOT NULL`;
      default: params.push(value); return `${field} = $${params.length}`;
    }
  }

  private async execAggregate(opts: any): Promise<any> {
    const qb = new QueryBuilder(opts.table);
    const { where, _count, _sum, _avg, _min, _max } = opts;
    let sql = `SELECT `;
    const selects: string[] = [];
    const params: any[] = [];

    if (_count) {
      const cols = typeof _count === 'object' ? Object.keys(_count) : ['*'];
      selects.push(`COUNT(${cols.join(', ')}) as _count`);
    }
    if (_sum) {
      Object.entries(_sum).forEach(([c, enabled]) => {
        if (enabled) selects.push(`SUM(${c}) as _sum_${c}`);
      });
    }
    if (_avg) {
      Object.entries(_avg).forEach(([c, enabled]) => {
        if (enabled) selects.push(`AVG(${c}) as _avg_${c}`);
      });
    }
    if (_min) {
      Object.entries(_min).forEach(([c, enabled]) => {
        if (enabled) selects.push(`MIN(${c}) as _min_${c}`);
      });
    }
    if (_max) {
      Object.entries(_max).forEach(([c, enabled]) => {
        if (enabled) selects.push(`MAX(${c}) as _max_${c}`);
      });
    }
    if (selects.length === 0) selects.push('COUNT(*) as _count');

    sql += selects.join(', ');
    sql += ` FROM ${opts.table}`;

    if (where && Object.keys(where).length) {
      sql += ` WHERE ${this.buildWhereString(where, params)}`;
    }

    const result = await this.client.query(sql, params);
    return result[0] || {};
  }

  private async execGroupBy(opts: any): Promise<any[]> {
    const { by, where, _count, _sum, _avg } = opts;
    const params: any[] = [];
    const selects = by.map((c: string) => `${c}`);
    if (_count) selects.push('COUNT(*) as _count');
    if (_sum) Object.entries(_sum).forEach(([c, en]: any) => { if (en) selects.push(`SUM(${c}) as _sum_${c}`); });
    if (_avg) Object.entries(_avg).forEach(([c, en]: any) => { if (en) selects.push(`AVG(${c}) as _avg_${c}`); });

    let sql = `SELECT ${selects.join(', ')} FROM ${opts.table}`;
    if (where && Object.keys(where).length) {
      sql += ` WHERE ${this.buildWhereString(where, params)}`;
    }
    sql += ` GROUP BY ${by.join(', ')}`;

    return await this.client.query(sql, params);
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

// High-level `db` singleton creation from config + schema
export async function createDatabase(
  config: DatabaseConfig,
  schema?: Schema
): Promise<ORM & { [model: string]: any }> {
  return createORM(config, schema);
}

export async function createORM(
  config: DatabaseConfig,
  schema?: Schema
): Promise<ORM & { [model: string]: any }> {
  // Lazy client creation to avoid importing driver at module load
  const { createDatabaseClient } = await import('./client');
  const client = createDatabaseClient(config);
  const orm = new ORM(client, schema);
  const proxied = orm as ORM & { [model: string]: any; __orm: ORM };

  // Proxy to expose models as properties: db.user.findMany()
  proxied.__orm = orm;
  return new Proxy(proxied, {
    get(target, prop) {
      if (typeof prop === 'symbol') return (target as any)[prop];
      if (prop in target) return (target as any)[prop];
      return orm.get(String(prop));
    }
  }) as any;
}