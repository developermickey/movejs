import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/query/builder';
import { ORM } from '../src/core/orm';
import type { DatabaseClient } from '../src/core/types';

// ---------------------------------------------------------------------------
// In-memory database that implements the specific SQL shapes the ORM emits
// (SELECT/INSERT/UPDATE/DELETE with $n placeholders and RETURNING *).
// ---------------------------------------------------------------------------
function tokenize(where: string): string[] {
  const re = /\$\d+|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|[A-Za-z_][A-Za-z0-9_]*|>=|<=|!=|=|>|<|\(|,|\)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(where)) !== null) tokens.push(m[0]);
  return tokens;
}

function cmpVal(left: any, op: string, right: any): boolean {
  if (left === undefined || left === null) return op === '!='||op === 'IS NOT';
  const isNum = typeof left === 'number' && typeof right === 'number';
  const l = isNum ? left : String(left);
  const r = isNum ? right : String(right);
  switch (op) {
    case '=': return isNum ? l === r : l === r;
    case '!=': return isNum ? l !== r : l !== r;
    case '>': return isNum ? (l as number) > (r as number) : String(l) > String(r);
    case '>=': return isNum ? (l as number) >= (r as number) : String(l) >= String(r);
    case '<': return isNum ? (l as number) < (r as number) : String(l) < String(r);
    case '<=': return isNum ? (l as number) <= (r as number) : String(l) <= String(r);
    default: return false;
  }
}

class WhereEvaluator {
  private p = 0;
  constructor(
    private tokens: string[],
    private params: any[]
  ) {}

  private peek(): string | undefined {
    return this.tokens[this.p];
  }
  private next(): string {
    return this.tokens[this.p++];
  }
  private param(token: string): any {
    return this.params[Number(token.slice(1)) - 1];
  }

  parseExpr(row: any): boolean {
    let left = this.parseTerm(row);
    while (this.peek() === 'OR') {
      this.next();
      left = left || this.parseTerm(row);
    }
    return left;
  }

  private parseTerm(row: any): boolean {
    let left = this.parseFactor(row);
    while (this.peek() === 'AND') {
      this.next();
      left = left && this.parseFactor(row);
    }
    return left;
  }

  private parseFactor(row: any): boolean {
    const t = this.peek();
    if (t === '(') {
      this.next();
      const v = this.parseExpr(row);
      this.next();
      return v;
    }
    if (t === 'NOT') {
      this.next();
      return !this.parseFactor(row);
    }
    return this.parsePredicate(row);
  }

  private parsePredicate(row: any): boolean {
    const col = this.next();
    const op = this.next();

    if (op === 'IS') {
      if (this.peek() === 'NOT') {
        this.next();
        this.next();
        return row[col] != null;
      }
      this.next();
      return row[col] == null;
    }
    if (op === 'IN') {
      this.next();
      const vals: any[] = [];
      while (this.peek() !== ')') {
        const tk = this.next();
        if (tk.startsWith('$')) vals.push(this.param(tk));
      }
      this.next();
      return vals.includes(row[col]);
    }
    if (op === 'NOT') {
      this.next();
      this.next();
      const vals: any[] = [];
      while (this.peek() !== ')') {
        const tk = this.next();
        if (tk.startsWith('$')) vals.push(this.param(tk));
      }
      this.next();
      return !vals.includes(row[col]);
    }
    if (op === 'LIKE') {
      const pattern = String(this.param(this.next()));
      const s = String(row[col] == null ? '' : row[col]);
      if (pattern.startsWith('%') && pattern.endsWith('%')) return s.includes(pattern.slice(1, -1));
      if (pattern.endsWith('%')) return s.startsWith(pattern.slice(0, -1));
      if (pattern.startsWith('%')) return s.endsWith(pattern.slice(1));
      return s === pattern;
    }
    if (op === 'BETWEEN') {
      const lo = this.param(this.next());
      this.next();
      const hi = this.param(this.next());
      return row[col] >= lo && row[col] <= hi;
    }
    const val = this.param(this.next());
    return cmpVal(row[col], op, val);
  }
}

class MemoryDB implements DatabaseClient {
  tables: Record<string, any[]> = {};
  sqlLog: string[] = [];

  constructor(seed: Record<string, any[]> = {}) {
    for (const [k, v] of Object.entries(seed)) this.tables[k] = v.map((r) => ({ ...r }));
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    this.sqlLog.push(sql);

    const insert = sql.match(/^INSERT INTO (\w+)\s*\(([^)]+)\) VALUES \(([^)]+)\) RETURNING \*/);
    if (insert) {
      const [, table, colsStr, valsStr] = insert;
      const cols = colsStr.split(',').map((s) => s.trim());
      const vals = valsStr.split(',').map((s) => s.trim());
      const row: any = {};
      cols.forEach((c, i) => {
        const tok = vals[i];
        row[c] = params[Number(tok.slice(1)) - 1];
      });
      this.tables[table] = this.tables[table] || [];
      this.tables[table].push(row);
      return [{ ...row }];
    }

    const update = sql.match(/^UPDATE (\w+) SET (.+?)(?: WHERE (.+?))? RETURNING \*$/);
    if (update) {
      const [, table, setClause, whereStr] = update;
      const sets: Array<[string, any]> = [];
      const setRe = /(\w+)\s*=\s*(\$\d+)/g;
      let sm: RegExpExecArray | null;
      while ((sm = setRe.exec(setClause)) !== null) sets.push([sm[1], params[Number(sm[2].slice(1)) - 1]]);

      const rows = this.tables[table] || [];
      const updated: any[] = [];
      for (const row of rows) {
        const match = whereStr
          ? new WhereEvaluator(tokenize(whereStr), params).parseExpr(row)
          : true;
        if (match) {
          for (const [col, val] of sets) row[col] = val;
          updated.push({ ...row });
        }
      }
      return updated;
    }

    const sel = sql.match(/^SELECT (.+?) FROM (\w+)\s*(?:WHERE (.+?))?\s*(?:GROUP BY (.+?))?\s*(?:ORDER BY (.+?))?\s*(?:LIMIT \$\d+)?\s*$/);
    if (!sel) return [];

    const [, colsStr, table, whereStr, groupByStr, orderByStr] = sel;
    this.tables[table] = this.tables[table] || [];
    let rows = [...this.tables[table]];
    if (whereStr) rows = rows.filter((r) => new WhereEvaluator(tokenize(whereStr), params).parseExpr(r));

    if (orderByStr) {
      const orderRe = /(\w+)\s+(ASC|DESC)(?:,|$)/g;
      const orders: Array<[string, 'asc' | 'desc']> = [];
      let om: RegExpExecArray | null;
      while ((om = orderRe.exec(orderByStr)) !== null) orders.push([om[1], om[2].toLowerCase() as 'asc' | 'desc']);
      rows.sort((a, b) => {
        for (const [col, dir] of orders) {
          const av = a[col];
          const bv = b[col];
          const isNum = typeof av === 'number' && typeof bv === 'number';
          let r: number;
          if (isNum) r = av - bv;
          else r = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
          if (r !== 0) return dir === 'desc' ? -r : r;
        }
        return 0;
      });
    }

    const limitMatch = sql.match(/LIMIT \$(\d+)/);
    if (limitMatch) rows = rows.slice(0, params[Number(limitMatch[1]) - 1]);

    // GROUP BY
    if (groupByStr) {
      const by = groupByStr.split(',').map((s) => s.trim());
      const groups = new Map<string, any>();
      for (const row of rows) {
        const key = by.map((c) => String(row[c])).join('|');
        if (!groups.has(key)) {
          const g: any = {};
          by.forEach((c) => (g[c] = row[c]));
          g.__rows = [];
          groups.set(key, g);
        }
        groups.get(key).__rows.push(row);
      }
      return Array.from(groups.values()).map((g) => {
        const out = { ...g };
        delete out.__rows;
        const countM = colsStr.match(/COUNT\(([^)]*)\)\s+as\s+(\w+)/);
        if (countM) out[countM[2]] = g.__rows.length;
        const sumM = colsStr.match(/SUM\(([^)]+)\)\s+as\s+(\w+)/);
        if (sumM) out[sumM[2]] = g.__rows.reduce((acc: number, r: any) => acc + (Number(r[sumM[1]]) || 0), 0);
        const avgM = colsStr.match(/AVG\(([^)]+)\)\s+as\s+(\w+)/);
        if (avgM) out[avgM[2]] = g.__rows.reduce((acc: number, r: any) => acc + (Number(r[avgM[1]]) || 0), 0) / g.__rows.length;
        return out;
      });
    }

    // Aggregate SELECT (single row)
    const aggCols = colsStr.match(/COUNT\(([^)]*)\)\s+as\s+(\w+)/g);
    const sumCols = colsStr.match(/SUM\(([^)]+)\)\s+as\s+(\w+)/g);
    if (aggCols || sumCols) {
      const out: any = {};
      aggCols?.forEach((m) => {
        const mm = m.match(/COUNT\(([^)]*)\)\s+as\s+(\w+)/)!;
        const arg = mm[1].trim();
        out[mm[2]] = arg === '*' ? rows.length : new Set(rows.map((r) => r[arg])).size;
      });
      sumCols?.forEach((m) => {
        const mm = m.match(/SUM\(([^)]+)\)\s+as\s+(\w+)/)!;
        out[mm[2]] = rows.reduce((acc, r) => acc + (Number(r[mm[1].trim()]) || 0), 0);
      });
      return [out];
    }

    return rows.map((r) => ({ ...r }));
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    this.sqlLog.push(sql);
    const del = sql.match(/^DELETE FROM (\w+)\s*(?:WHERE (.+?))?$/);
    if (!del) return { rowCount: 0 };
    const [, table, whereStr] = del;
    const rows = this.tables[table] || [];
    const before = rows.length;
    this.tables[table] = whereStr
      ? rows.filter((r) => !new WhereEvaluator(tokenize(whereStr), params).parseExpr(r))
      : [];
    return { rowCount: before - this.tables[table].length, affectedRows: before - this.tables[table].length };
  }

  async transaction<T>(fn: (c: DatabaseClient) => Promise<T>): Promise<T> {
    return fn(this);
  }
  async close(): Promise<void> {}
}

const seedUsers = {
  users: [
    { id: 1, name: 'Ada', status: 'active', age: 36 },
    { id: 2, name: 'Bob', status: 'active', age: 42 },
    { id: 3, name: 'Cal', status: 'inactive', age: 29 }
  ]
};

// ---------------------------------------------------------------------------
// QueryBuilder
// ---------------------------------------------------------------------------
describe('QueryBuilder', () => {
  it('generates a simple SELECT', () => {
    const { sql, params } = QueryBuilder.from('users').toSQL();
    expect(sql).toBe('SELECT * FROM users');
    expect(params).toEqual([]);
  });

  it('selects specific columns', () => {
    const { sql } = QueryBuilder.from('users').select('id', 'name').toSQL();
    expect(sql).toContain('SELECT id, name');
  });

  it('renders equality where clauses with numbered params', () => {
    const { sql, params } = QueryBuilder.from('users').where('id', 1).toSQL();
    expect(sql).toContain('WHERE id = $1');
    expect(params).toEqual([1]);
  });

  it('renders operator where clauses (gt, in, contains, between, isNull)', () => {
    const qb = QueryBuilder.from('users')
      .where({ age: { gt: 30 }, status: { in: ['active', 'pending'] } })
      .where('name', { contains: 'a' })
      .where('deletedAt', { isNull: true });
    const { sql, params } = qb.toSQL();
    expect(sql).toContain('age > $1');
    expect(sql).toContain('status IN ($2, $3)');
    expect(sql).toContain('name LIKE $4');
    expect(sql).toContain('deletedAt IS NULL');
    expect(params).toEqual([30, 'active', 'pending', '%a%']);
  });

  it('renders OR groups (top-level fields AND together, OR array ORs)', () => {
    const { sql, params } = QueryBuilder.from('users')
      .where({ status: 'active' })
      .orWhere('age', 'lt', 30)
      .toSQL();
    expect(sql).toContain('status = $1 AND (age < $2)');
    expect(params).toEqual(['active', 30]);
  });

  it('renders AND groups and NOT', () => {
    const { sql, params } = QueryBuilder.from('users')
      .where({ AND: [{ status: 'active' }, { NOT: { age: { lt: 18 } } }] })
      .toSQL();
    expect(sql).toContain('(status = $1 AND NOT (age < $2))');
    expect(params).toEqual(['active', 18]);
  });

  it('renders joins', () => {
    const { sql } = QueryBuilder.from('users')
      .join('posts', 'posts.user_id = users.id')
      .leftJoin('comments', 'comments.post_id = posts.id')
      .toSQL();
    expect(sql).toContain('INNER JOIN posts');
    expect(sql).toContain('LEFT JOIN comments');
  });

  it('renders orderBy, limit, offset and page', () => {
    const ordered = QueryBuilder.from('users').orderBy('id', 'desc').limit(10).offset(5).toSQL();
    expect(ordered.sql).toContain('ORDER BY id DESC');
    expect(ordered.sql).toContain('LIMIT $1');
    expect(ordered.sql).toContain('OFFSET $2');
    expect(ordered.params).toEqual([10, 5]);

    const paged = QueryBuilder.from('users').page(2, 20).toSQL();
    expect(paged.sql).toContain('LIMIT $1 OFFSET $2');
    expect(paged.params).toEqual([20, 20]);
  });
});

// ---------------------------------------------------------------------------
// ORM
// ---------------------------------------------------------------------------
describe('ORM', () => {
  function makeORM() {
    const db = new MemoryDB(seedUsers);
    const orm = new ORM(db);
    return { orm, db };
  }

  it('findMany returns all rows when no options given', async () => {
    const { orm } = makeORM();
    const users = await orm.get('users').findMany();
    expect(users).toHaveLength(3);
    expect(users[0]).toEqual({ id: 1, name: 'Ada', status: 'active', age: 36 });
  });

  it('findMany filters with a where clause', async () => {
    const { orm } = makeORM();
    const users = await orm.get('users').findMany({ where: { status: 'active' } });
    expect(users.map((u: any) => u.name)).toEqual(['Ada', 'Bob']);
  });

  it('findUnique returns one row or null', async () => {
    const { orm } = makeORM();
    const found = await orm.get('users').findUnique({ where: { id: 2 } });
    expect(found?.name).toBe('Bob');
    const missing = await orm.get('users').findUnique({ where: { id: 999 } });
    expect(missing).toBeNull();
  });

  it('findFirst applies take and orderBy', async () => {
    const { orm } = makeORM();
    const first = await orm.get('users').findFirst({ orderBy: { id: 'desc' } });
    expect(first?.id).toBe(3);
  });

  it('create inserts a row and returns it', async () => {
    const { orm, db } = makeORM();
    const created = await orm.get('users').create({ data: { id: 4, name: 'Dee', status: 'active', age: 20 } });
    expect(created.id).toBe(4);
    expect(db.tables.users).toHaveLength(4);
    expect(db.sqlLog.some((s) => s.includes('INSERT INTO users'))).toBe(true);
  });

  it('createMany inserts all rows and returns count', async () => {
    const { orm, db } = makeORM();
    const res = await orm.get('users').createMany({
      data: [
        { id: 5, name: 'Eve', status: 'active', age: 50 },
        { id: 6, name: 'Fox', status: 'inactive', age: 61 }
      ]
    });
    expect(res.count).toBe(2);
    expect(db.tables.users).toHaveLength(5);
  });

  it('update modifies the matching row and returns it', async () => {
    const { orm, db } = makeORM();
    const updated = await orm.get('users').update({
      where: { id: 1 },
      data: { status: 'inactive' }
    });
    expect(updated.status).toBe('inactive');
    expect(db.tables.users.find((u) => u.id === 1).status).toBe('inactive');
    expect(db.tables.users).toHaveLength(3);
    expect(db.sqlLog.some((s) => s.startsWith('UPDATE users'))).toBe(true);
  });

  it('updateMany returns count of updated rows', async () => {
    const { orm } = makeORM();
    const res = await orm.get('users').updateMany({
      where: { status: 'active' },
      data: { status: 'archived' }
    });
    expect(res.count).toBe(2);
  });

  it('upsert creates when the row does not exist and updates when it does', async () => {
    const { orm, db } = makeORM();
    const created = await orm.get('users').upsert({
      where: { id: 99 },
      create: { id: 99, name: 'New', status: 'active', age: 0 },
      update: { name: 'Changed' }
    });
    expect(created.name).toBe('New');
    expect(db.tables.users).toHaveLength(4);

    const updated = await orm.get('users').upsert({
      where: { id: 1 },
      create: { id: 1, name: 'New', status: 'active', age: 0 },
      update: { name: 'Ada L.' }
    });
    expect(updated.name).toBe('Ada L.');
    expect(db.tables.users).toHaveLength(4);
  });

  it('delete removes the matching row', async () => {
    const { orm, db } = makeORM();
    const deleted = await orm.get('users').delete({ where: { id: 3 } });
    expect(deleted.id).toBe(3);
    expect(db.tables.users).toHaveLength(2);
  });

  it('deleteMany returns count of removed rows', async () => {
    const { orm, db } = makeORM();
    const res = await orm.get('users').deleteMany({ where: { status: 'inactive' } });
    expect(res.count).toBe(1);
    expect(db.tables.users).toHaveLength(2);
  });

  it('count returns the number of matching rows', async () => {
    const { orm } = makeORM();
    expect(await orm.get('users').count()).toBe(3);
    expect(await orm.get('users').count({ where: { status: 'active' } })).toBe(2);
  });

  it('aggregate computes count and sum', async () => {
    const { orm } = makeORM();
    const agg = await orm.get('users').aggregate({ _count: true, _sum: { age: true }, where: { status: 'active' } });
    expect(agg._count).toBe(2);
    expect(agg._sum_age).toBe(78);
  });

  it('groupBy groups rows with aggregations', async () => {
    const { orm } = makeORM();
    const groups = await orm.get('users').groupBy({ by: ['status'], _count: true });
    expect(groups).toHaveLength(2);
    const byStatus = Object.fromEntries(groups.map((g: any) => [g.status, g._count]));
    expect(byStatus).toEqual({ active: 2, inactive: 1 });
  });

  it('normalizes model names to snake_case tables', async () => {
    const { orm, db } = makeORM();
    db.tables.user_profile = [{ id: 1 }];
    const rows = await orm.get('UserProfile').findMany();
    expect(rows).toEqual([{ id: 1 }]);
  });
});