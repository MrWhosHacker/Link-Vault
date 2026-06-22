import type { MusicItem } from './types';
import { getMusicPlatform, resolveMusicPlatform } from './presets';

function ensureHttps(url: string): string {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return `https://${u}`;
}

export function isDirectAudioUrl(url: string): boolean {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  if (u.startsWith('data:audio') || u.startsWith('blob:')) return true;
  return /\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|#|$)/i.test(u);
}

/** Resolve playable audio src — local uploads, data URLs, or direct file links. */
export function getAudioSrc(m: MusicItem): string | null {
  if (m.fileData?.startsWith('data:audio') || m.fileData?.startsWith('blob:')) return m.fileData;
  if (isDirectAudioUrl(m.url)) return m.url.trim();
  if (m.platform === 'local' && m.fileData) return m.fileData;
  return null;
}

export function getEmbedUrl(m: MusicItem, autoplay = false): string | null {
  try {
    const platform = resolveMusicPlatform(m);
    const url = m.url.trim();
    if (!url) return null;
    const cleanUrl = ensureHttps(url.split('?')[0]);

    if (platform === 'spotify') {
      let embed = cleanUrl;
      if (cleanUrl.includes('spotify.com/track/')) {
        embed = cleanUrl
          .replace('open.spotify.com/track/', 'open.spotify.com/embed/track/')
          .replace('spotify.com/track/', 'open.spotify.com/embed/track/');
      } else if (cleanUrl.includes('spotify.com/album/')) {
        embed = cleanUrl
          .replace('open.spotify.com/album/', 'open.spotify.com/embed/album/')
          .replace('spotify.com/album/', 'open.spotify.com/embed/album/');
      } else if (cleanUrl.includes('spotify.com/playlist/')) {
        embed = cleanUrl
          .replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/')
          .replace('spotify.com/playlist/', 'open.spotify.com/embed/playlist/');
      }
      return `${embed}?utm_source=generator${autoplay ? '&autoplay=true' : ''}`;
    }
    if (platform === 'apple') {
      return ensureHttps(cleanUrl.replace('music.apple.com/', 'embed.music.apple.com/'));
    }
    if (platform === 'soundcloud') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=${autoplay}&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    }
    if (platform === 'youtube') {
      const ytId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
      return ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=${autoplay ? 1 : 0}&rel=0&enablejsapi=1` : null;
    }
    if (platform === 'wavelake') {
      return ensureHttps(cleanUrl.replace(/(?:player\.|www\.)?wavlake\.com/i, 'embed.wavlake.com'));
    }
    if (platform === 'mixcloud') {
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=${autoplay ? 1 : 0}&feed=${encodeURIComponent(url)}`;
    }
    if (platform === 'deezer') {
      const trackMatch = url.match(/deezer\.com\/(?:\w+\/)?track\/(\d+)/i);
      if (trackMatch) return `https://widget.deezer.com/widget/dark/track/${trackMatch[1]}${autoplay ? '?autoplay=true' : ''}`;
    }
    if (platform === 'bandcamp') {
      const trackMatch = url.match(/bandcamp\.com\/track\/([^/?#]+)/i);
      if (trackMatch) {
        return `https://bandcamp.com/EmbeddedPlayer/track=${trackMatch[1]}/size=large/bgcol=111111/linkcol=ffffff/artwork=small/transparent=true/${autoplay ? 'autoplay=1/' : ''}`;
      }
    }
    if (
      platform === 'suno' || platform === 'tidal' || platform === 'audius' ||
      platform === 'amazon' || platform === 'pandora' || platform === 'audiomack' ||
      platform === 'beatport' || platform === 'napster' || platform === 'iheartradio' ||
      platform === 'resso' || platform === 'jiosaavn' || platform === 'boomplay'
    ) {
      return null;
    }
    const platMeta = getMusicPlatform(platform);
    if (platMeta && !platMeta.embed) return null;
    return cleanUrl.includes('embed') ? cleanUrl : null;
  } catch {
    return null;
  }
}

export function getEmbedHeight(platform: ReturnType<typeof resolveMusicPlatform>): number {
  if (platform === 'spotify') return 152;
  if (platform === 'wavelake') return 200;
  if (platform === 'youtube') return 200;
  if (platform === 'soundcloud') return 166;
  return 120;
}

export type PlaybackMode = 'audio' | 'embed' | 'external';

export function getPlaybackMode(m: MusicItem): PlaybackMode {
  if (getAudioSrc(m)) return 'audio';
  const platform = resolveMusicPlatform(m);
  const meta = getMusicPlatform(platform);
  if (meta && !meta.embed) return 'external';
  if (getEmbedUrl(m, false)) return 'embed';
  return 'external';
}
