import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SOCIAL_PRESETS, SOCIAL_CATEGORIES } from '../presets';
import BrandIcon from './BrandIcon';

export interface IconPickerSelection {
  icon: string;
  brandSlug?: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: IconPickerSelection) => void;
  className?: string;
}

export function getBrandIconOptions() {
  const seen = new Set<string>();
  return SOCIAL_PRESETS.filter(p => {
    if (!p.brandSlug) return false;
    if (seen.has(p.brandSlug)) return false;
    seen.add(p.brandSlug);
    return true;
  });
}

export default function IconPickerPopover({ open, onClose, onSelect, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState('All');

  const options = useMemo(() => getBrandIconOptions(), []);
  const filtered = options.filter(p => category === 'All' || p.category === category);

  useEffect(() => {
    if (!open) {
      setCategory('All');
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`absolute left-0 top-full z-50 mt-2 w-[min(100vw-3rem,400px)] rounded-2xl border border-purple-500/25 bg-[#0a0a12]/95 p-4 shadow-2xl shadow-purple-500/10 backdrop-blur-2xl ${className}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">Pick brand icon</p>
        <span className="text-[8px] font-black uppercase tracking-widest text-white/25">{filtered.length} icons</span>
      </div>
      <div className="mb-3 flex max-h-16 flex-wrap gap-1.5 overflow-y-auto no-scrollbar">
        {SOCIAL_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-widest transition-all ${
              category === cat
                ? 'border-purple-500 bg-purple-600 text-white'
                : 'border-white/10 bg-white/5 text-white/35 hover:text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid max-h-[240px] grid-cols-5 gap-1.5 overflow-y-auto pr-1 no-scrollbar sm:grid-cols-6">
        {filtered.map(p => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            onClick={() => {
              onSelect({ icon: p.icon, brandSlug: p.brandSlug, label: p.label });
              onClose();
            }}
            className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-white/50 transition-all hover:border-purple-500/40 hover:bg-purple-600/10 hover:text-white"
          >
            <BrandIcon brandSlug={p.brandSlug} emoji={p.icon} size={26} withBackground={false} />
            <span className="line-clamp-2 text-[7px] font-black uppercase leading-tight">{p.shortLabel}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
