export const EMPTY_DB = {
  users: {},
  identity: { username: {}, email: {}, discord: {} },
  publicVaults: {},
};

export function norm(s) {
  let v = String(s).normalize('NFC').trim().toLowerCase();
  if (v.startsWith('@')) v = v.slice(1);
  return v;
}

/** True if stored value matches login (unicode-safe, legacy keys). */
export function loginMatches(stored, login) {
  if (!stored || !login) return false;
  if (norm(stored) === norm(login)) return true;
  return String(stored).trim().toLowerCase() === String(login).trim().toLowerCase();
}

/** Wipe user + every identity/vault row tied to this login. */
export function purgeUserCompletely(db, login) {
  if (!login || !String(login).trim()) return;
  const target = norm(login);
  const userIds = new Set();

  for (const [uid, record] of Object.entries(db.users)) {
    if (
      loginMatches(record.username, login) ||
      loginMatches(record.displayName, login) ||
      (record.email && loginMatches(record.email, login)) ||
      (record.discord && loginMatches(record.discord, login))
    ) {
      userIds.add(uid);
    }
  }

  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const [k, userId] of Object.entries(map)) {
      if (loginMatches(k, login) || norm(k) === target) userIds.add(userId);
    }
  }

  for (const uid of userIds) deleteUserById(db, uid);

  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const k of Object.keys(map)) {
      if (loginMatches(k, login) || norm(k) === target) delete map[k];
    }
  }
}

function verifyAdminSecret(body) {
  const secret = body?.secret ?? '';
  const expected = process.env.ADMIN_RESET_SECRET ?? '';
  return expected && secret === expected;
}

/** Remove identity rows that point at deleted user records (blocks signup after partial delete). */
export function scrubOrphanIdentities(db) {
  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const [k, userId] of Object.entries(map)) {
      if (!db.users[userId]) delete map[k];
    }
  }
}

/** Resolve user id by login — identity map first, then scan all users (unicode-safe). */
export function resolveUserIdByLogin(db, login) {
  const key = norm(login);
  const fromMap =
    db.identity.username[key] ??
    db.identity.email[key] ??
    db.identity.discord[key];
  if (fromMap && db.users[fromMap]) return fromMap;
  for (const [uid, record] of Object.entries(db.users)) {
    if (norm(record.username) === key) return uid;
    if (record.email && norm(record.email) === key) return uid;
    if (record.discord && norm(record.discord) === key) return uid;
  }
  return null;
}

export function deleteUserById(db, userId) {
  const record = db.users[userId];
  if (record) {
    clearIdentity(db, record);
    if (record.shareCode) {
      delete db.publicVaults[record.shareCode.trim().toUpperCase()];
    }
    delete db.users[userId];
  } else {
    clearIdentityForUserId(db, userId);
  }
}

export function clearIdentity(db, record) {
  const uid = record.userId;
  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const k of Object.keys(map)) {
      if (map[k] === uid || loginMatches(k, record.username) ||
          (record.email && loginMatches(k, record.email)) ||
          (record.discord && loginMatches(k, record.discord))) {
        delete map[k];
      }
    }
  }
}

export function clearIdentityForUserId(db, userId) {
  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const [k, v] of Object.entries(map)) {
      if (v === userId) delete map[k];
    }
  }
}

export const ACCOUNT_NOT_FOUND = 'Account not found. Please sign up.';

export function registerIdentity(db, record) {
  db.identity.username[norm(record.username)] = record.userId;
  if (record.email) db.identity.email[norm(record.email)] = record.userId;
  if (record.discord) db.identity.discord[norm(record.discord)] = record.userId;
}

export function recordToAccount(record) {
  return {
    id: record.userId,
    username: record.username,
    displayName: record.displayName,
    email: record.email,
    discord: record.discord,
    passwordHash: record.passwordHash,
    activationCode: record.activationCode,
    recoveryKey: record.recoveryKey,
    shareCode: record.shareCode,
    badgeActivationCode: record.badgeActivationCode,
    pendingBadges: record.pendingBadges,
    isActivated: record.isActivated,
    isBanned: record.isBanned,
    isFrozen: record.isFrozen,
    createdAt: record.createdAt,
  };
}

function checkIdentity(db, username, email, discord, excludeUserId) {
  const taken = (map, value, label) => {
    const key = norm(value);
    for (const [k, owner] of Object.entries(map)) {
      if (owner === excludeUserId) continue;
      if (norm(k) !== key && !loginMatches(k, value)) continue;
      if (!db.users[owner]) {
        delete map[k];
        continue;
      }
      return `${label} is already registered.`;
    }
    return null;
  };
  const takenUser = (value, label) => {
    for (const [uid, record] of Object.entries(db.users)) {
      if (uid === excludeUserId) continue;
      if (loginMatches(record.username, value) || loginMatches(record.displayName, value)) {
        return `${label} is already registered.`;
      }
    }
    return null;
  };
  const uErr = taken(db.identity.username, username, 'Username') ?? takenUser(username, 'Username');
  if (uErr) return uErr;
  if (email?.trim()) {
    const eErr = taken(db.identity.email, email, 'Email');
    if (eErr) return eErr;
  }
  if (discord?.trim()) {
    const dErr = taken(db.identity.discord, discord, 'Discord handle');
    if (dErr) return dErr;
  }
  return null;
}

function normalizeDb(db) {
  if (!db.publicVaults) db.publicVaults = {};
  if (!db.identity) db.identity = { username: {}, email: {}, discord: {} };
  if (!db.users) db.users = {};
  return db;
}

function buildUserRecord(account, profile, settings, links, inbox, analytics) {
  return {
    userId: account.id,
    username: account.username,
    displayName: account.displayName || account.username,
    email: account.email,
    discord: account.discord,
    passwordHash: account.passwordHash,
    password: account.password,
    activationCode: account.activationCode,
    recoveryKey: account.recoveryKey,
    shareCode: account.shareCode,
    badgeActivationCode: account.badgeActivationCode,
    pendingBadges: account.pendingBadges,
    isActivated: !!account.isActivated,
    isBanned: !!account.isBanned,
    isFrozen: !!account.isFrozen,
    createdAt: account.createdAt || Date.now(),
    lastLoginAt: Date.now(),
    profile: profile ?? {},
    settings: settings ?? {},
    links: links ?? [],
    inbox: inbox ?? [],
    analytics: analytics ?? { totalClicks: 0, totalViews: 0, clicksByDay: {}, lastUpdated: Date.now() },
    serverMusic: [],
    serverArtwork: [],
  };
}

/** Strip Netlify / Express path prefixes → route like `/health` or `/vault/LV-XXX` */
export function parseApiPath(pathname) {
  let p = pathname.split('?')[0];
  if (p.startsWith('/.netlify/functions/api')) p = p.slice('/.netlify/functions/api'.length);
  if (p.startsWith('/api')) p = p.slice('/api'.length);
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/**
 * @param {{ loadDb: () => Promise<object>, saveDb: (db: object) => Promise<void> }} storage
 */
export function createApiHandler(storage) {
  return async function handleApi(method, pathname, body) {
    const path = parseApiPath(pathname);
    const db = normalizeDb(await storage.loadDb());
    scrubOrphanIdentities(db);

    const ok = (data, status = 200) => ({ status, body: data });
    const err = (error, status = 400) => ({ status, body: { ok: false, error } });

    if (method === 'GET' && path === '/health') {
      return ok({ ok: true, service: 'linkvault-api' });
    }

    if (method === 'POST' && path === '/auth/signup') {
      const { account, profile, settings, links, inbox, analytics, publicVault } = body ?? {};
      if (!account?.id || !account?.username || !account?.passwordHash) {
        return err('Invalid signup payload.');
      }
      const conflict = checkIdentity(db, account.username, account.email, account.discord);
      if (conflict) return err(conflict, 409);
      if (db.users[account.id]) return err('Account already exists.', 409);

      const record = buildUserRecord(account, profile, settings, links, inbox, analytics);

      db.users[account.id] = record;
      registerIdentity(db, record);
      if (publicVault?.shareCode) {
        db.publicVaults[publicVault.shareCode.trim().toUpperCase()] = publicVault;
      }
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(record) });
    }

    if (method === 'POST' && path === '/auth/upsert') {
      const { account, profile, settings, links, inbox, analytics, publicVault } = body ?? {};
      if (!account?.id || !account?.username || !account?.passwordHash) {
        return err('Invalid upsert payload.');
      }
      const existing = db.users[account.id];
      if (existing) clearIdentity(db, existing);

      const conflict = checkIdentity(db, account.username, account.email, account.discord, account.id);
      if (conflict) return err(conflict, 409);

      const record = buildUserRecord(account, profile, settings, links, inbox, analytics);
      if (existing) {
        record.isActivated = !!(existing.isActivated || account.isActivated);
        record.activationCode = existing.activationCode || record.activationCode;
        record.recoveryKey = existing.recoveryKey || record.recoveryKey;
        record.lastLoginAt = existing.lastLoginAt ?? record.lastLoginAt;
      }

      db.users[account.id] = record;
      registerIdentity(db, record);
      if (publicVault?.shareCode) {
        db.publicVaults[publicVault.shareCode.trim().toUpperCase()] = publicVault;
      }
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(record) });
    }

    if (method === 'POST' && path === '/auth/delete-account') {
      const { login, passwordHash } = body ?? {};
      if (!login || !passwordHash) return err('Login and password required.');
      const userId = resolveUserIdByLogin(db, login);
      if (!userId) return err(ACCOUNT_NOT_FOUND, 404);
      const user = db.users[userId];
      if (!user || user.passwordHash !== passwordHash) {
        return err('Invalid credentials', 401);
      }
      purgeUserCompletely(db, login);
      purgeUserCompletely(db, user.username);
      if (user.displayName) purgeUserCompletely(db, user.displayName);
      await storage.saveDb(db);
      return ok({ ok: true, message: 'Account deleted from server.' });
    }

    if (method === 'POST' && path === '/auth/login') {
      const { login, passwordHash } = body ?? {};
      if (!login || !passwordHash) return err('Login and password required.');
      const userId = resolveUserIdByLogin(db, login);
      if (!userId) return err(ACCOUNT_NOT_FOUND, 401);
      const user = db.users[userId];
      if (!user) {
        clearIdentityForUserId(db, userId);
        await storage.saveDb(db);
        return err(ACCOUNT_NOT_FOUND, 401);
      }
      if (user.passwordHash !== passwordHash) return err('Invalid credentials', 401);
      if (user.isBanned) return err('Your account has been banned from the Matrix.', 403);
      if (user.isFrozen) return err('Your account has been frozen. Contact support.', 403);
      user.lastLoginAt = Date.now();
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(user), user });
    }

    if (method === 'POST' && path === '/auth/activate') {
      const { userId, username, code } = body ?? {};
      const normalizedCode = (code ?? '').trim().toUpperCase();
      if (!normalizedCode) return err('Activation code required.');
      let record = userId ? db.users[userId] : null;
      if (!record && username) {
        const uid = resolveUserIdByLogin(db, username);
        record = uid ? db.users[uid] : null;
      }
      if (!record) return err('Account not found', 404);
      const storedCode = (record.activationCode ?? '').trim().toUpperCase();
      if (record.isActivated) {
        await storage.saveDb(db);
        return ok({ ok: true, account: recordToAccount(record), user: record });
      }
      if (storedCode !== normalizedCode) return err('Invalid activation code', 401);
      record.isActivated = true;
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(record), user: record });
    }

    if (method === 'POST' && path === '/auth/reset-password') {
      const { username, recoveryKey, passwordHash } = body ?? {};
      const normalizedKey = (recoveryKey ?? '').trim().toUpperCase();
      if (!username || !normalizedKey || !passwordHash) return err('All fields required.');
      const userId = resolveUserIdByLogin(db, username);
      if (!userId) return err('Invalid recovery key or username', 404);
      const user = db.users[userId];
      if (!user || user.recoveryKey !== normalizedKey) {
        return err('Invalid recovery key or username', 401);
      }
      user.passwordHash = passwordHash;
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(user) });
    }

    const vaultGet = path.match(/^\/vault\/([^/]+)$/);
    if (method === 'GET' && vaultGet) {
      const code = decodeURIComponent(vaultGet[1]).trim().toUpperCase();
      const vault = db.publicVaults[code];
      if (!vault) return err('Vault not found', 404);
      return ok({ ok: true, vault });
    }

    const vaultWrite = path.match(/^\/vault\/([^/]+)$/);
    if (method === 'PUT' && vaultWrite) {
      const code = decodeURIComponent(vaultWrite[1]).trim().toUpperCase();
      const snapshot = body;
      if (!snapshot?.shareCode) return err('Invalid vault snapshot.');
      db.publicVaults[code] = { ...snapshot, shareCode: code, updatedAt: Date.now() };
      await storage.saveDb(db);
      return ok({ ok: true });
    }

    if (method === 'DELETE' && vaultWrite) {
      const code = decodeURIComponent(vaultWrite[1]).trim().toUpperCase();
      delete db.publicVaults[code];
      await storage.saveDb(db);
      return ok({ ok: true });
    }

    const userPatch = path.match(/^\/user\/([^/]+)$/);
    if (method === 'PATCH' && userPatch) {
      const userId = decodeURIComponent(userPatch[1]);
      const patch = body ?? {};
      const record = db.users[userId];
      if (!record) return err('User not found', 404);

      const identityChanged =
        (patch.username && patch.username !== record.username) ||
        (patch.email !== undefined && patch.email !== record.email) ||
        (patch.discord !== undefined && patch.discord !== record.discord);

      if (identityChanged) clearIdentity(db, record);
      if (patch.profile) record.profile = { ...record.profile, ...patch.profile, music: [], artworks: [] };
      if (patch.settings) record.settings = { ...record.settings, ...patch.settings };
      if (patch.links) record.links = patch.links;
      if (patch.inbox) record.inbox = patch.inbox;
      if (patch.analytics) record.analytics = patch.analytics;

      for (const field of [
        'username', 'displayName', 'email', 'discord', 'passwordHash', 'isActivated',
        'isBanned', 'isFrozen', 'badgeActivationCode', 'pendingBadges', 'shareCode',
      ]) {
        if (patch[field] !== undefined) record[field] = patch[field];
      }

      if (identityChanged) registerIdentity(db, record);
      await storage.saveDb(db);
      return ok({ ok: true, account: recordToAccount(record), user: record });
    }

    if (method === 'DELETE' && userPatch) {
      const userId = decodeURIComponent(userPatch[1]);
      deleteUserById(db, userId);
      await storage.saveDb(db);
      return ok({ ok: true });
    }

    if (method === 'POST' && path === '/user/delete-by-login') {
      const login = body?.login;
      if (!login || !String(login).trim()) {
        return err('Login required.');
      }
      purgeUserCompletely(db, login);
      await storage.saveDb(db);
      return ok({ ok: true });
    }

    if ((method === 'DELETE' || method === 'POST') && path === '/admin/reset-db') {
      if (!verifyAdminSecret(body)) {
        return err('Unauthorized', 401);
      }
      const empty = structuredClone(EMPTY_DB);
      await storage.saveDb(empty);
      return ok({ ok: true, message: 'Database reset to empty.' });
    }

    if (method === 'POST' && path === '/admin/purge-user') {
      if (!verifyAdminSecret(body)) {
        return err('Unauthorized', 401);
      }
      const login = body?.login;
      if (!login || !String(login).trim()) {
        return err('Login / username required.');
      }
      purgeUserCompletely(db, login);
      await storage.saveDb(db);
      return ok({ ok: true, message: 'User purged from server.' });
    }

    if (method === 'DELETE' && path === '/admin/reset-db') {
      if (!verifyAdminSecret(body)) {
        return err('Unauthorized', 401);
      }
      const empty = structuredClone(EMPTY_DB);
      await storage.saveDb(empty);
      return ok({ ok: true, message: 'Database reset to empty.' });
    }

    return err('Not found', 404);
  };
}
