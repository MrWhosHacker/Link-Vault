/**
 * Simulated server database (localStorage-backed).
 * Source of truth for accounts, profile, settings, links, inbox — sign in from any device.
 */
import type {
  LinkItem,
  MusicItem,
  Artwork,
  AppSettings,
  UserAccount,
  UserProfile,
  InboxMessage,
  Analytics,
  PublicVaultSnapshot,
  BadgeType,
} from './types';
import { toServerSettings } from './devicePrefs';

const SERVER_KEY = 'lv_server_db';

export interface ServerUserRecord {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  discord?: string;
  passwordHash: string;
  password?: string;
  activationCode: string;
  recoveryKey: string;
  shareCode: string;
  badgeActivationCode?: string;
  pendingBadges?: BadgeType[];
  isActivated: boolean;
  isBanned: boolean;
  isFrozen: boolean;
  createdAt: number;
  lastLoginAt?: number;
  profile: UserProfile;
  settings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>;
  links: LinkItem[];
  inbox: InboxMessage[];
  analytics: Analytics;
  serverMusic: MusicItem[];
  serverArtwork: Artwork[];
}

interface ServerDatabase {
  users: Record<string, ServerUserRecord>;
  identity: {
    username: Record<string, string>;
    email: Record<string, string>;
    discord: Record<string, string>;
  };
  publicVaults: Record<string, PublicVaultSnapshot>;
}

const DEF_ANALYTICS: Analytics = {
  totalClicks: 0,
  totalViews: 0,
  clicksByDay: {},
  lastUpdated: Date.now(),
};

function ld<T>(k: string, f: T): T {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : f;
  } catch {
    return f;
  }
}

function sv<T>(k: string, d: T) {
  try {
    localStorage.setItem(k, JSON.stringify(d));
  } catch {}
}

function loadDb(): ServerDatabase {
  const db = ld<ServerDatabase>(SERVER_KEY, {
    users: {},
    identity: { username: {}, email: {}, discord: {} },
    publicVaults: {},
  });
  if (!db.publicVaults) db.publicVaults = {};
  scrubOrphanIdentities(db);
  return db;
}

function saveDb(db: ServerDatabase) {
  sv(SERVER_KEY, db);
}

function norm(s: string) {
  let v = String(s).normalize('NFC').trim().toLowerCase();
  if (v.startsWith('@')) v = v.slice(1);
  return v;
}

function scrubOrphanIdentities(db: ServerDatabase) {
  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const [k, userId] of Object.entries(map)) {
      if (!db.users[userId]) delete map[k];
    }
  }
}

function resolveUserIdByLogin(db: ServerDatabase, login: string): string | null {
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

function clearIdentity(db: ServerDatabase, record: ServerUserRecord) {
  delete db.identity.username[norm(record.username)];
  if (record.email) delete db.identity.email[norm(record.email)];
  if (record.discord) delete db.identity.discord[norm(record.discord)];
}

function clearIdentityForUserId(db: ServerDatabase, userId: string) {
  for (const map of [db.identity.username, db.identity.email, db.identity.discord]) {
    for (const [k, v] of Object.entries(map)) {
      if (v === userId) delete map[k];
    }
  }
}

export const ACCOUNT_NOT_FOUND = 'Account not found. Please sign up.';

export type ServerAuthResult =
  | { ok: true; user: ServerUserRecord }
  | { ok: false; error: 'not_found' | 'invalid_credentials' };

function registerIdentity(db: ServerDatabase, record: ServerUserRecord) {
  db.identity.username[norm(record.username)] = record.userId;
  if (record.email) db.identity.email[norm(record.email)] = record.userId;
  if (record.discord) db.identity.discord[norm(record.discord)] = record.userId;
}

export function recordToAccount(record: ServerUserRecord): UserAccount {
  return {
    id: record.userId,
    username: record.username,
    displayName: record.displayName,
    email: record.email,
    discord: record.discord,
    passwordHash: record.passwordHash,
    password: record.password,
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

/** Each field is unique in its own column — username, email, and discord are independent. */
export function checkIdentityAvailability(
  username: string,
  email?: string,
  discord?: string,
  excludeUserId?: string,
): { ok: boolean; error?: string } {
  const db = loadDb();

  const taken = (map: Record<string, string>, value: string, label: string) => {
    const key = norm(value);
    const owner = map[key];
    if (owner && owner !== excludeUserId) {
      if (!db.users[owner]) {
        delete map[key];
        return null;
      }
      return `${label} is already registered.`;
    }
    return null;
  };

  const uErr = taken(db.identity.username, username, 'Username');
  if (uErr) return { ok: false, error: uErr };

  if (email?.trim()) {
    const eErr = taken(db.identity.email, email, 'Email');
    if (eErr) return { ok: false, error: eErr };
  }

  if (discord?.trim()) {
    const dErr = taken(db.identity.discord, discord, 'Discord handle');
    if (dErr) return { ok: false, error: dErr };
  }

  return { ok: true };
}

export function serverCreateUser(
  account: UserAccount,
  profile: UserProfile,
  settings: AppSettings,
  links: LinkItem[] = [],
  inbox: InboxMessage[] = [],
  analytics: Analytics = DEF_ANALYTICS,
): { ok: boolean; error?: string } {
  const check = checkIdentityAvailability(account.username, account.email, account.discord);
  if (!check.ok) return check;

  const db = loadDb();
  const record: ServerUserRecord = {
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
    isActivated: account.isActivated,
    isBanned: account.isBanned,
    isFrozen: account.isFrozen,
    createdAt: account.createdAt,
    profile: { ...profile, music: [], artworks: [] },
    settings: toServerSettings(settings),
    links,
    inbox,
    analytics,
    serverMusic: [],
    serverArtwork: [],
  };
  db.users[account.id] = record;
  registerIdentity(db, record);
  saveDb(db);
  return { ok: true };
}

export function serverLoadUser(userId: string): ServerUserRecord | null {
  const db = loadDb();
  return db.users[userId] ?? null;
}

export function serverListAccounts(): UserAccount[] {
  const db = loadDb();
  return Object.values(db.users).map(recordToAccount);
}

export function serverAuthenticate(login: string, passwordHash: string): ServerAuthResult {
  const db = loadDb();
  const userId = resolveUserIdByLogin(db, login);
  if (!userId) return { ok: false, error: 'not_found' };
  const user = db.users[userId];
  if (!user) {
    clearIdentityForUserId(db, userId);
    saveDb(db);
    return { ok: false, error: 'not_found' };
  }
  if (user.passwordHash !== passwordHash) return { ok: false, error: 'invalid_credentials' };
  user.lastLoginAt = Date.now();
  saveDb(db);
  return { ok: true, user };
}

export function serverFindByRecovery(username: string, recoveryKey: string): ServerUserRecord | null {
  const db = loadDb();
  const userId = resolveUserIdByLogin(db, username);
  if (!userId) return null;
  const user = db.users[userId];
  if (!user || user.recoveryKey !== recoveryKey.trim().toUpperCase()) return null;
  return user;
}

export function serverRecordLogin(userId: string) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].lastLoginAt = Date.now();
    saveDb(db);
  }
}

export function serverRecordLogout(userId: string) {
  serverRecordLogin(userId);
}

export function serverUpdatePassword(userId: string, passwordHash: string) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].passwordHash = passwordHash;
    saveDb(db);
  }
}

export function serverUpdateAccount(userId: string, patch: Partial<ServerUserRecord>) {
  const db = loadDb();
  const record = db.users[userId];
  if (!record) return;
  const identityChanged =
    (patch.username && patch.username !== record.username) ||
    (patch.email !== undefined && patch.email !== record.email) ||
    (patch.discord !== undefined && patch.discord !== record.discord);
  if (identityChanged) clearIdentity(db, record);
  Object.assign(record, patch);
  if (identityChanged) registerIdentity(db, record);
  saveDb(db);
}

export function serverUpdateSettings(
  userId: string,
  settings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>,
) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].settings = settings;
    saveDb(db);
  }
}

export function serverUpdateProfile(userId: string, profile: UserProfile) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].profile = { ...profile, music: [], artworks: [] };
    saveDb(db);
  }
}

export function serverUpdateLinks(userId: string, links: LinkItem[]) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].links = links;
    saveDb(db);
  }
}

export function serverUpdateInbox(userId: string, inbox: InboxMessage[]) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].inbox = inbox;
    saveDb(db);
  }
}

export function serverUpdateAnalytics(userId: string, analytics: Analytics) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].analytics = analytics;
    saveDb(db);
  }
}

export function serverUpdateMusic(userId: string, music: MusicItem[]) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].serverMusic = music;
    saveDb(db);
  }
}

export function serverUpdateArtwork(userId: string, artworks: Artwork[]) {
  const db = loadDb();
  if (db.users[userId]) {
    db.users[userId].serverArtwork = artworks;
    saveDb(db);
  }
}

export function serverSavePublicVault(snapshot: PublicVaultSnapshot) {
  const db = loadDb();
  db.publicVaults[snapshot.shareCode.toUpperCase()] = snapshot;
  saveDb(db);
}

export function serverLoadPublicVault(shareCode: string): PublicVaultSnapshot | null {
  const db = loadDb();
  return db.publicVaults[shareCode.trim().toUpperCase()] ?? null;
}

export function serverDeletePublicVault(shareCode: string) {
  const db = loadDb();
  delete db.publicVaults[shareCode.trim().toUpperCase()];
  saveDb(db);
}

export function serverDeleteUser(userId: string) {
  const db = loadDb();
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
  saveDb(db);
}

/** Resolve user id from username, email, or discord login (normalized). */
export function serverResolveUserId(login: string): string | null {
  const db = loadDb();
  return resolveUserIdByLogin(db, login);
}

/** Remove user + identity maps for a login id (clears ghosts after remote delete). */
export function serverPurgeByLogin(login: string) {
  const userId = serverResolveUserId(login);
  if (userId) serverDeleteUser(userId);
}

/** Reset browser-backed server DB to empty (used with wipeAllLocalAppData). */
export function serverWipeAll() {
  saveDb({
    users: {},
    identity: { username: {}, email: {}, discord: {} },
    publicVaults: {},
  });
}

/** Import or overwrite a full user record from the remote API (cross-device sync). */
export function serverImportUser(record: ServerUserRecord) {
  const db = loadDb();
  const existing = db.users[record.userId];
  if (existing) clearIdentity(db, existing);
  db.users[record.userId] = record;
  registerIdentity(db, record);
  saveDb(db);
}

/** Migrate legacy lv_accounts entries into server DB if missing. */
export function migrateLegacyAccountsToServer(accounts: UserAccount[]) {
  const db = loadDb();
  let changed = false;
  for (const acc of accounts) {
    if (db.users[acc.id]) continue;
    const check = checkIdentityAvailability(acc.username, acc.email, acc.discord);
    if (!check.ok) continue;
    const record: ServerUserRecord = {
      userId: acc.id,
      username: acc.username,
      displayName: acc.displayName || acc.username,
      email: acc.email,
      discord: acc.discord,
      passwordHash: acc.passwordHash,
      activationCode: acc.activationCode,
      recoveryKey: acc.recoveryKey,
      shareCode: acc.shareCode,
      isActivated: acc.isActivated,
      isBanned: acc.isBanned,
      isFrozen: acc.isFrozen,
      createdAt: acc.createdAt,
      profile: {
        username: acc.username,
        displayName: acc.displayName || acc.username,
        bio: '',
        avatarType: 'emoji',
        avatarEmoji: '👤',
        avatarUrl: '',
        zbdGamerTag: '',
        albyAddress: '',
        theme: 'cyberpunk',
        showQR: true,
        badges: [],
        music: [],
        artworks: [],
        chatMessages: [],
        onboarded: false,
        isVerified: false,
        isAdmin: false,
      },
      settings: {
        enableInbox: true,
        enableZBD: true,
        enableAlby: true,
      },
      links: [],
      inbox: [],
      analytics: DEF_ANALYTICS,
      serverMusic: [],
      serverArtwork: [],
    };
    db.users[acc.id] = record;
    registerIdentity(db, record);
    changed = true;
  }
  if (changed) saveDb(db);
}
