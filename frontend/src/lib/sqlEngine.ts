import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
// Vite resolves this to a hashed asset URL and copies the wasm binary into the
// build output, so the sandbox works offline and behind a firewall.
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let enginePromise: Promise<SqlJsStatic> | null = null;

/** Loads the SQLite WASM runtime once and shares it across every panel. */
export const getSqlEngine = (): Promise<SqlJsStatic> => {
  if (!enginePromise) {
    enginePromise = initSqlJs({ locateFile: () => sqlWasmUrl });
  }
  return enginePromise;
};

export interface SqlResultSet {
  columns: string[];
  rows: (string | number | Uint8Array | null)[][];
}

export interface SqlRunOutcome {
  results: SqlResultSet[];
  /** Rows changed by the last statement — surfaced for INSERT/UPDATE/DELETE. */
  rowsModified: number;
  elapsedMs: number;
}

export interface SchemaTable {
  name: string;
  columns: { name: string; type: string; notNull: boolean; primaryKey: boolean }[];
  rowCount: number;
}

/**
 * Builds a fresh in-memory database from the challenge's DDL + seed script.
 * A new Database is created per call so a candidate's destructive query can
 * never poison the next run — every execution starts from the pristine dataset.
 */
export const createChallengeDatabase = async (schemaScript: string): Promise<Database> => {
  const SQL = await getSqlEngine();
  const db = new SQL.Database();
  if (schemaScript && schemaScript.trim()) {
    db.run(schemaScript);
  }
  return db;
};

/** Runs the candidate's query and returns every result set it produced. */
export const runQuery = (db: Database, query: string): SqlRunOutcome => {
  const startedAt = performance.now();
  const results: SqlResultSet[] = [];

  const statements = db.exec(query);
  for (const statement of statements) {
    results.push({
      columns: statement.columns,
      rows: statement.values as SqlResultSet['rows'],
    });
  }

  return {
    results,
    rowsModified: db.getRowsModified(),
    elapsedMs: Math.round((performance.now() - startedAt) * 100) / 100,
  };
};

/** Reads back the sandbox structure so the candidate can browse tables and row counts. */
export const describeSchema = (db: Database): SchemaTable[] => {
  const tables: SchemaTable[] = [];

  const tableRows = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  if (!tableRows.length) return tables;

  for (const [tableName] of tableRows[0].values as [string][]) {
    const info = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = info.length
      ? (info[0].values as any[][]).map((col) => ({
          name: String(col[1]),
          type: String(col[2] || 'ANY'),
          notNull: col[3] === 1,
          primaryKey: col[5] === 1,
        }))
      : [];

    const countResult = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = countResult.length ? Number(countResult[0].values[0][0]) : 0;

    tables.push({ name: tableName, columns, rowCount });
  }

  return tables;
};

/** Returns the first `limit` rows of a table, for the schema browser's data preview. */
export const previewTable = (db: Database, tableName: string, limit = 5): SqlResultSet | null => {
  const result = db.exec(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
  if (!result.length) return null;
  return { columns: result[0].columns, rows: result[0].values as SqlResultSet['rows'] };
};
