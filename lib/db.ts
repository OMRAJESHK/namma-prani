import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDirectory = join(process.cwd(), "data");
if (!existsSync(dataDirectory)) {
  mkdirSync(dataDirectory, { recursive: true });
}

const databaseFile = process.env.SQLITE_DATABASE_FILE || "reports.db";
const dbPath = join(dataDirectory, databaseFile);
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    address TEXT,
    gps_lat REAL,
    gps_lng REAL,
    media_url TEXT,
    media_type TEXT,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export type ReportRecord = {
  id: number;
  description: string | null;
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  media_url: string | null;
  media_type: string | null;
  status: string;
  created_at: string;
};

export function insertReport(input: {
  description?: string | null;
  address?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  media_url?: string | null;
  media_type?: string | null;
}): ReportRecord | undefined {
  const insert = db.prepare(`
    INSERT INTO reports (description, address, gps_lat, gps_lng, media_url, media_type)
    VALUES (@description, @address, @gps_lat, @gps_lng, @media_url, @media_type)
  `);

  const result = insert.run({
    description: input.description ?? null,
    address: input.address ?? null,
    gps_lat: input.gps_lat ?? null,
    gps_lng: input.gps_lng ?? null,
    media_url: input.media_url ?? null,
    media_type: input.media_type ?? null,
  });

  return getReportById(result.lastInsertRowid as number);
}

export function getReports() {
  const stmt = db.prepare(`SELECT * FROM reports ORDER BY created_at DESC`);
  return stmt.all() as ReportRecord[];
}

export function getReportById(id: number) {
  const stmt = db.prepare(`SELECT * FROM reports WHERE id = ?`);
  return stmt.get(id) as ReportRecord | undefined;
}

export function updateReportStatus(id: number, status: string) {
  const stmt = db.prepare(`UPDATE reports SET status = ? WHERE id = ?`);
  const result = stmt.run(status, id);
  if (result.changes === 0) {
    return null;
  }
  return getReportById(id);
}
