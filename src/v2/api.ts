import type { Command, GameState, Outcome } from './engine';

export interface Profile { id: string; name: string; token: string }
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
export const PROFILES_KEY = 'nyang-v2-profiles';
export const ACTIVE_KEY = 'nyang-v2-active';

export function savedProfiles(): Profile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((p): p is Profile => typeof p?.id === 'string' && typeof p?.name === 'string' && typeof p?.token === 'string') : [];
  } catch { return []; }
}
export function saveProfile(profile: Profile) {
  const list = savedProfiles().filter(item => item.id !== profile.id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify([...list, profile]));
  localStorage.setItem(ACTIVE_KEY, profile.id);
}
export function activeProfile(): Profile | null {
  const id = localStorage.getItem(ACTIVE_KEY);
  return savedProfiles().find(profile => profile.id === id) ?? null;
}
export function selectProfile(id: string) { localStorage.setItem(ACTIVE_KEY, id); }

async function request(path: string, method: 'GET' | 'POST', profile?: Profile, payload?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/${path}`, { method,
    headers: { ...(profile ? { Authorization: `Bearer ${profile.token}` } : {}), ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store' });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new ApiError(typeof result.error === 'string' ? result.error : '서버와 연결하지 못했어요. 잠시 뒤 다시 해 볼까요?', response.status);
  return result;
}
export async function createProfile(name: string): Promise<{ profile: Profile; state: GameState }> {
  const result = await request('profiles', 'POST', undefined, { name });
  const profile = result.profile as Profile;
  saveProfile(profile);
  return { profile, state: result.state as GameState };
}
export async function fetchState(profile: Profile): Promise<GameState> {
  const result = await request('state', 'GET', profile);
  return result.state as GameState;
}
export async function sendCommand(profile: Profile, command: Command, requestId: string = crypto.randomUUID()): Promise<{ state: GameState; outcome: Outcome }> {
  return await request('command', 'POST', profile, { command, requestId }) as unknown as { state: GameState; outcome: Outcome };
}
export async function importOldSave(profile: Profile, legacy: unknown, requestId: string = crypto.randomUUID()): Promise<{ state: GameState; outcome: Outcome }> {
  return await request('import', 'POST', profile, { legacy, requestId }) as unknown as { state: GameState; outcome: Outcome };
}
