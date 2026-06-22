import type { MusicItem, Artwork, AppSettings } from './types';
import {
  serverLoadUser,
  serverUpdateMusic,
  serverUpdateArtwork,
} from './serverDb';

const LOCAL_MEDIA_KEY = 'lv_local_media';

function ld<T>(k: string, f: T): T {
  try {
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : f;
  } catch {
    return f;
  }
}

function sv<T>(k: string, d: T): boolean {
  try {
    localStorage.setItem(k, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

function mediaKey(userId: string) {
  return `${LOCAL_MEDIA_KEY}:${userId}`;
}

export interface LocalMediaBundle {
  music: MusicItem[];
  artworks: Artwork[];
}

export function loadLocalMedia(userId: string): LocalMediaBundle {
  return ld(mediaKey(userId), { music: [], artworks: [] });
}

export function saveLocalArtwork(userId: string, artworks: Artwork[]): boolean {
  const bundle = loadLocalMedia(userId);
  return sv(mediaKey(userId), { ...bundle, artworks });
}

export function saveLocalMusic(userId: string, music: MusicItem[]): boolean {
  const bundle = loadLocalMedia(userId);
  return sv(mediaKey(userId), { ...bundle, music });
}

export function clearLocalMedia(userId: string) {
  localStorage.removeItem(mediaKey(userId));
}

export function resolveMediaFromStores(
  userId: string,
  settings: AppSettings,
  profileMusic: MusicItem[],
  profileArtworks: Artwork[],
): LocalMediaBundle {
  const local = loadLocalMedia(userId);
  const server = serverLoadUser(userId);

  const music =
    settings.musicStorage === 'server' && server
      ? server.serverMusic
      : local.music.length > 0
        ? local.music
        : profileMusic;

  const artworks =
    settings.artworkStorage === 'server' && server
      ? server.serverArtwork
      : local.artworks.length > 0
        ? local.artworks
        : profileArtworks;

  return { music, artworks };
}

export function persistMusic(
  userId: string,
  settings: AppSettings,
  music: MusicItem[],
): boolean {
  if (settings.musicStorage === 'server') {
    serverUpdateMusic(userId, music);
    return true;
  }
  return saveLocalMusic(userId, music);
}

export function persistArtwork(
  userId: string,
  settings: AppSettings,
  artworks: Artwork[],
): boolean {
  if (settings.artworkStorage === 'server') {
    serverUpdateArtwork(userId, artworks);
    return true;
  }
  return saveLocalArtwork(userId, artworks);
}
