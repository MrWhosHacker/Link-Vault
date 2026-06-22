import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock, Zap, ShieldCheck } from 'lucide-react';
import ShareProfileQR from './ShareProfileQR';
import type { AuthMode, UserAccount } from '../types';
import { buildVaultShareUrl } from '../store';
import { DISCORD_INVITE_URL, DISCORD_SERVER_ID } from '../discord';

interface AuthProps {
  onAuth: (mode: AuthMode, data: { username?: string; email?: string; password: string; discord?: string }) => Promise<{ ok: boolean; error?: string; code?: string; recoveryKey?: string; shareCode?: string }>;
  onActivate: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onReset: (username: string, key: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  onBack: () => void;
  initialMode?: AuthMode;
  currentAccount?: UserAccount | null;
}

export default function Auth({ onAuth, onActivate, onReset, onBack, initialMode = 'signup', currentAccount }: AuthProps) {
  const [mode, setMode] = useState<AuthMode | 'activate' | 'forgot'>(initialMode);
  const [username, setUsername] = useState(currentAccount?.username || '');
  const [email, setEmail] = useState(currentAccount?.email || '');
  const [discord, setDiscord] = useState(currentAccount?.discord || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const canShowActivate =
    !!currentAccount?.id &&
    !currentAccount.isActivated &&
    !!(currentAccount.recoveryKey || currentAccount.activationCode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode === 'activate' && !canShowActivate) {
      setMode('login');
      setRecoveryKey('');
      setShareCode('');
      setCode('');
      if (initialMode === 'activate') {
        setError('Session expired. Please log in again.');
      }
    }
  }, [mode, canShowActivate, initialMode]);

  useEffect(() => {
    if (!currentAccount) {
      setRecoveryKey('');
      setShareCode('');
      return;
    }
    setUsername(currentAccount.username);
    setEmail(currentAccount.email || '');
    setDiscord(currentAccount.discord || '');
    if (currentAccount.shareCode) setShareCode(currentAccount.shareCode);
    if (mode === 'activate' && currentAccount.recoveryKey) {
      setRecoveryKey(currentAccount.recoveryKey);
    }
  }, [currentAccount, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    
    if (mode === 'activate') {
      if (!code.trim()) { setError('Activation code required'); return; }
      setLoading(true);
      try {
        const res = await onActivate(code);
        if (!res.ok) setError(res.error || 'Invalid activation code');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'forgot') {
      if (!username || !recoveryKey || !password) { setError('All fields required'); return; }
      setLoading(true);
      try {
        const res = await onReset(username, recoveryKey, password);
        if (res.ok) {
          setSuccess('Password reset! Please log in.');
          setMode('login');
        } else {
          setError(res.error || 'Reset failed');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup' && !username.trim()) { setError('Username required'); return; }
    if (mode === 'login' && !email.trim() && !username.trim() && !discord.trim()) {
      setError('Username, email, or Discord required');
      return;
    }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }

    setLoading(true);
    try {
      const loginId = (email.trim() || username.trim() || discord.trim());
      const res = await onAuth(mode as AuthMode, { 
        username: username.trim(), 
        email: mode === 'login' ? (loginId || undefined) : (email.trim() || undefined), 
        password, 
        discord: discord.trim() || undefined 
      });
      
      if (!res.ok) {
        const msg = res.error || 'Something went wrong';
        if (mode === 'signup' && /already (registered|taken|linked|exists)/i.test(msg)) {
          setError(`${msg} Use the Log In tab with your username and password.`);
        } else if (mode === 'login' && /already (registered|taken|linked|exists)/i.test(msg)) {
          setError(`${msg} Switch to Log In if you already activated your account.`);
        } else {
          setError(msg);
        }
      } else if (mode === 'signup' && res.recoveryKey) {
        setRecoveryKey(res.recoveryKey);
        if (res.shareCode) setShareCode(res.shareCode);
        setMode('activate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4">
      <div className="absolute inset-0">
        <div className="absolute top-[-30%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/[0.05] blur-[100px]" />
      </div>

      {mode !== 'activate' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-purple-300/50 hover:text-purple-300 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>
      )}

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-2xl shadow-purple-500/30">
            <Zap className="h-8 w-8 text-white" fill="white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Link<span className="text-purple-400">Vault</span>
          </h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
          {mode !== 'activate' && mode !== 'forgot' && (
            <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-6">
              {(['signup', 'login'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} className={`flex-1 rounded-lg py-2.5 text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}>
                  {m === 'signup' ? '✨ Sign Up' : '🔐 Log In'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'activate' && canShowActivate ? (
              <div className="space-y-6 text-center text-white">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                    <Lock className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">System Locked</h3>
                  <p className="text-white font-bold text-xs leading-relaxed uppercase tracking-widest">
                    Activation Code Required
                  </p>
                  
                  {email ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-[10px] text-green-400 font-bold uppercase tracking-widest leading-relaxed">
                      Check your email inbox ({email}) for your activation code. Entering it will unlock the vault.
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                      No email detected. You MUST join Discord to retrieve your code.
                    </div>
                  )}

                  {!email && (
                    <>
                      <div className="w-full bg-red-500/5 border border-red-500/10 p-4 rounded-2xl text-left">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Required Action:</p>
                        <ul className="text-[10px] text-white/60 space-y-3 font-bold">
                          <li className="flex items-start gap-2">
                            <span className="text-red-500">01.</span>
                            <span>Join the Discord Server</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-500">02.</span>
                            <span>Go to channel: <span className="text-white underline underline-offset-2">#activation-codes</span></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-500">03.</span>
                            <span>Request your code. Provide your username: <span className="text-white font-mono">{username}</span></span>
                          </li>
                        </ul>
                      </div>

                      <a 
                        href={DISCORD_INVITE_URL}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(88,101,242,0.3)]"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        Join Discord Server
                      </a>
                      <p className="text-[9px] text-white/40 text-center w-full">
                        Button not working?{' '}
                        <a
                          href={DISCORD_INVITE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5865F2] underline break-all hover:text-[#4752C4]"
                        >
                          {DISCORD_INVITE_URL}
                        </a>
                      </p>
                      <p className="text-[8px] text-white/20 text-center w-full font-mono">
                        Server ID: {DISCORD_SERVER_ID}
                      </p>
                    </>
                  )}

                  <div className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl break-all">
                    <p className="text-[10px] uppercase font-black text-white/20 mb-1 tracking-widest">Your Private Recovery Key</p>
                    <p className="text-sm font-mono font-black text-green-400/80 select-all tracking-widest">{currentAccount?.recoveryKey || recoveryKey}</p>
                    <p className="text-[8px] text-white/10 mt-2 uppercase font-bold">Save this key - it is required for password recovery</p>
                  </div>

                  {shareCode && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <ShareProfileQR
                        shareUrl={buildVaultShareUrl(shareCode)}
                        shareCode={shareCode}
                        variant="compact"
                      />
                      <p className="text-[8px] text-white/30 uppercase font-bold text-center px-4">
                        Your full profile link works on any device — log in on phone with the same username & password, then enter your activation code
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] font-black text-white/30 uppercase mb-4 tracking-[0.3em]">Authorize Entry</p>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="INPUT ACTIVATION CODE"
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-5 text-center text-xl font-black tracking-[0.4em] text-white focus:border-red-500/50 transition-all outline-none placeholder:text-white/5 placeholder:tracking-normal"
                  />
                </div>
                <motion.button 
                  type="submit" 
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }} 
                  className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl disabled:opacity-50"
                >
                  {loading ? <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : 'Verify & Unlock'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setRecoveryKey(''); setShareCode(''); setCode(''); }}
                  className="w-full text-center text-[10px] text-white/30 uppercase font-black tracking-widest hover:text-white/60 pt-2"
                >
                  Already activated? Log in instead
                </button>
              </div>
            ) : mode === 'forgot' ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-white">Reset Matrix</h3>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Authorization required</p>
                </div>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="USERNAME" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" />
                <input type="text" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value.toUpperCase())} placeholder="RECOVERY KEY (RV-...)" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white font-mono outline-none" />
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="NEW PASSWORD" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest disabled:opacity-50">
                  {loading ? <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-center text-[10px] text-white/20 uppercase font-black tracking-widest">Cancel</button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div key="signup-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                      {/* Verification Notice */}
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> Verification Protocol
                        </p>
                        <div className="space-y-2 text-[10px] leading-relaxed">
                          <div className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                            <p className="text-white/60">
                              <span className="text-white font-bold">With Email:</span> Code sent to your inbox. No Discord required.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                            <p className="text-white/60">
                              <span className="text-white font-bold">No Email:</span> You <span className="text-purple-400 font-bold underline">MUST</span> join Discord to get your code.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-white/30 mb-1.5 uppercase tracking-widest">Username</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose username" className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3 text-sm text-white focus:border-purple-500/40 transition-all outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-white/30 mb-1.5 uppercase tracking-widest">Discord Handle (Optional)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">@</span>
                          <input type="text" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3 text-sm text-white focus:border-purple-500/40 transition-all outline-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-1.5 uppercase tracking-widest">Email {mode === 'signup' ? '(Optional)' : 'or Username'}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Username, email, or Discord" className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3 text-sm text-white focus:border-purple-500/40 transition-all outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-1.5 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-12 py-3 text-sm text-white focus:border-purple-500/40 transition-all outline-none" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="w-full text-right text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white/40">Forgot Password?</button>
                )}

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[10px] font-bold text-center">⚠️ {error}</motion.div>}
                {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-[10px] font-bold text-center">✅ {success}</motion.div>}

                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 transition-all">
                  {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : mode === 'signup' ? 'Generate Activation Code' : 'Enter Vault'}
                </motion.button>
              </>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
