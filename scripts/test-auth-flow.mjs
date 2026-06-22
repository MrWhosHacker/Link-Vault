import { createApiHandler, EMPTY_DB } from '../server/dbApi.js';

const mem = structuredClone(EMPTY_DB);
const storage = {
  loadDb: async () => structuredClone(mem),
  saveDb: async (db) => {
    mem.users = db.users;
    mem.identity = db.identity;
    mem.publicVaults = db.publicVaults;
  },
};
const api = createApiHandler(storage);

function hash(s) {
  const salt = 'LV_2026_MATRIX_';
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const combined = salt + s;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

const passHash = hash('test1234');
const account = {
  id: Date.now().toString(),
  username: 'testuser',
  displayName: 'testuser',
  passwordHash: passHash,
  activationCode: 'ABCD1234',
  recoveryKey: 'RV-TEST',
  shareCode: 'LV-TEST-1234',
  isActivated: false,
  isBanned: false,
  isFrozen: false,
  createdAt: Date.now(),
};

const results = [];
async function step(name, fn) {
  const r = await fn();
  results.push({ name, status: r.status, body: r.body });
  console.log(name, r.status, JSON.stringify(r.body).slice(0, 120));
}

await step('signup', () => api('POST', '/auth/signup', { account, profile: { username: 'testuser' }, settings: {} }));
await step('activate', () => api('POST', '/auth/activate', { userId: account.id, code: 'ABCD1234' }));
await step('login1', () => api('POST', '/auth/login', { login: 'testuser', passwordHash: passHash }));
await step('login2', () => api('POST', '/auth/login', { login: 'testuser', passwordHash: passHash }));
await step('signup-again', () => api('POST', '/auth/signup', { account, profile: {}, settings: {} }));
await step('re-activate', () => api('POST', '/auth/activate', { userId: account.id, code: 'ABCD1234' }));
await step('activate-idempotent', () => api('POST', '/auth/activate', { userId: account.id, code: 'WRONG' }));

const failed = results.filter((r) => {
  if (r.name === 'signup-again') return r.status >= 400 && !/already/i.test(r.body?.error ?? '');
  if (r.name === 'activate-idempotent') return r.status >= 400;
  return r.status >= 400;
});
if (failed.length) {
  console.error('FAILED', failed);
  process.exit(1);
}
console.log('All critical steps passed');
