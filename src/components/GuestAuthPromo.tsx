import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Sparkles, LogIn } from 'lucide-react';
import { dismissOverlay, isDismissed } from '../dismissStorage';

const DISMISS_KEY = 'guest-auth-promo';

interface GuestAuthPromoProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export default function GuestAuthPromo({ onSignUp, onLogin }: GuestAuthPromoProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed(DISMISS_KEY));

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissOverlay(DISMISS_KEY);
    setDismissed(true);
  }, []);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.6 }}
          className="fixed bottom-6 left-1/2 z-[80] w-[min(100%,22rem)] -translate-x-1/2 px-4 pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0a0a12]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-fuchsia-600/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-purple-600/20 blur-2xl" />

            <button
              type="button"
              onClick={handleDismiss}
              onPointerDown={e => e.stopPropagation()}
              className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 flex items-start gap-3 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30">
                <Zap className="h-5 w-5 text-white" fill="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/80">LinkVault</p>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="text-left text-sm font-bold text-white leading-snug hover:text-purple-300 transition-colors"
                >
                  Create your own link hub
                </button>
                <p className="mt-0.5 text-[10px] font-medium text-white/40 leading-relaxed">
                  Free themes, tips, music & more — start in seconds.
                </p>
              </div>
            </div>

            <div className="relative mt-4 flex gap-2">
              <button
                type="button"
                onClick={onSignUp}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sign Up
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/10 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
