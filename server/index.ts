import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCommand, GameRuleError, importLegacy, initialGame, restoreState } from '../src/v2/engine';
import type { Command, GameState } from '../src/v2/engine';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = resolve(process.env.NYANG_DB_PATH || join(root, 'data', 'nyanyang.sqlite'));
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
const schemaVersion = db.prepare('PRAGMA user_version').get() as { user_version: number };
if (schemaVersion.user_version > 1) throw new Error(`이 서버가 읽을 수 없는 DB 버전입니다: ${schemaVersion.user_version}`);
db.exec('BEGIN IMMEDIATE');
try {
  db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
    state_json TEXT NOT NULL, imported_at INTEGER, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS operations (
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL,
    PRIMARY KEY (player_id, request_id)
  );
  PRAGMA user_version=1;`);
  db.exec('COMMIT');
} catch (cause) { db.exec('ROLLBACK'); throw cause; }

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const json = (res: ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
};
const error = (res: ServerResponse, status: number, message: string) => json(res, status, { error: message });

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let text = '';
  for await (const chunk of req) {
    text += chunk.toString();
    if (text.length > 256_000) throw new GameRuleError('요청이 너무 커요.');
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new GameRuleError('요청 내용을 읽을 수 없어요.'); }
}

interface PlayerRow { id: string; name: string; state_json: string; token_hash: string; imported_at: number | null }
function playerFrom(req: IncomingMessage): PlayerRow | null {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || token.length > 200) return null;
  const digest = hash(token);
  const row = db.prepare('SELECT id,name,state_json,token_hash,imported_at FROM players WHERE token_hash=?').get(digest) as unknown as PlayerRow | undefined;
  if (!row || !timingSafeEqual(Buffer.from(row.token_hash), Buffer.from(digest))) return null;
  return row;
}

function mutation(player: PlayerRow, requestId: string, update: (state: GameState) => { state: GameState; outcome: unknown }): unknown {
  if (!/^[\w-]{8,100}$/.test(requestId)) throw new GameRuleError('요청 번호를 다시 확인해 주세요.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const cached = db.prepare('SELECT response_json FROM operations WHERE player_id=? AND request_id=?').get(player.id, requestId) as { response_json: string } | undefined;
    if (cached) { db.exec('COMMIT'); return JSON.parse(cached.response_json); }
    const latest = db.prepare('SELECT state_json FROM players WHERE id=?').get(player.id) as { state_json: string };
    const result = update(restoreState(JSON.parse(latest.state_json)));
    const response = { state: result.state, outcome: result.outcome };
    db.prepare('UPDATE players SET state_json=? WHERE id=?').run(JSON.stringify(result.state), player.id);
    db.prepare('INSERT INTO operations(player_id,request_id,response_json,created_at) VALUES(?,?,?,?)').run(player.id, requestId, JSON.stringify(response), Date.now());
    db.exec('COMMIT');
    return response;
  } catch (cause) { db.exec('ROLLBACK'); throw cause; }
}

function staticFile(req: IncomingMessage, res: ServerResponse, pathname: string) {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) return error(res, 404, '빌드된 게임이 없어요. npm run build를 실행해 주세요.');
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\]|\.\.[/\\])+/, '');
  const requested = resolve(dist, safe || 'index.html');
  if (!requested.startsWith(dist + '\\') && requested !== dist && !requested.startsWith(dist + '/')) return error(res, 403, '접근할 수 없어요.');
  const file = existsSync(requested) && extname(requested) ? requested : join(dist, 'index.html');
  try {
    const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg' };
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(readFileSync(file));
  } catch { error(res, 404, '파일을 찾지 못했어요.'); }
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  try {
    if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true, storage: 'sqlite' });
    if (pathname === '/api/profiles' && req.method === 'POST') {
      const input = await body(req);
      const name = typeof input.name === 'string' ? input.name.trim().slice(0, 20) : '';
      if (!name) return error(res, 400, '셰프 이름을 적어 주세요.');
      const id = randomUUID();
      const token = randomBytes(32).toString('base64url');
      const state = initialGame();
      db.prepare('INSERT INTO players(id,name,token_hash,state_json,created_at) VALUES(?,?,?,?,?)').run(id, name, hash(token), JSON.stringify(state), Date.now());
      return json(res, 201, { profile: { id, name, token }, state });
    }
    if (!pathname.startsWith('/api/')) return staticFile(req, res, pathname);
    const player = playerFrom(req);
    if (!player) return error(res, 401, '플레이어를 다시 선택해 주세요.');
    if (pathname === '/api/state' && req.method === 'GET') return json(res, 200, { profile: { id: player.id, name: player.name }, state: restoreState(JSON.parse(player.state_json)) });
    if (pathname === '/api/command' && req.method === 'POST') {
      const input = await body(req);
      if (!input.command || typeof input.command !== 'object') return error(res, 400, '동작을 다시 확인해 주세요.');
      const command = input.command as Command;
      const allowed = ['BUY_CART', 'RECOVER_INGREDIENT', 'COOK', 'SERVE', 'CLAIM', 'DRAW', 'BUY_COSMETIC', 'EQUIP', 'START_MINIGAME', 'FINISH_MINIGAME', 'ABANDON_MINIGAME', 'SELECT_GOAL', 'CLAIM_GOAL', 'RESET'];
      if (!allowed.includes(command.type)) return error(res, 400, '알 수 없는 동작이에요.');
      const result = mutation(player, String(input.requestId || ''), state => applyCommand(state, command));
      return json(res, 200, result);
    }
    if (pathname === '/api/import' && req.method === 'POST') {
      const input = await body(req);
      const requestId = String(input.requestId || '');
      const result = mutation(player, requestId, state => {
        const check = db.prepare('SELECT imported_at FROM players WHERE id=?').get(player.id) as { imported_at: number | null };
        if (check.imported_at || state.xp || state.successfulServes || state.money !== 350) throw new GameRuleError('이미 진행한 기록이 있어 가져올 수 없어요. 새 프로필을 만들어 주세요.');
        const imported = importLegacy(input.legacy);
        db.prepare('UPDATE players SET imported_at=? WHERE id=?').run(Date.now(), player.id);
        return { state: imported, outcome: { kind: 'reward', message: '이전 식당 기록을 안전하게 가져왔어요!' } };
      });
      return json(res, 200, result);
    }
    return error(res, 404, '요청한 메뉴를 찾지 못했어요.');
  } catch (cause) {
    const expected = cause instanceof GameRuleError;
    if (!expected) console.error(cause);
    return error(res, expected ? 400 : 500, expected ? cause.message : '잠시 문제가 생겼어요. 다시 시도해 주세요.');
  }
});
const port = Number(process.env.PORT || 4174);
server.listen(port, '127.0.0.1', () => console.log(`냥냥식당 서버 http://127.0.0.1:${port} · DB ${dbPath}`));
