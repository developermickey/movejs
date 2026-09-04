// MoveJS Data ORM Types

export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'cockroachdb' | 'planetscale';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  url: string;
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
    idleTimeout?: number;
  };
  logging?: boolean;
  migrations?: {
    directory?: string;
  };
}

export interface ModelConfig {
  tableName: string;
  timestamps?: boolean;
  softDelete?: boolean;
  primaryKey?: string;
}

export interface ColumnConfig {
  type: ColumnType;
  primary?: boolean;
  default?: any;
  nullable?: boolean;
  unique?: boolean;
  indexed?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'cascade' | 'restrict' | 'set null';
  };
  length?: number;
  precision?: number;
  scale?: number;
}

export type ColumnType = 
  | 'string' 
  | 'text' 
  | 'integer' 
  | 'bigint' 
  | 'float' 
  | 'decimal' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'timestamp' 
  | 'json' 
  | 'jsonb' 
  | 'uuid' 
  | 'enum' 
  | 'array';

export interface QueryOptions {
  select?: string[] | Record<string, boolean | any>;
  where?: WhereClause;
  include?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  take?: number;
  skip?: number;
  cursor?: Record<string, any>;
  distinct?: string[];
  groupBy?: string[];
  having?: WhereClause;
}

export interface WhereClause {
  AND?: WhereClause[];
  OR?: WhereClause[];
  NOT?: WhereClause;
  [field: string]: any;
}

export interface FindManyOptions extends QueryOptions {
  page?: number;
  limit?: number;
}

export interface AggregateOptions {
  where?: WhereClause;
  groupBy?: string[];
  _count?: boolean | Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
}

export interface CreateOptions {
  data: Record<string, any>;
  include?: Record<string, any>;
}

export interface UpdateOptions {
  where: Record<string, any>;
  data: Record<string, any>;
  include?: Record<string, any>;
}

export interface DeleteOptions {
  where: Record<string, any>;
}

export interface UpsertOptions {
  where: Record<string, any>;
  create: Record<string, any>;
  update: Record<string, any>;
  include?: Record<string, any>;
}

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: 'read committed' | 'repeatable read' | 'serializable';
}

export interface Migration {
  name: string;
  up: (db: DatabaseClient) => Promise<void>;
  down: (db: DatabaseClient) => Promise<void>;
}

export interface MigrationFile {
  name: string;
  timestamp: number;
  applied: boolean;
}

export interface DatabaseClient {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<any>;
  transaction<T>(fn: (client: DatabaseClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
  close(): Promise<void>;
}

export interface Model<T = any> {
  findUnique(options: { where: Record<string, any>; include?: Record<string, any> }): Promise<T | null>;
  findFirst(options?: QueryOptions): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  create(options: CreateOptions): Promise<T>;
  createMany(options: { data: Record<string, any>[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
  update(options: UpdateOptions): Promise<T>;
  updateMany(options: { where: WhereClause; data: Record<string, any> }): Promise<{ count: number }>;
  upsert(options: UpsertOptions): Promise<T>;
  delete(options: DeleteOptions): Promise<T>;
  deleteMany(options: { where?: WhereClause }): Promise<{ count: number }>;
  count(options?: { where?: WhereClause }): Promise<number>;
  aggregate(options: AggregateOptions): Promise<any>;
  groupBy(options: {
    by: string[];
    where?: WhereClause;
    _count?: boolean | Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
  }): Promise<any[]>;
}
