/**
 * Device-only preferences — stay on this phone/computer.
 * Account data, profile, links, and inbox live on the server.
 */
import type { AppSettings, MediaStorageMode } from './types';

const DEVICE_KEY = 'lv_device_prefs';

export interface DevicePrefs {
  animationsEnabled: boolean;
  compactMode: boolean;
  stealthMode: boolean;
  particleEffects: boolean;
  glowEffects: boolean;
  musicStorage: MediaStorageMode;
  artworkStorage: MediaStorageMode;
  /** Uploaded avatar image kept on device when user is not VIP */
  localAvatarUrl?: string;
}

export const DEF_DEVICE_PREFS: DevicePrefs = {
  animationsEnabled: true,
  compactMode: false,
  stealthMode: true,
  particleEffects: true,
  glowEffects: true,
  musicStorage: 'local',
  artworkStorage: 'local',
};

const DEVICE_KEYS: (keyof DevicePrefs)[] = [
  'animationsEnabled',
  'compactMode',
  'stealthMode',
  'particleEffects',
  'glowEffects',
  'musicStorage',
  'artworkStorage',
  'localAvatarUrl',
];

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

function deviceKey(userId: string) {
  return `${DEVICE_KEY}:${userId}`;
}

export function loadDevicePrefs(userId: string): DevicePrefs {
  return { ...DEF_DEVICE_PREFS, ...ld(deviceKey(userId), {}) };
}

export function saveDevicePrefs(userId: string, patch: Partial<DevicePrefs>) {
  const next = { ...loadDevicePrefs(userId), ...patch };
  sv(deviceKey(userId), next);
  return next;
}

export function clearDevicePrefs(userId: string) {
  localStorage.removeItem(deviceKey(userId));
}

/** Server holds account toggles; device holds UI / storage mode for this machine. */
export function mergeWithDevicePrefs(
  serverSettings: Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>,
  device: DevicePrefs,
): AppSettings {
  return { ...serverSettings, ...device };
}

export function splitSettingsPatch(patch: Partial<AppSettings>): {
  server: Partial<Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>>;
  device: Partial<DevicePrefs>;
} {
  const server: Partial<Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'>> = {};
  const device: Partial<DevicePrefs> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (DEVICE_KEYS.includes(k as keyof DevicePrefs)) {
      (device as Record<string, unknown>)[k] = v;
    } else if (k === 'enableInbox' || k === 'enableZBD' || k === 'enableAlby') {
      (server as Record<string, unknown>)[k] = v;
    }
  }
  return { server, device };
}

export function toServerSettings(
  full: AppSettings,
): Pick<AppSettings, 'enableInbox' | 'enableZBD' | 'enableAlby'> {
  return {
    enableInbox: full.enableInbox,
    enableZBD: full.enableZBD,
    enableAlby: full.enableAlby,
  };
}
