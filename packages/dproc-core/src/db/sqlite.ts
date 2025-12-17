import Database from "better-sqlite3";
import createDebug from "debug";

const debug = createDebug("dproc:db");

export interface ExecutionRecord {
  id: string;
  pipelineName: string;
  inputs: string;
  outputFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  executionTime?: number;
  tokensUsed?: number;
  error?: string;
}

export class MetadataDB {
  private db: Database.Database;

  constructor(dbPath: string = "./dproc.db") {
    this.db = new Database(dbPath);
    this.init();
    debug("Database initialized at", dbPath);
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        pipeline_name TEXT NOT NULL,
        inputs TEXT NOT NULL,
        output_format TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        execution_time INTEGER,
        tokens_used INTEGER,
        error TEXT
      )
    `);
  }

  insertExecution(record: ExecutionRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO executions (id, pipeline_name, inputs, output_format, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.pipelineName,
      record.inputs,
      record.outputFormat,
      record.status,
      record.createdAt
    );
  }

  updateExecutionStatus(
    id: string,
    status: ExecutionRecord["status"],
    error?: string,
    executionTime?: number,
    tokensUsed?: number
  ) {
    const stmt = this.db.prepare(`
      UPDATE executions
      SET status = ?, completed_at = ?, error = ?, execution_time = ?, tokens_used = ?
      WHERE id = ?
    `);

    stmt.run(
      status,
      Date.now(),
      error || null,
      executionTime || null,
      tokensUsed || null,
      id
    );
  }

  getExecution(id: string): ExecutionRecord | null {
    const stmt = this.db.prepare(`
      SELECT
        id,
        pipeline_name as pipelineName,
        inputs,
        output_format as outputFormat,
        status,
        created_at as createdAt,
        completed_at as completedAt,
        execution_time as executionTime,
        tokens_used as tokensUsed,
        error
      FROM executions
      WHERE id = ?
    `);

    return stmt.get(id) as ExecutionRecord | null;
  }

  listExecutions(pipelineName?: string, limit: number = 50): ExecutionRecord[] {
    let query = `
      SELECT
        id,
        pipeline_name as pipelineName,
        inputs,
        output_format as outputFormat,
        status,
        created_at as createdAt,
        completed_at as completedAt,
        execution_time as executionTime,
        tokens_used as tokensUsed,
        error
      FROM executions
    `;

    const params: any[] = [];

    if (pipelineName) {
      query += " WHERE pipeline_name = ?";
      params.push(pipelineName);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as ExecutionRecord[];
  }

  close() {
    this.db.close();
  }
}
