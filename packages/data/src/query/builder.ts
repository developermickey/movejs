import type { WhereClause, FindManyOptions } from '../core/types';

export class QueryBuilder {
  private table: string;
  private operation: string = 'SELECT';
  private columns: string[] = ['*'];
  private conditions: WhereClause = {};
  private joins: Array<{ table: string; on: string; type: string }> = [];
  private orderByClause: Array<{ column: string; direction: 'asc' | 'desc' }> = [];
  private groupByClause: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private params: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(...columns: string[]): this {
    this.columns = columns.length ? columns : ['*'];
    return this;
  }

  where(field: string, operator: string, value: any): this;
  where(field: string, value: any): this;
  where(clause: WhereClause): this;
  where(fieldOrClause: string | WhereClause, operator?: string, value?: any): this {
    if (typeof fieldOrClause === 'object') {
      this.conditions = { ...this.conditions, ...fieldOrClause };
    } else if (typeof operator === 'object') {
      // Operator-object form: where('name', { contains: 'a' })
      this.conditions[fieldOrClause] = operator;
    } else if (typeof operator === 'string' && value !== undefined && isKnownOperator(operator)) {
      // Operator form: where('age', 'gt', 30)
      this.conditions[fieldOrClause] = { [operator]: value };
    } else {
      // Equality form: where('id', 1)
      this.conditions[fieldOrClause] = operator;
    }
    return this;
  }

  orWhere(field: string, operator: string, value: any): this {
    if (!this.conditions.OR) {
      this.conditions.OR = [];
    }
    this.conditions.OR.push({ [field]: { [operator]: value } });
    return this;
  }

  join(table: string, on: string, type: string = 'INNER'): this {
    this.joins.push({ table, on, type });
    return this;
  }

  leftJoin(table: string, on: string): this {
    return this.join(table, on, 'LEFT');
  }

  rightJoin(table: string, on: string): this {
    return this.join(table, on, 'RIGHT');
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByClause.push({ column, direction });
    return this;
  }

  groupBy(...columns: string[]): this {
    this.groupByClause.push(...columns);
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  page(page: number, limit: number): this {
    this.limitValue = limit;
    this.offsetValue = (page - 1) * limit;
    return this;
  }

  toSQL(): { sql: string; params: any[] } {
    const parts: string[] = [];
    const params: any[] = [];

    // SELECT
    parts.push(`${this.operation} ${this.columns.join(', ')}`);

    // FROM
    parts.push(`FROM ${this.table}`);

    // JOINs
    for (const join of this.joins) {
      parts.push(`${join.type} JOIN ${join.table} ON ${join.on}`);
    }

    // WHERE
    if (Object.keys(this.conditions).length > 0) {
      const whereClause = this.buildWhereClause(this.conditions, params);
      parts.push(`WHERE ${whereClause}`);
    }

    // GROUP BY
    if (this.groupByClause.length > 0) {
      parts.push(`GROUP BY ${this.groupByClause.join(', ')}`);
    }

    // ORDER BY
    if (this.orderByClause.length > 0) {
      const orderClauses = this.orderByClause.map(
        (o) => `${o.column} ${o.direction.toUpperCase()}`
      );
      parts.push(`ORDER BY ${orderClauses.join(', ')}`);
    }

    // LIMIT
    if (this.limitValue !== null) {
      parts.push(`LIMIT $${params.length + 1}`);
      params.push(this.limitValue);
    }

    // OFFSET
    if (this.offsetValue !== null) {
      parts.push(`OFFSET $${params.length + 1}`);
      params.push(this.offsetValue);
    }

    return { sql: parts.join(' '), params };
  }

  private buildWhereClause(clause: WhereClause, params: any[]): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(clause)) {
      if (key === 'AND' && Array.isArray(value)) {
        const andParts = value.map((v) => this.buildWhereClause(v, params));
        parts.push(`(${andParts.join(' AND ')})`);
      } else if (key === 'OR' && Array.isArray(value)) {
        const orParts = value.map((v) => this.buildWhereClause(v, params));
        parts.push(`(${orParts.join(' OR ')})`);
      } else if (key === 'NOT' && typeof value === 'object') {
        parts.push(`NOT (${this.buildWhereClause(value, params)})`);
      } else if (typeof value === 'object' && value !== null) {
        for (const [op, val] of Object.entries(value)) {
          parts.push(this.buildOperatorClause(key, op, val, params));
        }
      } else {
        params.push(value);
        parts.push(`${key} = $${params.length}`);
      }
    }

    return parts.join(' AND ');
  }

  private buildOperatorClause(field: string, operator: string, value: any, params: any[]): string {
    switch (operator) {
      case 'eq':
        params.push(value);
        return `${field} = $${params.length}`;
      case 'ne':
        params.push(value);
        return `${field} != $${params.length}`;
      case 'gt':
        params.push(value);
        return `${field} > $${params.length}`;
      case 'gte':
        params.push(value);
        return `${field} >= $${params.length}`;
      case 'lt':
        params.push(value);
        return `${field} < $${params.length}`;
      case 'lte':
        params.push(value);
        return `${field} <= $${params.length}`;
      case 'in':
        const placeholders = value.map((v: any) => {
          params.push(v);
          return `$${params.length}`;
        });
        return `${field} IN (${placeholders.join(', ')})`;
      case 'nin':
        const ninPlaceholders = value.map((v: any) => {
          params.push(v);
          return `$${params.length}`;
        });
        return `${field} NOT IN (${ninPlaceholders.join(', ')})`;
      case 'contains':
        params.push(`%${value}%`);
        return `${field} LIKE $${params.length}`;
      case 'startsWith':
        params.push(`${value}%`);
        return `${field} LIKE $${params.length}`;
      case 'endsWith':
        params.push(`%${value}`);
        return `${field} LIKE $${params.length}`;
      case 'isNull':
        return `${field} IS NULL`;
      case 'isNotNull':
        return `${field} IS NOT NULL`;
      case 'between':
        params.push(value[0], value[1]);
        return `${field} BETWEEN $${params.length - 1} AND $${params.length}`;
      default:
        params.push(value);
        return `${field} = $${params.length}`;
    }
  }

  static from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }
}

const KNOWN_OPERATORS = [
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
  'in', 'nin', 'contains', 'startsWith', 'endsWith',
  'isNull', 'isNotNull', 'between'
] as const;

function isKnownOperator(op: string): boolean {
  return (KNOWN_OPERATORS as readonly string[]).includes(op);
}
