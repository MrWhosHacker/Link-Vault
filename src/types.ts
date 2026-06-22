export interface EngagementStats {
  likes: number;
  dislikes: number;
  favorites: number;
  zaps: number;
}

export interface LinkItem extends EngagementStats {
  id: string;
  title: string;
  url: string;
  icon: string;
  brandSlug?: string;
  clicks: number;
  enabled: boolean;
  category: string;
}

export interface MusicItem extends EngagementStats {
  id: string;
  title: string;
  url: string;
  platform: MusicPlatform;
  fileData?: string;
}

export type MusicPlatform =
  | 'spotify' | 'apple' | 'soundcloud' | 'youtube' | 'wavelake' | 'suno'
  | 'tidal' | 'deezer' | 'bandcamp' | 'audius' | 'mixcloud' | 'amazon'
  | 'pandora' | 'audiomack' | 'beatport' | 'napster' | 'iheartradio'
  | 'resso' | 'jiosaavn' | 'boomplay' | 'local' | 'other';

export interface Artwork extends EngagementStats {
  id: string;
  url: string;
  title: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export type BadgeType = 'verified' | 'supporter' | 'discord' | 'vip' | 'beta' | 'tester' | 'dev' | 'owner' | 'staff';

export interface UserBadge {
  type: BadgeType;
  label: string;
  color: string;
  icon: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarType: 'emoji' | 'image' | 'url';
  avatarEmoji: string;
  avatarUrl: string;
  zbdGamerTag: string;
  albyAddress: string;
  theme: ThemeId;
  showQR: boolean;
  badges: BadgeType[];
  music: MusicItem[];
  artworks: Artwork[];
  chatMessages: ChatMessage[];
  onboarded: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  customColors?: {
    primary: string;
    accent: string;
    bgStyle: 'gradient' | 'mesh' | 'glass';
  };
}

export interface InboxMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: number;
  read: boolean;
  amount?: number;
  type: 'message' | 'announcement' | 'welcome';
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  discord?: string;
  passwordHash: string;
  password?: string; // Stored temporarily for final verification webhook
  activationCode: string;
  recoveryKey: string;
  shareCode: string;
  badgeActivationCode?: string;
  pendingBadges?: BadgeType[];
  isActivated: boolean;
  isBanned: boolean;
  isFrozen: boolean;
  createdAt: number;
}

export interface PublicVaultSnapshot {
  shareCode: string;
  username: string;
  profile: UserProfile;
  links: LinkItem[];
  settings: Pick<AppSettings, 'enableZBD' | 'enableAlby' | 'particleEffects' | 'glowEffects'>;
  updatedAt: number;
}

export type MediaStorageMode = 'local' | 'server';

export interface AppSettings {
  enableInbox: boolean;
  enableZBD: boolean;
  enableAlby: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  particleEffects: boolean;
  glowEffects: boolean;
  stealthMode: boolean;
  /** Music: local device or server (server requires VIP) */
  musicStorage: MediaStorageMode;
  /** Artwork: local device or server (server requires VIP) */
  artworkStorage: MediaStorageMode;
}

export interface Analytics {
  totalClicks: number;
  totalViews: number;
  clicksByDay: Record<string, number>;
  lastUpdated: number;
}

export type ThemeId =
  | 'cyberpunk' | 'aurora' | 'sunset' | 'matrix' | 'midnight'
  | 'vaporwave' | 'sakura' | 'ocean' | 'ember' | 'frost'
  | 'bitcoin' | 'ethereum' | 'lightning' | 'neon' | 'galaxy';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  emoji: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  accent: string;
  accentRgb: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  btnGradient: string;
  particleColor: string;
  liveEffect: 'none' | 'rain' | 'stars' | 'bolts' | 'coins' | 'fire' | 'snow' | 'bubbles' | 'petals';
}

export type AppView = 'landing' | 'auth' | 'profile' | 'dashboard' | 'onboarding' | 'guest';
export type AuthMode = 'login' | 'signup' | 'activate' | 'forgot';
export type DashTab = 'links' | 'music' | 'artwork' | 'analytics' | 'settings';

export type { SocialPreset, MusicPlatformDef } from './presets';
export { SOCIAL_PRESETS, SOCIAL_CATEGORIES, MUSIC_PLATFORMS, getMusicPlatform, detectMusicPlatformFromUrl, resolveMusicPlatform } from './presets';
