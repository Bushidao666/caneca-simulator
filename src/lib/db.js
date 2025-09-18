import { Pool } from "pg";

let cached = global.__pgPool;

if (!cached) {
  const connectionString = process.env.DATABASE_URL || "";
  const ssl = connectionString && !/localhost|127\.0\.0\.1/.test(connectionString)
    ? { rejectUnauthorized: false }
    : false;
  cached = global.__pgPool = new Pool({ connectionString, ssl });
}

export async function ensureMugsTable() {
  const sql = `
  create table if not exists mugs (
    id serial primary key,
    name text not null,
    color text not null default '#ffffff',
    texture text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
  );
  `;
  await cached.query(sql);
  // Migrações idempotentes
  await cached.query("alter table mugs add column if not exists settings jsonb default '{}'::jsonb");
}

export async function query(text, params) {
  return cached.query(text, params);
}

export default { query, ensureMugsTable };


