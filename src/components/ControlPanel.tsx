import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, RotateCcw, Download, Upload, Palette, Eye, Sparkles, LogOut, Bitcoin, AlertTriangle, ShieldOff, Shield } from 'lucide-react';
import type { UserProfile, ThemeId, AppView, AppSettings } from '../types';
import { THEMES } from '../store';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
  profile: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (u: Partial<UserProfile>) => void;
  onUpdateSettings: (u: Partial<AppSettings>) => void;
  onResetAll: () => void;
  onDeleteAccount: () => void;
  onSwitchView: (v: AppView) => void;
  onLogout: () => void;
}

export default function ControlPanel({ isOpen, onClose, currentUserId, profile, settings, onUpdateProfile, onUpdateSettings, onResetAll, onDeleteAccount, onSwitchView, onLogout }: ControlPanelProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dragControls = useDragControls();

  const handleExport = () => {
    if (!currentUserId) return;
    const data: Record<string, string | null> = {};
    ['lv_links', 'lv_profile', 'lv_inbox', 'lv_settings', 'lv_analytics'].forEach(k => {
      data[k] = localStorage.getItem(`${k}:${currentUserId}`);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `linkvault-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!currentUserId) return;
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          Object.entries(d).forEach(([k, v]) => { if (v) localStorage.setItem(`${k}:${currentUserId}`, v as string); });
          window.location.reload();
        } catch { alert('Invalid backup file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    onResetAll(); setConfirmReset(false); onClose();
  };

  const handleConfirmDelete = () => {
    onDeleteAccount();
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="relative w-full max-w-sm rounded-[3rem] border border-white/10 bg-[#0a0a0f] p-10 shadow-2xl max-h-[85vh] overflow-y-auto pointer-events-auto backdrop-blur-3xl"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div 
              onPointerDown={e => dragControls.start(e)}
              className="absolute inset-x-0 top-0 h-12 cursor-grab active:cursor-grabbing z-10"
            />

            <button onClick={onClose} className="absolute right-8 top-8 rounded-full p-2 text-white/20 hover:text-white transition-colors z-20">
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-10">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-500/20 border border-purple-500/20 flex items-center justify-center text-3xl shadow-2xl">⚙️</div>
              <h3 className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: 'Orbitron' }}>Core Console</h3>
              <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mt-2">v1.0.0 Stable</p>
            </div>

            <div className="space-y-6">
              {/* Theme Switcher */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-white/30 mb-3 uppercase tracking-widest">
                  <Palette className="h-3.5 w-3.5" /> Matrix Theme
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => onUpdateProfile({ theme: t.id as ThemeId })}
                      className={`rounded-xl p-2 text-[9px] font-black border transition-all text-left uppercase tracking-tighter ${
                        profile.theme === t.id
                          ? 'bg-white text-black border-white shadow-xl'
                          : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'
                      }`}>
                      <span className="text-sm block mb-1">{t.emoji}</span> {t.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-white/30 mb-3 uppercase tracking-widest">
                  <Eye className="h-3.5 w-3.5" /> Presence Controls
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => { onSwitchView('profile'); onClose(); }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 text-[10px] font-black uppercase text-white/40 hover:bg-white/[0.06] hover:text-white transition-all tracking-widest">
                    <Sparkles className="h-3.5 w-3.5" /> My Page
                  </button>
                  <button onClick={() => { onSwitchView('dashboard'); onClose(); }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 text-[10px] font-black uppercase text-white/40 hover:bg-white/[0.06] hover:text-white transition-all tracking-widest">
                    <Bitcoin className="h-3.5 w-3.5" /> Dashboard
                  </button>
                </div>
                
                <button 
                  onClick={() => onUpdateSettings({ stealthMode: !settings.stealthMode })}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.stealthMode ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    {settings.stealthMode ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Stealth Mode</p>
                      <p className="text-[8px] opacity-60 uppercase font-bold">{settings.stealthMode ? 'Hidden from Community' : 'Visible in Community'}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.stealthMode ? 'bg-purple-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.stealthMode ? 'left-[1.125rem]' : 'left-0.5'}`} />
                  </div>
                </button>
                <p className="px-2 mt-2 text-[7px] text-white/10 uppercase font-bold tracking-widest">Automatically enabled for your security.</p>
              </div>

              {/* Data */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-white/30 mb-3 uppercase tracking-widest">
                  <Download className="h-3.5 w-3.5" /> Sync Data
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExport}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/10 p-4 text-[10px] font-black uppercase text-emerald-400/60 hover:bg-emerald-500/10 transition-all tracking-widest">
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                  <button onClick={handleImport}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500/[0.05] border border-blue-500/10 p-4 text-[10px] font-black uppercase text-blue-400/60 hover:bg-blue-500/10 transition-all tracking-widest">
                    <Upload className="h-3.5 w-3.5" /> Import
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 text-[10px] font-black uppercase text-white/30 hover:bg-white/[0.06] hover:text-white transition-all tracking-widest">
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>

              <div className="flex gap-2">
                {/* Reset */}
                <button onClick={handleReset}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border p-4 text-[9px] font-black uppercase tracking-widest transition-all ${
                    confirmReset
                      ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                      : 'bg-white/[0.02] border-white/[0.08] text-white/20 hover:text-red-400'
                  }`}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {confirmReset ? 'Sure?' : 'Reset'}
                </button>

                {/* Delete Account */}
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-500/[0.05] border border-red-500/10 p-4 text-[9px] font-black uppercase tracking-widest text-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all">
                  <AlertTriangle className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Delete Account Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center rounded-[3rem] bg-black/80 backdrop-blur-sm p-6"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full rounded-3xl border border-red-500/20 bg-[#0f0a0a] p-6 text-center shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="h-7 w-7 text-red-400" />
                    </div>
                    <h4 className="text-lg font-black text-white mb-2">Delete Account?</h4>
                    <p className="text-xs text-white/50 mb-6 leading-relaxed">
                      Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="flex-1 rounded-2xl bg-red-500/20 border border-red-500/30 py-3.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
