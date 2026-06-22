import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, resolveVaultFromUrlAsync, buildVaultShareUrl, getBootSession } from './store';
import type { AppView, AuthMode, PublicVaultSnapshot } from './types';
import Landing from './components/Landing';
import Auth from './components/Auth';
import GuestAuthPromo from './components/GuestAuthPromo';
import ProfilePage from './components/ProfilePage';
import Dashboard from './components/Dashboard';
import InboxPanel from './components/InboxPanel';
import ControlPanel from './components/ControlPanel';
import Onboarding from './components/Onboarding';
import { Zap } from 'lucide-react';

function goHomeUrl() {
  window.history.replaceState({}, '', '/');
}

export default function App() {
  const s = useAppStore();

  const [view, setView] = useState<AppView>('landing');
  const [guestVault, setGuestVault] = useState<PublicVaultSnapshot | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [inboxOpen, setInboxOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ update: boolean; version?: string; changelog?: string[] } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Path-based vault URL or session restore on load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = getBootSession();
      const shared = await resolveVaultFromUrlAsync();
      if (cancelled) return;

      // Owner visiting their own share URL → full app, not guest view
      if (shared && session.userId && session.isActivated && session.shareCode) {
        if (shared.shareCode.toUpperCase() === session.shareCode.toUpperCase()) {
          goHomeUrl();
          setView(session.onboarded ? 'profile' : 'onboarding');
          return;
        }
      }

      if (shared) {
        setGuestVault(shared);
        setView('guest');
        return;
      }

      if (session.userId && session.isActivated) {
        setView(session.onboarded ? 'profile' : 'onboarding');
        return;
      }

      // No valid activated session → landing (signup / login), not activation screen
      setView('landing');
    })();

    return () => { cancelled = true; };
  }, []);

  // Check for updates on mount
  useEffect(() => {
    const res = s.checkVersion();
    if (res.update) {
      setUpdateInfo(res);
    }
  }, [s]);

  const handleDismissUpdate = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      s.dismissUpdate();
      setUpdateInfo(null);
      setIsUpgrading(false);
    }, 2500);
  };

  const handleAuth = async (mode: AuthMode, data: { username?: string; email?: string; password: string; discord?: string }) => {
    if (mode === 'signup') {
      return await s.signup(data.username || '', data.email, data.password, data.discord);
    }
    const loginId = (data.email || data.username || data.discord || '').trim();
    const res = await s.login(loginId, data.password);
    if (res.ok) {
      goHomeUrl();
      if (res.isActivated) {
        setView(res.onboarded ? 'profile' : 'onboarding');
      } else {
        setAuthMode('activate');
        setView('auth');
      }
    } else {
      setAuthMode('login');
    }
    return res;
  };

  const handleLogout = () => {
    s.logout();
    goHomeUrl();
    setView('landing');
  };

  const handleClearStuckData = useCallback(async () => {
    if (!window.confirm(
      'This clears all LinkVault data saved in THIS browser only (accounts, login session, cached server copy). ' +
      'Your account on the live server is NOT deleted. Continue?',
    )) return;
    await s.wipeAllData();
    goHomeUrl();
    window.location.reload();
  }, [s]);

  const goToAuth = useCallback((mode: AuthMode) => {
    setGuestVault(null);
    goHomeUrl();
    setAuthMode(mode);
    setView('auth');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    await s.deleteAccount();
    goHomeUrl();
    setAuthMode('login');
    setView('landing');
    window.location.reload();
  }, [s]);

  const handleOnboardComplete = () => {
    s.setProfile({ onboarded: true });
    goHomeUrl();
    setView('profile');
  };

  const ownerVaultUrl = s.currentAccount?.shareCode
    ? buildVaultShareUrl(s.currentAccount.shareCode)
    : undefined;

  const showFAB = (view === 'profile' || view === 'dashboard') && s.isLoggedIn && (s.isActivated || s.currentUser === 'demo-user');

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="land" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Landing
              onGetStarted={() => { setAuthMode('signup'); setView('auth'); }}
              onLogin={() => { setAuthMode('login'); setView('auth'); }}
              onTryDemo={() => { s.loadDemo(); setView('profile'); }}
              onClearStuckData={handleClearStuckData}
            />
          </motion.div>
        )}
        {view === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Auth 
              onAuth={handleAuth} 
              onActivate={async (code) => {
                const res = await s.activateAccount(code);
                if (res.ok) {
                  goHomeUrl();
                  setView(res.onboarded ? 'profile' : 'onboarding');
                }
                return res;
              }}
              onReset={async (user, key, pass) => s.resetPassword(user, key, pass)}
              onBack={() => {
                if (s.currentAccount && !s.currentAccount.isActivated) s.abandonUnactivatedSession();
                goHomeUrl();
                setView('landing');
              }}
              initialMode={authMode}
              currentAccount={s.currentAccount}
            />
          </motion.div>
        )}
        {view === 'onboarding' && <motion.div key="onboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="min-h-screen bg-black" /><Onboarding onComplete={handleOnboardComplete} /></motion.div>}
        {view === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfilePage 
              profile={s.profile} 
              links={s.links} 
              settings={s.settings} 
              onClickLink={s.clickLink} 
              onRecordView={s.recordView} 
              isDemo={s.currentUser === 'demo-user'}
              onGoHome={() => { goHomeUrl(); setView('landing'); }}
              onEngage={(t, id, a) => s.engageItem(t, id, a)}
              vaultShareUrl={ownerVaultUrl}
              vaultShareCode={s.currentAccount?.shareCode}
            />
          </motion.div>
        )}
        {view === 'guest' && guestVault && (
          <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfilePage
              profile={guestVault.profile}
              links={guestVault.links}
              settings={{ ...s.settings, ...guestVault.settings, enableInbox: false, animationsEnabled: true, compactMode: false, stealthMode: true }}
              onClickLink={() => {}}
              onEngage={() => {}}
              onGoHome={() => { setGuestVault(null); goHomeUrl(); setView('landing'); }}
              vaultShareUrl={buildVaultShareUrl(guestVault.shareCode)}
              vaultShareCode={guestVault.shareCode}
            />
            <GuestAuthPromo
              onSignUp={() => goToAuth('signup')}
              onLogin={() => goToAuth('login')}
            />
          </motion.div>
        )}
        {view === 'dashboard' && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard 
              links={s.links} 
              profile={s.profile} 
              settings={s.settings} 
              analytics={s.analytics}
              currentAccount={s.currentAccount}
              hasVip={s.hasVip}
              onAddLink={s.addLink} 
              onRemoveLink={s.removeLink} 
              onToggleLink={s.toggleLink} 
              onUpdateLink={s.updateLink} 
              onReorderLinks={s.reorderLinks} 
              onUpdateProfile={s.setProfile} 
              onUpdateSettings={s.setSettings} 
              onDeleteAccount={handleDeleteAccount} 
              onAddMusic={s.addMusic} 
              onRemoveMusic={s.removeMusic} 
              onAddArtwork={s.addArtwork}
              onRemoveArtwork={s.removeArtwork}
              onAdminCommand={(c) => s.runAdminCommand(c)}
              onGoHome={() => setView('profile')}
              onBadgeRequest={(b) => s.sendBadgeRequest(b)}
              onApplyBadge={(c) => s.applyBadgeCode(c)}
              onResetAnalyticsViews={s.resetAnalyticsViews}
              onResetAnalyticsClicks={s.resetAnalyticsClicks}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      {showFAB && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setView(v => v === 'profile' ? 'dashboard' : 'profile')}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow">
            <span className="text-xl">{view === 'profile' ? '📊' : '👁️'}</span>
          </motion.button>
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setInboxOpen(true)}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#0f0d1a] text-white shadow-xl hover:shadow-2xl transition-shadow">
            <span className="text-lg">📬</span>
            {s.unreadCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-black">{s.unreadCount}</motion.span>}
          </motion.button>
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={() => setControlOpen(true)}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#0f0d1a] text-white shadow-xl hover:shadow-2xl transition-shadow">
            <span className="text-lg">⚙️</span>
          </motion.button>
        </div>
      )}

      {/* Panels */}
      <InboxPanel 
        isOpen={inboxOpen} 
        onClose={() => setInboxOpen(false)} 
        messages={s.inbox} 
        chatMessages={s.profile.chatMessages}
        communityMembers={s.communityMembers}
        onMarkRead={s.markRead} 
        onMarkAllRead={s.markAllRead} 
        onDelete={s.deleteMessage} 
        onSendChat={s.sendChatMessage}
        onSendSupport={(d) => s.sendSupportTicket({ username: s.profile.username, discord: s.currentAccount?.discord, ...d })}
      />
      <ControlPanel isOpen={controlOpen} onClose={() => setControlOpen(false)} currentUserId={s.currentUser} profile={s.profile} settings={s.settings} onUpdateProfile={s.setProfile} onUpdateSettings={s.setSettings} onResetAll={s.resetAll} onDeleteAccount={handleDeleteAccount} onSwitchView={setView} onLogout={handleLogout} />

      {/* Upgrade Overlay */}
      <AnimatePresence>
        {isUpgrading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="flex justify-around w-full">{Array.from({ length: 20 }).map((_, i) => (
                <motion.div key={i} animate={{ y: ['-100%', '100%'] }} transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: 'linear', delay: Math.random() }} className="text-purple-500 font-mono text-xs whitespace-nowrap">{Array.from({ length: 50 }).map(() => Math.floor(Math.random() * 2)).join('')}</motion.div>
              ))}</div>
            </div>
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="relative z-10 flex flex-col items-center">
              <Zap className="w-20 h-20 text-purple-400 mb-6 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" fill="currentColor" />
              <h2 className="text-3xl font-black text-white tracking-[0.5em] uppercase text-center">Updating Matrix</h2>
              <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="w-full h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,1)]" /></div>
              <p className="mt-4 text-[10px] font-black text-purple-400/60 uppercase tracking-[0.3em]">Synchronizing Protocols...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {updateInfo && !isUpgrading && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 z-[70]">
            <div className="bg-[#111] border border-purple-500/20 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6"><div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center"><Zap className="w-7 h-7 text-white fill-white" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 animate-pulse">⚡ Upgrade Detected</p><h3 className="text-xl font-black text-white">V{updateInfo.version}</h3></div></div>
              <div className="space-y-3 mb-8 bg-black/20 p-4 rounded-2xl border border-white/5">{updateInfo.changelog?.map((item, i) => (<div key={i} className="flex gap-3 text-[11px] font-bold text-white/50 uppercase"><span className="text-purple-500">◈</span><p>{item}</p></div>))}</div>
              <button onClick={handleDismissUpdate} className="w-full py-5 rounded-[1.75rem] bg-gradient-to-r from-white via-white to-white/80 text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:from-purple-600 hover:to-fuchsia-600 hover:text-white transition-all duration-500">Initialize Upgrade 🚀</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
