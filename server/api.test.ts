import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { GameState } from '../src/v2/engine';

const workspace = resolve(__dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'nyang-api-test-'));
const dbPath = join(work, 'game.sqlite');
let activeDbPath = dbPath;
const port = 4300 + Math.floor(Math.random() * 400);
const base = `http://127.0.0.1:${port}`;
let child: ChildProcess;
async function start() {
  child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { cwd: workspace, env: { ...process.env, PORT: String(port), NYANG_DB_PATH: activeDbPath }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}`);
    try { const result = await fetch(`${base}/api/health`); if (result.ok) return; } catch { /* waiting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('server did not start');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await new Promise<void>(resolve => { child.once('exit', () => resolve()); setTimeout(resolve, 3000); });
}
async function api(path: string, method: string, token?: string, payload?: unknown) {
  const response = await fetch(`${base}/api/${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
  return { status: response.status, body: await response.json() };
}

beforeAll(start, 15_000);
afterAll(async () => { await stop(); rmSync(work, { recursive: true, force: true }); });

describe('SQLite profile API', () => {
  it('isolates profiles, persists restart, and returns the same result for duplicate requests', async () => {
    const a = (await api('profiles', 'POST', undefined, { name: 'A' })).body.profile as { id: string; token: string };
    const b = (await api('profiles', 'POST', undefined, { name: 'B' })).body.profile as { id: string; token: string };
    expect(a.id).not.toBe(b.id);
    expect((await api('state', 'GET', 'invalid')).status).toBe(401);
    const command = { command: { type: 'BUY_CART', items: { bread: 1 } }, requestId: 'unique-purchase-001' };
    const first = await api('command', 'POST', a.token, command);
    const repeat = await api('command', 'POST', a.token, command);
    expect(first.status).toBe(200);
    expect(repeat.body).toEqual(first.body);
    expect((first.body.state as GameState).money).toBe(295);
    expect((await api('state', 'GET', b.token)).body.state.money).toBe(350);
    await stop(); await start();
    expect((await api('state', 'GET', a.token)).body.state.inventory.bread).toBe(1);
    const cooked = await api('command', 'POST', a.token, { command: { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'heart' }, requestId: 'unique-cook-001' });
    expect(cooked.status).toBe(200);
    expect((await api('command', 'POST', a.token, { command: { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'heart' }, requestId: 'unique-cook-001' })).body).toEqual(cooked.body);
    expect(cooked.body.state.inventory.egg).toBe(2);
    const served = await api('command', 'POST', a.token, { command: { type: 'SERVE', target: 'customer' }, requestId: 'unique-serve-001' });
    expect(served.status).toBe(200);
    expect((await api('command', 'POST', a.token, { command: { type: 'SERVE', target: 'customer' }, requestId: 'unique-serve-001' })).body).toEqual(served.body);
    expect(served.body.state.hearts).toBe(1);
    expect((await api('command', 'POST', a.token, { command: { type: 'SERVE', target: 'customer' }, requestId: 'new-serve-002' })).status).toBe(400);
    const reset = await api('command', 'POST', a.token, { command: { type: 'RESET' }, requestId: 'reset-a-001' });
    expect(reset.body.state.money).toBe(350);
    expect(reset.body.state.inventory.bread).toBe(0);
    expect((await api('state', 'GET', b.token)).body.state.money).toBe(350);
    expect((await api('command', 'POST', b.token, { command: { type: 'BUY_CART', items: { bread: -1 } }, requestId: 'invalid-item-001' })).status).toBe(400);
  }, 15_000);
  it('imports a legacy save only into a fresh selected profile', async () => {
    const c = (await api('profiles', 'POST', undefined, { name: '이전 셰프' })).body.profile as { token: string };
    const legacy = { version: 2, xp: 300, money: 777, hearts: 4, inventory: { egg: 5 }, order: { recipeId: 'fried_egg', customerId: 'panda', special: true } };
    const imported = await api('import', 'POST', c.token, { legacy, requestId: 'legacy-import-001' });
    expect(imported.status).toBe(200);
    expect(imported.body.state.money).toBe(777);
    expect(imported.body.state.order.customerId).toBe('panda');
    expect((await api('import', 'POST', c.token, { legacy, requestId: 'legacy-import-002' })).status).toBe(400);
  });
  it('backs up a live database and serves the same profile from the restored copy', async () => {
    const chef = (await api('profiles', 'POST', undefined, { name: '백업 셰프' })).body.profile as { token: string };
    const bought = await api('command', 'POST', chef.token, { command: { type: 'BUY_CART', items: { bread: 1 } }, requestId: 'backup-purchase-001' });
    expect(bought.body.state.inventory.bread).toBe(1);
    const backupPath = join(work, 'restore-copy.sqlite');
    const backed = spawnSync(process.execPath, ['--import', 'tsx', 'server/backup.ts', backupPath], {
      cwd: workspace, env: { ...process.env, NYANG_DB_PATH: dbPath }, encoding: 'utf8', timeout: 10_000,
    });
    expect(backed.status, backed.stderr).toBe(0);
    const copy = new DatabaseSync(backupPath);
    expect((copy.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check).toBe('ok');
    expect((copy.prepare('PRAGMA user_version').get() as { user_version: number }).user_version).toBe(1);
    copy.close();
    await stop(); activeDbPath = backupPath; await start();
    expect((await api('state', 'GET', chef.token)).body.state.inventory.bread).toBe(1);
  }, 15_000);
});
