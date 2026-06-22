import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Link2, Shield, BarChart3, Sparkles, Inbox, Settings, AlertTriangle } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTryDemo: () => void;
  onClearStuckData?: () => void;
}

const FEATURES = [
  { icon: <Link2 className="h-6 w-6" />, title: 'Unlimited Links', desc: 'Add links with custom emojis, categories and real-time click tracking.' },
  { icon: <Zap className="h-6 w-6" />, title: 'Lightning & ZBD', desc: 'Accept Bitcoin tips via Lightning Network, ZBD, and Alby.' },
  { icon: <BarChart3 className="h-6 w-6" />, title: 'Live Analytics', desc: 'Real-time click stats, daily trends, and visitor insights.' },
  { icon: <Shield className="h-6 w-6" />, title: 'Secure Vault', desc: 'Sign up & login. Your data stays encrypted locally.' },
  { icon: <Inbox className="h-6 w-6" />, title: 'Inbox + Tips', desc: 'Receive messages and sats from visitors directly.' },
  { icon: <Settings className="h-6 w-6" />, title: '15 Premium Themes', desc: 'Bitcoin, Lightning, Ethereum, Cyberpunk and more.' },
];

export default function Landing({ onGetStarted, onLogin, onTryDemo, onClearStuckData }: LandingProps) {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    })), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* BG effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/[0.06] blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-fuchsia-600/[0.05] blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Floating particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 rounded-full bg-purple-400/30"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 animate-ping opacity-20" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-white">Link</span>
              <span className="text-purple-400">Vault</span>
            </span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onLogin}
            className="rounded-full border border-purple-500/20 bg-purple-500/5 px-6 py-2 text-sm font-medium text-purple-300/70 backdrop-blur-sm hover:bg-purple-500/10 hover:text-purple-300 transition-all"
          >
            Sign In
          </motion.button>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-8">
              <Sparkles className="h-4 w-4" />
              Premium Link Hub — Free & Open
            </div>

            <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              <span className="text-white">Your Links.</span><br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                One Vault.
              </span><br />
              <span className="text-white/60">Infinite Style.</span>
            </h1>

            <p className="text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
              The ultimate link-in-bio platform. 15 stunning themes including Bitcoin & Ethereum,
              Lightning/ZBD tips, real-time analytics, inbox system — all stored locally on your device.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow"
              >
                <Sparkles className="h-5 w-5" />
                Get Started Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTryDemo}
                className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/5 px-8 py-4 text-lg font-bold text-purple-400 hover:bg-purple-500/10 transition-all"
              >
                Try Live Demo
              </motion.button>
              <button
                onClick={onLogin}
                className="flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-lg font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Login
              </button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-xl mx-auto backdrop-blur-md"
            >
              <p className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em] mb-2 flex items-center justify-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Registration Issues?
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase tracking-tight">
                If you encounter bugs during registration: Go to <span className="text-white">Try Live Demo</span> → Open <span className="text-white">Inbox (📬)</span> → <span className="text-white">Support</span>. 
                Submit a "Bug" or "Glitch" report with your details. Include your Discord or Email in the description so our admins can reach you!
              </p>
              {onClearStuckData && (
                <button
                  type="button"
                  onClick={onClearStuckData}
                  className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Clear stuck data on this browser
                </button>
              )}
            </motion.div>
          </motion.div>

          {/* Preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 mx-auto max-w-sm"
          >
            <div className="rounded-3xl border border-purple-500/15 bg-gradient-to-b from-purple-500/[0.08] to-purple-500/[0.02] p-6 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
              <div className="flex flex-col items-center mb-5">
                <motion.div
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-3xl mb-3"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🦊
                </motion.div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400/50 mb-1">Example preview</p>
                <p className="font-bold text-white text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>@YourVault</p>
                <p className="text-xs text-purple-300/50 mt-1">Creator · Builder · Bitcoiner</p>
              </div>
              {['🌐 My Website', '𝕏 Twitter / X', '💻 GitHub', '▶️ YouTube'].map((t, i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="mb-2.5 rounded-xl border border-purple-500/15 bg-purple-500/[0.06] px-4 py-3 text-sm text-white/80 hover:bg-purple-500/[0.12] hover:border-purple-400/30 transition-all cursor-pointer"
                >
                  {t}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-400 text-center font-bold"
              >
                ⚡ Tip with Lightning / ZBD
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              Packed with premium features, completely free. No subscriptions, no limits.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-purple-500/[0.08] bg-purple-500/[0.02] p-6 hover:bg-purple-500/[0.06] hover:border-purple-500/20 transition-all"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-purple-400 group-hover:from-purple-500/30 group-hover:to-fuchsia-500/30 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-10 text-center border-t border-purple-500/[0.06]">
          <p className="text-sm text-white/20">
            Built with ╰┈➤<span className="text-purple-400/60 font-bold">⚡𝕄𝕣𝕎𝕙𝕠?.𝔸𝕀⚡</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
