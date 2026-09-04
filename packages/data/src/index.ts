// MoveJS Data - Database management, ORM, migrations and query builder
export { createDatabaseClient } from './core/client';
export { ORM, createORM, createDatabase } from './core/orm';
export { QueryBuilder } from './query/builder';
export { MigrationRunner } from './migrations/runner';

export type {
  DatabaseProvider,
  DatabaseConfig,
  ModelConfig,
  ColumnConfig,
  ColumnType,
  QueryOptions,
  WhereClause,
  FindManyOptions,
  AggregateOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  UpsertOptions,
  TransactionOptions,
  Migration,
  MigrationFile,
  DatabaseClient,
  Model
} from './core/types';
export type { Schema, SchemaField } from './core/orm';