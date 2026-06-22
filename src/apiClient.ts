import type {
  UserAccount,
  UserProfile,
  AppSettings,
  LinkItem,
  InboxMessage,
  Analytics,
  PublicVaultSnapshot,
  BadgeType,
} from './types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function normalizeApiLogin(login: string): string {
  return login.normalize('NFC').trim().toLowerCase().replace(/^@/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  }
  return data as T;
}

export async function apiHealth(): Promise<boolean> {
  try {
    await request('/health');
    return true;
  } catch {
    return false;
  }
}

function isRetryableSignupError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const msg = err.message.toLowerCase();
  return !(
    msg.includes('already') ||
    msg.includes('registered') ||
    msg.includes('invalid signup') ||
    msg.includes('required')
  );
}

export async function apiUpsertAccount(payload: {
  account: UserAccount;
  profile: UserProfile;
  settings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>;
  links?: LinkItem[];
  inbox?: InboxMessage[];
  analytics?: Analytics;
  publicVault?: PublicVaultSnapshot;
}): Promise<UserAccount> {
  const data = await request<{ ok: boolean; account: UserAccount }>('/auth/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.account;
}

export async function apiDeleteRemoteAccount(login: string, passwordHash: string): Promise<void> {
  await request('/auth/delete-account', {
    method: 'POST',
    body: JSON.stringify({ login: normalizeApiLogin(login), passwordHash }),
  });
}

export async function apiSignup(payload: {
  account: UserAccount;
  profile: UserProfile;
  settings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>;
  links?: LinkItem[];
  inbox?: InboxMessage[];
  analytics?: Analytics;
  publicVault?: PublicVaultSnapshot;
}, maxAttempts = 3): Promise<UserAccount> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await request<{ ok: boolean; account: UserAccount }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data.account;
    } catch (err) {
      lastErr = err;
      if (!isRetryableSignupError(err) || attempt === maxAttempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Could not reach server. Try again.');
}

export interface RemoteUserRecord {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  discord?: string;
  passwordHash: string;
  activationCode: string;
  recoveryKey: string;
  shareCode: string;
  isActivated: boolean;
  isBanned: boolean;
  isFrozen: boolean;
  createdAt?: number;
  badgeActivationCode?: string;
  pendingBadges?: BadgeType[];
  profile: UserProfile;
  settings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>;
  links: LinkItem[];
  inbox: InboxMessage[];
  analytics: Analytics;
}

export async function apiLogin(login: string, passwordHash: string): Promise<{
  account: UserAccount;
  user: RemoteUserRecord;
}> {
  const normalizedLogin = normalizeApiLogin(login);
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: normalizedLogin, passwordHash }),
  });
}

export async function apiActivate(payload: {
  userId?: string;
  username?: string;
  code: string;
}): Promise<{ account: UserAccount; user: RemoteUserRecord }> {
  return request('/auth/activate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiResetPassword(
  username: string,
  recoveryKey: string,
  passwordHash: string,
): Promise<UserAccount> {
  const data = await request<{ ok: boolean; account: UserAccount }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ username, recoveryKey, passwordHash }),
  });
  return data.account;
}

export async function apiGetVault(shareCode: string): Promise<PublicVaultSnapshot | null> {
  try {
    const data = await request<{ ok: boolean; vault: PublicVaultSnapshot }>(
      `/vault/${encodeURIComponent(shareCode.trim().toUpperCase())}`,
    );
    return data.vault;
  } catch {
    return null;
  }
}

export async function apiSaveVault(snapshot: PublicVaultSnapshot): Promise<void> {
  const code = snapshot.shareCode.trim().toUpperCase();
  await request(`/vault/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...snapshot, shareCode: code }),
  });
}

export async function apiDeleteVault(shareCode: string): Promise<void> {
  await request(`/vault/${encodeURIComponent(shareCode.trim().toUpperCase())}`, {
    method: 'DELETE',
  });
}

export async function apiPatchUser(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await request(`/user/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function apiDeleteUser(userId: string): Promise<void> {
  await request(`/user/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

/** Delete account by username, email, or Discord (cross-device identity cleanup). */
export async function apiDeleteUserByLogin(login: string): Promise<void> {
  const normalizedLogin = normalizeApiLogin(login);
  await request('/user/delete-by-login', {
    method: 'POST',
    body: JSON.stringify({ login: normalizedLogin }),
  });
}

/** Wipe all users on the remote server (requires VITE_ADMIN_RESET_SECRET). */
export async function apiResetRemoteDatabase(secret: string): Promise<void> {
  await request('/admin/reset-db', {
    method: 'DELETE',
    body: JSON.stringify({ secret }),
  });
}
