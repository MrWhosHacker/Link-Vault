import { useState, useEffect } from 'react';
import type { LinkItem } from '../types';

export const ZBD_BRAND_COLOR = '8B5CF6';

/** Map preset slugs to simple-icons package filenames when they differ. */
const SLUG_ALIASES: Record<string, string> = {
  getalby: 'alby',
  applemusic: 'applemusic',
  devdotto: 'devdotto',
  googlemaps: 'googlemaps',
  googlechrome: 'googlechrome',
  buymeacoffee: 'buymeacoffee',
  epicgames: 'epicgames',
  stackoverflow: 'stackoverflow',
  applepodcasts: 'applepodcasts',
};

const LOCAL_ICON_SLUGS = new Set(['zbd']);

const SIMPLE_ICONS_VERSION = '11.6.0';

function resolveSlug(slug: string): string {
  return SLUG_ALIASES[slug] ?? slug;
}

export function brandIconUrl(slug: string, source: 'jsdelivr' | 'simpleicons' = 'jsdelivr', color?: string): string {
  const resolved = resolveSlug(slug);
  if (LOCAL_ICON_SLUGS.has(resolved)) {
    return `/icons/social/${resolved}.svg`;
  }
  if (source === 'jsdelivr') {
    return `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${encodeURIComponent(resolved)}.svg`;
  }
  if (color) {
    return `https://cdn.simpleicons.org/${encodeURIComponent(resolved)}/${color.replace('#', '')}`;
  }
  return `https://cdn.simpleicons.org/${encodeURIComponent(resolved)}/ffffff`;
}

interface BrandIconProps {
  brandSlug?: string;
  emoji?: string;
  color?: string;
  size?: number;
  className?: string;
  withBackground?: boolean;
  /** Render icon white on dark UI (simple-icons SVGs are black by default). */
  invertOnDark?: boolean;
}

export default function BrandIcon({
  brandSlug,
  emoji,
  color,
  size = 24,
  className = '',
  withBackground = true,
  invertOnDark = true,
}: BrandIconProps) {
  const [source, setSource] = useState<'jsdelivr' | 'simpleicons' | 'failed'>('jsdelivr');

  useEffect(() => {
    setSource('jsdelivr');
  }, [brandSlug]);

  const shellClass = withBackground
    ? 'inline-flex items-center justify-center shrink-0 rounded-xl bg-white/[0.08] ring-1 ring-white/15'
    : 'inline-flex items-center justify-center shrink-0';

  const shellSize = withBackground ? size + 10 : size;

  const iconStyle = invertOnDark
    ? { width: size, height: size, objectFit: 'contain' as const, filter: 'brightness(0) invert(1)' }
    : { width: size, height: size, objectFit: 'contain' as const };

  if (!brandSlug || source === 'failed') {
    if (emoji) {
      return (
        <span
          className={`${shellClass} ${className}`}
          style={{ width: shellSize, height: shellSize }}
          aria-hidden
        >
          <span style={{ fontSize: size * 0.72, lineHeight: 1 }}>{emoji}</span>
        </span>
      );
    }
    return null;
  }

  const imgSrc =
    source === 'jsdelivr'
      ? brandIconUrl(brandSlug, 'jsdelivr')
      : brandIconUrl(brandSlug, 'simpleicons', color ?? 'ffffff');

  return (
    <span
      className={`${shellClass} ${className}`}
      style={{ width: shellSize, height: shellSize }}
      aria-hidden
    >
      <img
        key={`${brandSlug}-${source}`}
        src={imgSrc}
        alt=""
        width={size}
        height={size}
        style={iconStyle}
        onError={() => {
          if (source === 'jsdelivr') setSource('simpleicons');
          else setSource('failed');
        }}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function ZbdIcon({ size = 24, className, withBackground }: { size?: number; className?: string; withBackground?: boolean }) {
  return <BrandIcon brandSlug="zbd" size={size} className={className} withBackground={withBackground} invertOnDark={false} />;
}

export function AlbyIcon({ size = 24, className, withBackground }: { size?: number; className?: string; withBackground?: boolean }) {
  return <BrandIcon brandSlug="alby" size={size} className={className} withBackground={withBackground} invertOnDark={false} />;
}

export function LinkIcon({
  link,
  size = 24,
  className,
  withBackground = true,
}: {
  link: Pick<LinkItem, 'icon' | 'brandSlug'>;
  size?: number;
  className?: string;
  withBackground?: boolean;
}) {
  return (
    <BrandIcon
      brandSlug={link.brandSlug}
      emoji={link.icon}
      size={size}
      className={className}
      withBackground={withBackground}
    />
  );
}

export function PayProviderIcon({
  method,
  size = 24,
  className,
}: {
  method: 'zbd' | 'alby';
  size?: number;
  className?: string;
}) {
  return method === 'zbd' ? <ZbdIcon size={size} className={className} /> : <AlbyIcon size={size} className={className} />;
}
