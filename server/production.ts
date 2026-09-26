// Preserve the v1 preview origin so its browser-local save is readable by v2.
process.env.PORT ||= '4173';
await import('./index.ts');
