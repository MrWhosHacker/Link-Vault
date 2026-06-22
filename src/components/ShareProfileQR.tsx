import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Share2, Link2 } from 'lucide-react';

interface Props {
  shareUrl: string;
  shareCode?: string;
  accentRgb?: string;
  /** compact = small icon under avatar; inline = settings panel card */
  variant?: 'compact' | 'inline';
}

export default function ShareProfileQR({
  shareUrl,
  shareCode,
  accentRgb = '147,51,234',
  variant = 'compact',
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const copyText = async (text: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      prompt('Copy:', text);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My LinkVault Profile', url: shareUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copyText(shareUrl, 'link');
  };

  const fgColor = `rgb(${accentRgb})`;

  const trigger =
    variant === 'compact' ? (
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all shadow-lg backdrop-blur-md group"
        aria-label="Share profile QR code"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `rgba(${accentRgb}, 0.2)`, boxShadow: `0 0 12px rgba(${accentRgb}, 0.3)` }}
        >
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 group-hover:text-white/80">
          Share Profile
        </span>
      </motion.button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full p-5 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `rgba(${accentRgb}, 0.15)` }}
          >
            <QrCode className="w-6 h-6" style={{ color: fgColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">
              Profile Share Link
            </p>
            <p className="text-[11px] text-white/40 font-mono truncate">{shareUrl}</p>
          </div>
          <Link2 className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0" />
        </div>
      </button>
    );

  return (
    <>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#1a1030] to-[#0a0814] p-8 shadow-2xl relative overflow-hidden"
            >
              <div
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-40 pointer-events-none"
                style={{ background: `rgb(${accentRgb})` }}
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-2">
                  Scan to Visit
                </p>
                <h3 className="text-xl font-black text-white tracking-tight">Share Your Vault</h3>
              </div>

              <div className="flex justify-center mb-6">
                <div
                  className="p-5 rounded-[2rem] bg-white shadow-[0_0_40px_rgba(255,255,255,0.12)] relative"
                  style={{ boxShadow: `0 0 60px rgba(${accentRgb}, 0.25), 0 0 40px rgba(255,255,255,0.1)` }}
                >
                  <div
                    className="absolute inset-2 rounded-[1.5rem] pointer-events-none"
                    style={{ border: `2px solid rgba(${accentRgb}, 0.3)` }}
                  />
                  <QRCodeSVG
                    value={shareUrl}
                    size={180}
                    level="H"
                    fgColor={fgColor}
                    bgColor="#ffffff"
                    includeMargin
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/25 mb-2">
                    Full Profile Link
                  </p>
                  <p className="text-[11px] font-mono text-white/80 break-all leading-relaxed select-all">
                    {shareUrl}
                  </p>
                </div>

                {shareCode && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-400/60 mb-1">
                      Share Code
                    </p>
                    <p className="text-sm font-mono font-black text-purple-200 tracking-widest select-all">
                      {shareCode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyText(shareUrl, 'link')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied === 'link' ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
