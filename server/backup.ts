import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const source = resolve(process.env.NYANG_DB_PATH || join(process.cwd(), 'data', 'nyanyang.sqlite'));
if (!existsSync(source)) throw new Error(`DB를 찾을 수 없어요: ${source}`);
const destination = resolve(process.argv[2] || join(process.cwd(), 'data', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`));
if (existsSync(destination)) throw new Error(`이미 있는 백업을 덮어쓰지 않아요: ${destination}`);
mkdirSync(dirname(destination), { recursive: true });
const db = new DatabaseSync(source);
try {
  db.prepare('VACUUM INTO ?').run(destination);
  console.log(`SQLite 백업 완료: ${destination}`);
} finally { db.close(); }
