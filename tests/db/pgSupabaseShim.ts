/**
 * DEV/TEST ONLY: a tiny stand-in for the supabase-js query builder that runs
 * the same calls as real SQL against a local PostgreSQL database (migrations
 * applied). Covers only what the code under test uses: select / insert /
 * update / delete with eq, neq, in, is, not(col,"is",null), order, limit,
 * maybeSingle, single, and rpc. Not shipped, not used by the app.
 *
 * Needs the "pg" package: set AHA_PG_MODULE to its path (it is not a
 * dependency of the app), and AHA_TEST_DATABASE_URL to the database.
 */
import { createRequire } from "node:module";

type PgClient = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>; end: () => Promise<void> };

export async function connectTestDb(): Promise<PgClient | null> {
  const url = process.env.AHA_TEST_DATABASE_URL;
  const mod = process.env.AHA_PG_MODULE;
  if (!url || !mod) return null;
  const req = createRequire(process.cwd() + "/");
  const pg = req(mod) as {
    Client: new (o: { connectionString: string }) => PgClient & { connect: () => Promise<void> };
    types: { setTypeParser: (oid: number, f: (v: string) => unknown) => void };
  };
  // Same shapes PostgREST returns: dates/timestamps as strings.
  for (const oid of [1082, 1114, 1184]) pg.types.setTypeParser(oid, (v) => v);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  return c;
}

type Filter = { sql: string; values: unknown[] };

class Builder implements PromiseLike<{ data: unknown; error: { message: string; code?: string } | null; count?: number | null }> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private cols = "*";
  private returning: string | null = null;
  private filters: Filter[] = [];
  private orders: string[] = [];
  private lim: number | null = null;
  private mode: "many" | "maybe" | "single" = "many";
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;

  constructor(private db: PgClient, private table: string) {}

  select(cols = "*") {
    if (this.op === "select") this.cols = cols;
    else this.returning = cols;
    return this;
  }
  insert(p: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.payload = p;
    return this;
  }
  update(p: Record<string, unknown>) {
    this.op = "update";
    this.payload = p;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(c: string, v: unknown) {
    this.filters.push({ sql: `${q(c)} = $?`, values: [v] });
    return this;
  }
  neq(c: string, v: unknown) {
    this.filters.push({ sql: `${q(c)} <> $?`, values: [v] });
    return this;
  }
  gt(c: string, v: unknown) {
    this.filters.push({ sql: `${q(c)} > $?`, values: [v] });
    return this;
  }
  in(c: string, v: unknown[]) {
    this.filters.push({ sql: `${q(c)}::text = any($?::text[])`, values: [v] });
    return this;
  }
  is(c: string, v: null) {
    this.filters.push({ sql: `${q(c)} is ${v === null ? "null" : String(v)}`, values: [] });
    return this;
  }
  not(c: string, op: string, v: null) {
    if (op !== "is" || v !== null) throw new Error(`shim: not(${op}) unsupported`);
    this.filters.push({ sql: `${q(c)} is not null`, values: [] });
    return this;
  }
  order(c: string, o?: { ascending?: boolean }) {
    this.orders.push(`${q(c)} ${o?.ascending === false ? "desc" : "asc"}`);
    return this;
  }
  limit(n: number) {
    this.lim = n;
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }

  private where(values: unknown[]): string {
    if (!this.filters.length) return "";
    return (
      " where " +
      this.filters
        .map((f) => {
          let sql = f.sql;
          for (const v of f.values) {
            values.push(v);
            sql = sql.replace("$?", `$${values.length}`);
          }
          return sql;
        })
        .join(" and ")
    );
  }

  private build(): { text: string; values: unknown[] } {
    const values: unknown[] = [];
    const t = `public.${q(this.table)}`;
    const ret = this.returning ? ` returning ${cols(this.returning)}` : "";
    if (this.op === "select") {
      let text = `select ${cols(this.cols)} from ${t}${this.where(values)}`;
      if (this.orders.length) text += ` order by ${this.orders.join(", ")}`;
      if (this.lim != null) text += ` limit ${this.lim}`;
      return { text, values };
    }
    if (this.op === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const keys = Object.keys(rows[0]);
      const tuples = rows.map(
        (r) =>
          "(" +
          keys
            .map((k) => {
              values.push(jsonify(r[k]));
              return `$${values.length}`;
            })
            .join(", ") +
          ")",
      );
      return { text: `insert into ${t} (${keys.map(q).join(", ")}) values ${tuples.join(", ")}${ret}`, values };
    }
    if (this.op === "update") {
      const p = this.payload as Record<string, unknown>;
      const sets = Object.keys(p).map((k) => {
        values.push(jsonify(p[k]));
        return `${q(k)} = $${values.length}`;
      });
      return { text: `update ${t} set ${sets.join(", ")}${this.where(values)}${ret}`, values };
    }
    return { text: `delete from ${t}${this.where(values)}${ret}`, values };
  }

  async run() {
    try {
      const { text, values } = this.build();
      const r = await this.db.query(text, values);
      const rows = r.rows;
      if (this.op !== "select" && !this.returning) return { data: null, error: null };
      if (this.mode === "maybe") {
        if (rows.length > 1) return { data: null, error: { message: "multiple rows" } };
        return { data: rows[0] ?? null, error: null };
      }
      if (this.mode === "single") {
        if (rows.length !== 1) return { data: null, error: { message: `expected 1 row, got ${rows.length}` } };
        return { data: rows[0], error: null };
      }
      return { data: rows, error: null };
    } catch (e) {
      const err = e as { message?: string; code?: string };
      return { data: null, error: { message: err.message ?? String(e), code: err.code } };
    }
  }

  then<A, B>(
    onF?: ((v: { data: unknown; error: { message: string; code?: string } | null }) => A | PromiseLike<A>) | null,
    onR?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return this.run().then(onF as never, onR as never);
  }
}

function q(id: string): string {
  const s = id.trim();
  if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new Error(`shim: bad identifier ${s}`);
  return `"${s}"`;
}
function cols(c: string): string {
  const t = c.trim();
  if (t === "*" || t === "") return "*";
  return t
    .split(",")
    .map((x) => q(x))
    .join(", ");
}
function jsonify(v: unknown): unknown {
  return v !== null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v) ? JSON.stringify(v) : v;
}

export function supabaseShim(db: PgClient) {
  return {
    from: (table: string) => new Builder(db, table),
    async rpc(fn: string, args: Record<string, unknown>) {
      try {
        const keys = Object.keys(args);
        const text = `select * from public.${q(fn)}(${keys.map((k, i) => `${q(k)} := $${i + 1}`).join(", ")})`;
        const r = await db.query(text, keys.map((k) => jsonify(args[k])));
        return { data: r.rows, error: null };
      } catch (e) {
        const err = e as { message?: string; code?: string };
        return { data: null, error: { message: err.message ?? String(e), code: err.code } };
      }
    },
  };
}
