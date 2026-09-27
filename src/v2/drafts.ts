import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const key = (profileId: string, field: string) => `nyang-v2-draft:${profileId}:${field}`;

export function readProfileDraft<T>(profileId: string, field: string, valid: (value: unknown) => value is T): T | null {
  try {
    const saved = localStorage.getItem(key(profileId, field));
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      if (valid(parsed)) return parsed;
    }
  } catch { /* Ignore missing or stale browser drafts. */ }
  return null;
}

export function useProfileDraft<T>(profileId: string, field: string, fallback: T, valid: (value: unknown) => value is T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key(profileId, field));
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (valid(parsed)) return parsed;
      }
    } catch { /* Storage can be unavailable or contain an old draft. */ }
    return fallback;
  });
  useEffect(() => {
    try { localStorage.setItem(key(profileId, field), JSON.stringify(value)); }
    catch { /* The game remains playable in private browsing. */ }
  }, [profileId, field, value]);
  return [value, setValue];
}

export function clearProfileDrafts(profileId: string, prefix: string) {
  try {
    const stem = key(profileId, prefix);
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const entry = localStorage.key(index);
      if (entry?.startsWith(stem)) localStorage.removeItem(entry);
    }
  } catch { /* Storage can be unavailable. */ }
}
