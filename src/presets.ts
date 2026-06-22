import type { MusicPlatform } from './types';

export interface SocialPreset {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  brandSlug?: string;
  urlBase: string;
  category: string;
  handlePlaceholder: string;
}

export const SOCIAL_CATEGORIES = [
  'All', 'Social', 'Content', 'Music', 'Dev', 'Gaming', 'Creative',
  'Business', 'Payments', 'Crypto', 'Support', 'Contact', 'General',
] as const;

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: 'x', label: 'X (Twitter)', shortLabel: 'X', icon: '𝕏', brandSlug: 'x', urlBase: 'https://x.com/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'instagram', label: 'Instagram', shortLabel: 'IG', icon: '📷', brandSlug: 'instagram', urlBase: 'https://instagram.com/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'tiktok', label: 'TikTok', shortLabel: 'TikTok', icon: '🎵', brandSlug: 'tiktok', urlBase: 'https://tiktok.com/@', category: 'Social', handlePlaceholder: 'username' },
  { id: 'threads', label: 'Threads', shortLabel: 'Threads', icon: '@', brandSlug: 'threads', urlBase: 'https://threads.net/@', category: 'Social', handlePlaceholder: 'username' },
  { id: 'bluesky', label: 'Bluesky', shortLabel: 'Bsky', icon: '🦋', brandSlug: 'bluesky', urlBase: 'https://bsky.app/profile/', category: 'Social', handlePlaceholder: 'handle.bsky.social' },
  { id: 'mastodon', label: 'Mastodon', shortLabel: 'Masto', icon: '🐘', brandSlug: 'mastodon', urlBase: 'https://mastodon.social/@', category: 'Social', handlePlaceholder: 'username' },
  { id: 'facebook', label: 'Facebook', shortLabel: 'FB', icon: '👤', brandSlug: 'facebook', urlBase: 'https://facebook.com/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'snapchat', label: 'Snapchat', shortLabel: 'Snap', icon: '👻', brandSlug: 'snapchat', urlBase: 'https://snapchat.com/add/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'pinterest', label: 'Pinterest', shortLabel: 'Pin', icon: '📌', brandSlug: 'pinterest', urlBase: 'https://pinterest.com/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'reddit', label: 'Reddit', shortLabel: 'Reddit', icon: '🔶', brandSlug: 'reddit', urlBase: 'https://reddit.com/u/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'linkedin', label: 'LinkedIn', shortLabel: 'LinkedIn', icon: '💼', brandSlug: 'linkedin', urlBase: 'https://linkedin.com/in/', category: 'Social', handlePlaceholder: 'profile-id' },
  { id: 'telegram', label: 'Telegram', shortLabel: 'TG', icon: '✈️', brandSlug: 'telegram', urlBase: 'https://t.me/', category: 'Social', handlePlaceholder: 'username' },
  { id: 'whatsapp', label: 'WhatsApp', shortLabel: 'WA', icon: '📱', brandSlug: 'whatsapp', urlBase: 'https://wa.me/', category: 'Social', handlePlaceholder: '15551234567' },
  { id: 'signal', label: 'Signal', shortLabel: 'Signal', icon: '🔒', brandSlug: 'signal', urlBase: 'https://signal.me/#p/', category: 'Social', handlePlaceholder: '+15551234567' },
  { id: 'discord', label: 'Discord Server', shortLabel: 'Discord', icon: '🎮', brandSlug: 'discord', urlBase: 'https://discord.gg/', category: 'Social', handlePlaceholder: 'invite-code' },
  { id: 'discord-user', label: 'Discord Profile', shortLabel: 'DC User', icon: '💬', brandSlug: 'discord', urlBase: 'https://discord.com/users/', category: 'Social', handlePlaceholder: 'user-id' },
  { id: 'youtube', label: 'YouTube', shortLabel: 'YouTube', icon: '▶️', brandSlug: 'youtube', urlBase: 'https://youtube.com/@', category: 'Content', handlePlaceholder: 'channel' },
  { id: 'twitch', label: 'Twitch', shortLabel: 'Twitch', icon: '📺', brandSlug: 'twitch', urlBase: 'https://twitch.tv/', category: 'Content', handlePlaceholder: 'username' },
  { id: 'kick', label: 'Kick', shortLabel: 'Kick', icon: '🟢', brandSlug: 'kick', urlBase: 'https://kick.com/', category: 'Content', handlePlaceholder: 'username' },
  { id: 'rumble', label: 'Rumble', shortLabel: 'Rumble', icon: '🎬', brandSlug: 'rumble', urlBase: 'https://rumble.com/c/', category: 'Content', handlePlaceholder: 'channel' },
  { id: 'odysee', label: 'Odysee', shortLabel: 'Odysee', icon: '🌊', brandSlug: 'odysee', urlBase: 'https://odysee.com/@', category: 'Content', handlePlaceholder: 'channel' },
  { id: 'substack', label: 'Substack', shortLabel: 'Substack', icon: '📰', brandSlug: 'substack', urlBase: 'https://substack.com/@', category: 'Content', handlePlaceholder: 'newsletter' },
  { id: 'medium', label: 'Medium', shortLabel: 'Medium', icon: '✍️', brandSlug: 'medium', urlBase: 'https://medium.com/@', category: 'Content', handlePlaceholder: 'username' },
  { id: 'ghost', label: 'Ghost Blog', shortLabel: 'Ghost', icon: '👻', brandSlug: 'ghost', urlBase: 'https://', category: 'Content', handlePlaceholder: 'yourblog.com' },
  { id: 'podcast', label: 'Podcast', shortLabel: 'Podcast', icon: '🎙️', brandSlug: 'applepodcasts', urlBase: 'https://', category: 'Content', handlePlaceholder: 'podcast-url' },
  { id: 'blog', label: 'Blog / RSS', shortLabel: 'Blog', icon: '📝', brandSlug: 'rss', urlBase: 'https://', category: 'Content', handlePlaceholder: 'yourblog.com' },
  { id: 'spotify-profile', label: 'Spotify Profile', shortLabel: 'Spotify', icon: '🟢', brandSlug: 'spotify', urlBase: 'https://open.spotify.com/user/', category: 'Music', handlePlaceholder: 'user-id' },
  { id: 'apple-music', label: 'Apple Music', shortLabel: 'Apple', icon: '🍎', brandSlug: 'applemusic', urlBase: 'https://music.apple.com/profile/', category: 'Music', handlePlaceholder: 'artist-id' },
  { id: 'soundcloud-profile', label: 'SoundCloud', shortLabel: 'SC', icon: '🟧', brandSlug: 'soundcloud', urlBase: 'https://soundcloud.com/', category: 'Music', handlePlaceholder: 'username' },
  { id: 'bandcamp-profile', label: 'Bandcamp', shortLabel: 'BC', icon: '🎸', brandSlug: 'bandcamp', urlBase: 'https://bandcamp.com/', category: 'Music', handlePlaceholder: 'artist' },
  { id: 'audiomack-profile', label: 'Audiomack', shortLabel: 'Audiomack', icon: '🎧', brandSlug: 'audiomack', urlBase: 'https://audiomack.com/', category: 'Music', handlePlaceholder: 'username' },
  { id: 'github', label: 'GitHub', shortLabel: 'GitHub', icon: '🐙', brandSlug: 'github', urlBase: 'https://github.com/', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'gitlab', label: 'GitLab', shortLabel: 'GitLab', icon: '🦊', brandSlug: 'gitlab', urlBase: 'https://gitlab.com/', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'bitbucket', label: 'Bitbucket', shortLabel: 'Bitbucket', icon: '🪣', brandSlug: 'bitbucket', urlBase: 'https://bitbucket.org/', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'codepen', label: 'CodePen', shortLabel: 'CodePen', icon: '✏️', brandSlug: 'codepen', urlBase: 'https://codepen.io/', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'stackoverflow', label: 'Stack Overflow', shortLabel: 'SO', icon: '📚', brandSlug: 'stackoverflow', urlBase: 'https://stackoverflow.com/users/', category: 'Dev', handlePlaceholder: 'user-id' },
  { id: 'devto', label: 'Dev.to', shortLabel: 'Dev.to', icon: '👩‍💻', brandSlug: 'devdotto', urlBase: 'https://dev.to/', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'npm', label: 'npm', shortLabel: 'npm', icon: '📦', brandSlug: 'npm', urlBase: 'https://www.npmjs.com/~', category: 'Dev', handlePlaceholder: 'username' },
  { id: 'steam', label: 'Steam', shortLabel: 'Steam', icon: '🎮', brandSlug: 'steam', urlBase: 'https://steamcommunity.com/id/', category: 'Gaming', handlePlaceholder: 'custom-url' },
  { id: 'xbox', label: 'Xbox Gamertag', shortLabel: 'Xbox', icon: '🟩', brandSlug: 'xbox', urlBase: 'https://account.xbox.com/en-us/profile?gamertag=', category: 'Gaming', handlePlaceholder: 'Gamertag' },
  { id: 'playstation', label: 'PlayStation', shortLabel: 'PSN', icon: '🔵', brandSlug: 'playstation', urlBase: 'https://psnprofiles.com/', category: 'Gaming', handlePlaceholder: 'username' },
  { id: 'epic', label: 'Epic Games', shortLabel: 'Epic', icon: '⚔️', brandSlug: 'epicgames', urlBase: 'https://store.epicgames.com/en-US/u/', category: 'Gaming', handlePlaceholder: 'epic-id' },
  { id: 'roblox', label: 'Roblox', shortLabel: 'Roblox', icon: '🧱', brandSlug: 'roblox', urlBase: 'https://www.roblox.com/users/', category: 'Gaming', handlePlaceholder: 'profile-id' },
  { id: 'behance', label: 'Behance', shortLabel: 'Behance', icon: '🎨', brandSlug: 'behance', urlBase: 'https://behance.net/', category: 'Creative', handlePlaceholder: 'username' },
  { id: 'dribbble', label: 'Dribbble', shortLabel: 'Dribbble', icon: '🏀', brandSlug: 'dribbble', urlBase: 'https://dribbble.com/', category: 'Creative', handlePlaceholder: 'username' },
  { id: 'artstation', label: 'ArtStation', shortLabel: 'ArtStation', icon: '🖼️', brandSlug: 'artstation', urlBase: 'https://artstation.com/', category: 'Creative', handlePlaceholder: 'username' },
  { id: 'figma', label: 'Figma Community', shortLabel: 'Figma', icon: '🎯', brandSlug: 'figma', urlBase: 'https://figma.com/@', category: 'Creative', handlePlaceholder: 'username' },
  { id: 'calendly', label: 'Calendly', shortLabel: 'Calendly', icon: '📅', brandSlug: 'calendly', urlBase: 'https://calendly.com/', category: 'Business', handlePlaceholder: 'username' },
  { id: 'notion', label: 'Notion', shortLabel: 'Notion', icon: '📓', brandSlug: 'notion', urlBase: 'https://notion.so/', category: 'Business', handlePlaceholder: 'page-url' },
  { id: 'linktree', label: 'Linktree', shortLabel: 'Linktree', icon: '🌳', brandSlug: 'linktree', urlBase: 'https://linktr.ee/', category: 'Business', handlePlaceholder: 'username' },
  { id: 'etsy', label: 'Etsy Shop', shortLabel: 'Etsy', icon: '🛍️', brandSlug: 'etsy', urlBase: 'https://etsy.com/shop/', category: 'Business', handlePlaceholder: 'shop-name' },
  { id: 'amazon-shop', label: 'Amazon Store', shortLabel: 'Amazon', icon: '📦', brandSlug: 'amazon', urlBase: 'https://amazon.com/shop/', category: 'Business', handlePlaceholder: 'storefront' },
  { id: 'yelp', label: 'Yelp', shortLabel: 'Yelp', icon: '⭐', brandSlug: 'yelp', urlBase: 'https://yelp.com/biz/', category: 'Business', handlePlaceholder: 'business-name' },
  { id: 'google-maps', label: 'Google Maps', shortLabel: 'Maps', icon: '📍', brandSlug: 'googlemaps', urlBase: 'https://maps.google.com/?q=', category: 'Business', handlePlaceholder: 'business+name' },
  { id: 'kofi', label: 'Ko-fi', shortLabel: 'Ko-fi', icon: '☕', brandSlug: 'kofi', urlBase: 'https://ko-fi.com/', category: 'Support', handlePlaceholder: 'username' },
  { id: 'patreon', label: 'Patreon', shortLabel: 'Patreon', icon: '🎁', brandSlug: 'patreon', urlBase: 'https://patreon.com/', category: 'Support', handlePlaceholder: 'username' },
  { id: 'buymeacoffee', label: 'Buy Me a Coffee', shortLabel: 'BMC', icon: '☕', brandSlug: 'buymeacoffee', urlBase: 'https://buymeacoffee.com/', category: 'Support', handlePlaceholder: 'username' },
  { id: 'gumroad', label: 'Gumroad', shortLabel: 'Gumroad', icon: '🛒', brandSlug: 'gumroad', urlBase: 'https://gumroad.com/', category: 'Support', handlePlaceholder: 'username' },
  { id: 'stripe', label: 'Stripe Payment', shortLabel: 'Stripe', icon: '💳', brandSlug: 'stripe', urlBase: 'https://buy.stripe.com/', category: 'Support', handlePlaceholder: 'payment-link' },
  { id: 'cashapp', label: 'Cash App', shortLabel: 'Cash App', icon: '💵', brandSlug: 'cashapp', urlBase: 'https://cash.app/$', category: 'Payments', handlePlaceholder: 'cashtag' },
  { id: 'venmo', label: 'Venmo', shortLabel: 'Venmo', icon: '💸', brandSlug: 'venmo', urlBase: 'https://venmo.com/', category: 'Payments', handlePlaceholder: 'username' },
  { id: 'paypal', label: 'PayPal', shortLabel: 'PayPal', icon: '🅿️', brandSlug: 'paypal', urlBase: 'https://paypal.me/', category: 'Payments', handlePlaceholder: 'username' },
  { id: 'nostr', label: 'Nostr (npub)', shortLabel: 'Nostr', icon: '⚡', urlBase: 'nostr:', category: 'Crypto', handlePlaceholder: 'npub...' },
  { id: 'farcaster', label: 'Farcaster / Warpcast', shortLabel: 'Farcaster', icon: '🟣', brandSlug: 'farcaster', urlBase: 'https://warpcast.com/', category: 'Crypto', handlePlaceholder: 'username' },
  { id: 'lens', label: 'Lens Protocol', shortLabel: 'Lens', icon: '🌿', brandSlug: 'lens', urlBase: 'https://hey.xyz/u/', category: 'Crypto', handlePlaceholder: 'lens-handle' },
  { id: 'bitcoin', label: 'Bitcoin Address', shortLabel: 'BTC', icon: '₿', brandSlug: 'bitcoin', urlBase: 'bitcoin:', category: 'Crypto', handlePlaceholder: 'address' },
  { id: 'lightning', label: 'Lightning Address', shortLabel: 'LN', icon: '⚡', brandSlug: 'bitcoin', urlBase: 'lightning:', category: 'Crypto', handlePlaceholder: 'name@domain.com' },
  { id: 'email', label: 'Email', shortLabel: 'Email', icon: '📧', brandSlug: 'gmail', urlBase: 'mailto:', category: 'Contact', handlePlaceholder: 'you@email.com' },
  { id: 'phone', label: 'Phone', shortLabel: 'Phone', icon: '📞', urlBase: 'tel:', category: 'Contact', handlePlaceholder: '+15551234567' },
  { id: 'sms', label: 'SMS', shortLabel: 'SMS', icon: '💬', urlBase: 'sms:', category: 'Contact', handlePlaceholder: '+15551234567' },
  { id: 'website', label: 'Website', shortLabel: 'Web', icon: '🌐', brandSlug: 'googlechrome', urlBase: 'https://', category: 'General', handlePlaceholder: 'yoursite.com' },
  { id: 'portfolio', label: 'Portfolio', shortLabel: 'Portfolio', icon: '💼', urlBase: 'https://', category: 'General', handlePlaceholder: 'portfolio-url' },
  { id: 'resume', label: 'Resume / CV', shortLabel: 'Resume', icon: '📄', urlBase: 'https://', category: 'General', handlePlaceholder: 'resume-link' },
];

export interface MusicPlatformDef {
  id: MusicPlatform;
  label: string;
  shortLabel: string;
  icon: string;
  brandSlug?: string;
  placeholder: string;
  embed: boolean;
}

export const MUSIC_PLATFORMS: MusicPlatformDef[] = [
  { id: 'spotify', label: 'Spotify', shortLabel: 'Spotify', icon: '🟢', brandSlug: 'spotify', placeholder: 'https://open.spotify.com/track/...', embed: true },
  { id: 'apple', label: 'Apple Music', shortLabel: 'Apple', icon: '🍎', brandSlug: 'applemusic', placeholder: 'https://music.apple.com/.../album/...', embed: true },
  { id: 'youtube', label: 'YouTube', shortLabel: 'YouTube', icon: '▶️', brandSlug: 'youtube', placeholder: 'https://youtube.com/watch?v=...', embed: true },
  { id: 'soundcloud', label: 'SoundCloud', shortLabel: 'SoundCloud', icon: '🟧', brandSlug: 'soundcloud', placeholder: 'https://soundcloud.com/artist/track', embed: true },
  { id: 'wavelake', label: 'Wavlake', shortLabel: 'Wavlake', icon: '⚡', placeholder: 'https://wavlake.com/track/...', embed: true },
  { id: 'suno', label: 'Suno AI', shortLabel: 'Suno', icon: '🎶', placeholder: 'https://suno.com/song/...', embed: false },
  { id: 'tidal', label: 'Tidal', shortLabel: 'Tidal', icon: '🌊', placeholder: 'https://tidal.com/browse/track/...', embed: false },
  { id: 'deezer', label: 'Deezer', shortLabel: 'Deezer', icon: '💜', brandSlug: 'deezer', placeholder: 'https://deezer.com/track/...', embed: true },
  { id: 'bandcamp', label: 'Bandcamp', shortLabel: 'Bandcamp', icon: '🎸', brandSlug: 'bandcamp', placeholder: 'https://artist.bandcamp.com/track/...', embed: true },
  { id: 'audius', label: 'Audius', shortLabel: 'Audius', icon: '🎧', placeholder: 'https://audius.co/artist/track', embed: false },
  { id: 'mixcloud', label: 'Mixcloud', shortLabel: 'Mixcloud', icon: '☁️', brandSlug: 'mixcloud', placeholder: 'https://mixcloud.com/user/show/', embed: true },
  { id: 'amazon', label: 'Amazon Music', shortLabel: 'Amazon', icon: '📦', placeholder: 'https://music.amazon.com/albums/...', embed: false },
  { id: 'pandora', label: 'Pandora', shortLabel: 'Pandora', icon: '📻', placeholder: 'https://pandora.com/artist/...', embed: false },
  { id: 'audiomack', label: 'Audiomack', shortLabel: 'Audiomack', icon: '🔊', placeholder: 'https://audiomack.com/artist/song', embed: false },
  { id: 'beatport', label: 'Beatport', shortLabel: 'Beatport', icon: '🎛️', placeholder: 'https://beatport.com/track/...', embed: false },
  { id: 'napster', label: 'Napster', shortLabel: 'Napster', icon: '🎵', placeholder: 'https://napster.com/artist/track', embed: false },
  { id: 'iheartradio', label: 'iHeartRadio', shortLabel: 'iHeart', icon: '❤️', placeholder: 'https://iheart.com/podcast/...', embed: false },
  { id: 'resso', label: 'Resso', shortLabel: 'Resso', icon: '🎤', placeholder: 'https://resso.app/track/...', embed: false },
  { id: 'jiosaavn', label: 'JioSaavn', shortLabel: 'Saavn', icon: '🎼', placeholder: 'https://jiosaavn.com/song/...', embed: false },
  { id: 'boomplay', label: 'Boomplay', shortLabel: 'Boomplay', icon: '💥', placeholder: 'https://boomplay.com/songs/...', embed: false },
  { id: 'local', label: 'Local File', shortLabel: 'Local', icon: '📂', placeholder: 'Upload MP3, WAV, FLAC, OGG', embed: true },
  { id: 'other', label: 'Other URL', shortLabel: 'Other', icon: '🔗', placeholder: 'https://any-stream-or-audio-url', embed: false },
];

export function getMusicPlatform(id: MusicPlatform) {
  return MUSIC_PLATFORMS.find(p => p.id === id);
}

/** Infer music platform from a pasted URL so tracks aren't saved under the wrong source. */
export function detectMusicPlatformFromUrl(url: string): MusicPlatform | null {
  const u = url.trim().toLowerCase();
  if (!u) return null;
  if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|#|$)/i.test(u) || u.startsWith('data:audio') || u.startsWith('blob:')) {
    return 'local';
  }
  if (u.includes('open.spotify.com') || u.includes('spotify.com/')) return 'spotify';
  if (u.includes('music.apple.com') || u.includes('itunes.apple.com')) return 'apple';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('wavlake.com')) return 'wavelake';
  if (u.includes('suno.com') || u.includes('suno.ai')) return 'suno';
  if (u.includes('tidal.com')) return 'tidal';
  if (u.includes('deezer.com')) return 'deezer';
  if (u.includes('bandcamp.com')) return 'bandcamp';
  if (u.includes('audius.co')) return 'audius';
  if (u.includes('mixcloud.com')) return 'mixcloud';
  if (u.includes('music.amazon.com')) return 'amazon';
  if (u.includes('pandora.com')) return 'pandora';
  if (u.includes('audiomack.com')) return 'audiomack';
  if (u.includes('beatport.com')) return 'beatport';
  if (u.includes('napster.com')) return 'napster';
  if (u.includes('iheart.com')) return 'iheartradio';
  if (u.includes('resso.app')) return 'resso';
  if (u.includes('jiosaavn.com')) return 'jiosaavn';
  if (u.includes('boomplay.com')) return 'boomplay';
  return null;
}

/** Prefer URL-detected platform when it disagrees with what was stored at add time. */
export function resolveMusicPlatform(m: { platform: MusicPlatform; url: string; fileData?: string }): MusicPlatform {
  if (m.platform === 'local' || m.fileData) return 'local';
  const detected = detectMusicPlatformFromUrl(m.url);
  if (detected && detected !== 'other') return detected;
  return m.platform;
}
