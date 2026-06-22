import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  { icon: '👋', title: 'Welcome to LinkVault!', desc: 'Your premium link-in-bio page with crypto tipping, live themes, and music.\nLet\'s get you set up in 30 seconds.' },
  { icon: '🔗', title: 'Add Your Links', desc: 'Go to Dashboard → Links tab to add your social media.\nPick from presets like Twitter, GitHub, Discord, Reddit — or add any custom URL.' },
  { icon: '⚡', title: 'Set Up Tips', desc: 'Go to Dashboard → Settings → Crypto.\nAdd your ZBD gamertag or Alby address to receive Lightning tips from visitors.' },
  { icon: '🎵', title: 'Add Music', desc: 'Go to Dashboard → Music tab.\nEmbed tracks from Spotify, Apple, SoundCloud, Wavlake, Suno, or YouTube.' },
  { icon: '🎨', title: 'Pick a Theme', desc: 'Use the ⚙️ floating button or Settings to choose from 144+ variations.\nEvery color + effect combination has unique live animations!' },
  { icon: '💬', title: 'Public Chat', desc: 'Inside the 📬 Hub, go to "Public" to chat live with other Matrix users.\nShare ideas, get feedback, and connect in real-time.' },
  { icon: '👥', title: 'Community Matrix', desc: 'Inside the 📬 Hub, go to "Community" to see who else is online.\nYou can view other profiles and grow your network.' },
  { icon: '🛠️', title: 'Support Node', desc: 'Found an anomaly? Go to the 📬 Hub → "Support" to open a ticket.\nCategorize as Bug, Glitch, or Feature Request for direct admin help.' },
  { icon: '🛡️', title: 'Stealth Mode', desc: 'Automatically enabled for your privacy.\nGo to Quick Controls (⚙️) to toggle your visibility to the community.' },
];

const BUTTON_GUIDE = [
  { emoji: '📊/👁️', label: 'Big purple button', desc: 'Switch between your public page and dashboard' },
  { emoji: '📬', label: 'Inbox button', desc: 'View messages from visitors' },
  { emoji: '⚙️', label: 'Gear button', desc: 'Quick controls: theme, export, logout' },
];

interface OnboardingProps { onComplete: () => void; }

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
      <motion.div key={step} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-purple-500/15 bg-gradient-to-b from-[#15102a] to-[#0c0a18] p-8 shadow-2xl">
        
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">{STEPS[step].icon}</span>
          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{STEPS[step].title}</h2>
          <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{STEPS[step].desc}</p>
        </div>

        {/* Show button guide on first step */}
        {step === 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-3">Floating Buttons Guide</p>
            {BUTTON_GUIDE.map(b => (
              <div key={b.label} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                <span className="text-lg w-8 text-center">{b.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-white/70">{b.label}</p>
                  <p className="text-[10px] text-white/30">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] py-3 text-sm text-white/40 hover:bg-white/[0.08] transition-all">
              Back
            </button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20">
            {isLast ? 'Start Building! 🚀' : 'Next'}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </motion.button>
        </div>

        {!isLast && (
          <button onClick={onComplete} className="w-full mt-3 text-xs text-white/20 hover:text-white/40 transition-colors">
            Skip tutorial
          </button>
        )}
      </motion.div>
    </div>
  );
}
