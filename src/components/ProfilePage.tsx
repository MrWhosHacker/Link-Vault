import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle2, Send, Download, ExternalLink, Home, Play, Pause, Disc, Image as ImageIcon, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Heart, Maximize2, Smartphone, Copy } from 'lucide-react';
import ShareProfileQR from './ShareProfileQR';
import { QRCodeSVG } from 'qrcode.react';
import { LinkIcon, PayProviderIcon, ZbdIcon } from './BrandIcon';
import type { LinkItem, UserProfile, AppSettings, MusicItem } from '../types';
import { getMusicPlatform, resolveMusicPlatform } from '../presets';
import { getAudioSrc, getEmbedUrl, getEmbedHeight, getPlaybackMode } from '../musicPlayback';
import { getTheme, BADGE_METADATA } from '../store';
import { dismissOverlay, isDismissed } from '../dismissStorage';
import {
  buildBolt11PayUri,
  buildLightningPayUri,
  buildPayComment,
  buildWalletOpenUrl,
  buildZbdOpenUrl,
  fetchLightningInvoice,
  isMobileDevice,
  openExternalUrl,
  openInWalletApp,
  resolvePayMethod,
  resolveLightningAddress,
  type LightningPayOptions,
  type PayMethod,
} from '../lightningPay';

interface Props { profile: UserProfile; links: LinkItem[]; settings: AppSettings; onClickLink: (id: string) => void; onRecordView?: () => void; isDemo?: boolean; onGoHome?: () => void; onEngage: (type: 'link' | 'music' | 'artwork', id: string, action: 'like' | 'dislike' | 'favorite' | 'zap') => void; vaultShareUrl?: string; vaultShareCode?: string; }

const DEMO_BANNER_KEY = 'demo-node-banner';

export default function ProfilePage({ profile, links, settings, onClickLink, onRecordView, isDemo, onGoHome, onEngage, vaultShareUrl, vaultShareCode }: Props) {
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(() => isDismissed(DEMO_BANNER_KEY));
  const [paymentMode, setPaymentMode] = useState<'tip' | 'send' | 'request' | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [feedExpanded, setFeedExpanded] = useState(() => profile.music.length > 0);
  const [artExpanded, setArtExpanded] = useState(false);
  const [fullscreenArtId, setFullscreenArtId] = useState<string | null>(null);
  const theme = getTheme(profile.theme);
  const enabled = links.filter(l => l.enabled);
  const hasTip = (settings.enableZBD && !!profile.zbdGamerTag) || (settings.enableAlby && !!profile.albyAddress);
  const tipProvider: 'zbd' | 'alby' = settings.enableZBD && profile.zbdGamerTag ? 'zbd' : 'alby';

  const fullscreenArt = useMemo(() => 
    profile.artworks.find(a => a.id === fullscreenArtId) || null, 
  [profile.artworks, fullscreenArtId]);

  useEffect(() => { onRecordView?.(); }, []);

  const avatarSrc = (profile.avatarType === 'image' || profile.avatarType === 'url') && profile.avatarUrl ? profile.avatarUrl : null;

  const particles = useMemo(() => settings.particleEffects ? Array.from({ length: 50 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, s: 1.5 + Math.random() * 3, d: Math.random() * 5, dur: 5 + Math.random() * 15 })) : [], [settings.particleEffects]);

  const liveSymbols = useMemo(() => {
    if (!settings.particleEffects) return [];
    const color = theme.particleColor || `rgb(${theme.accentRgb})`;
    if (theme.liveEffect === 'coins') return Array.from({ length: 18 }, (_, i) => ({ id: i, x: Math.random() * 100, y: -10, d: Math.random() * 5, sym: '₿', size: 15 + Math.random() * 30, color }));
    if (theme.liveEffect === 'bolts') return Array.from({ length: 15 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, d: Math.random() * 3, sym: '⚡', size: 20 + Math.random() * 30, color }));
    if (theme.liveEffect === 'stars') return Array.from({ length: 60 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, d: Math.random() * 5, sym: '✦', size: 4 + Math.random() * 12, color }));
    if (theme.liveEffect === 'rain') return Array.from({ length: 30 }, (_, i) => ({ id: i, x: Math.random() * 100, y: -20, d: Math.random() * 2, sym: '01', size: 10 + Math.random() * 10, color }));
    if (theme.liveEffect === 'fire') return Array.from({ length: 25 }, (_, i) => ({ id: i, x: 20 + Math.random() * 60, y: 100, d: Math.random() * 3, sym: '🔥', size: 15 + Math.random() * 20, color }));
    if (theme.liveEffect === 'snow') return Array.from({ length: 40 }, (_, i) => ({ id: i, x: Math.random() * 100, y: -10, d: Math.random() * 5, sym: '❄', size: 10 + Math.random() * 20, color }));
    if (theme.liveEffect === 'bubbles') return Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, y: 110, d: Math.random() * 5, sym: '○', size: 10 + Math.random() * 40, color }));
    if (theme.liveEffect === 'petals') return Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, y: -10, d: Math.random() * 5, sym: '🌸', size: 15 + Math.random() * 20, color }));
    return [];
  }, [theme, settings.particleEffects]);

  const handleClick = (l: LinkItem) => { onClickLink(l.id); window.open(l.url, '_blank', 'noopener,noreferrer'); };

  const handleMusicToggle = useCallback((trackId: string) => {
    setFeedExpanded(true);
    setPlaying(prev => (prev === trackId ? null : trackId));
  }, []);

  const handleDismissDemoBanner = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissOverlay(DEMO_BANNER_KEY);
    setDemoBannerDismissed(true);
  }, []);

  const nowPlaying = useMemo(
    () => (playing ? profile.music.find(m => m.id === playing) ?? null : null),
    [playing, profile.music],
  );

  return (
    <div className={`min-h-screen bg-[#050508] bg-gradient-to-br ${theme.bg} text-white relative overflow-hidden font-sans selection:bg-white/20`}>
      {/* --- UHD AMBIENT --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[800px] h-[800px] rounded-full blur-[160px] opacity-70 animate-pulse mix-blend-screen" style={{ background: `radial-gradient(circle, rgba(${theme.accentRgb}, 0.4) 0%, transparent 80%)` }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full blur-[140px] opacity-60 mix-blend-screen" style={{ background: `radial-gradient(circle, rgba(${theme.accentRgb}, 0.3) 0%, transparent 80%)` }} />
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `linear-gradient(rgba(${theme.accentRgb},0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(${theme.accentRgb},0.4) 1px, transparent 1px)`, backgroundSize: '100px 100px', transform: 'perspective(1000px) rotateX(20deg) scale(1.5)', transformOrigin: 'top center' }} />
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, backgroundColor: theme.particleColor, boxShadow: `0 0 20px 2px ${theme.particleColor}`, opacity: 0.6 }} animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.8, 1], y: [0, -150, 0] }} transition={{ duration: p.dur, repeat: Infinity, delay: p.d, ease: 'easeInOut' }} />
        ))}
        {liveSymbols.map(s => (
          <motion.div key={s.id} className="absolute font-black select-none whitespace-nowrap" style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, color: s.color, opacity: 0.4, filter: `drop-shadow(0 0 15px ${s.color})` }} animate={['coins', 'snow', 'petals', 'rain'].includes(theme.liveEffect) ? { y: ['0vh', '110vh'], rotate: 720 } : { opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] }} transition={{ duration: theme.liveEffect === 'bolts' ? 0.6 : 7 + Math.random() * 7, repeat: Infinity, delay: s.d, ease: "linear" }} >{s.sym}</motion.div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-6 py-16 flex flex-col items-center">
        {isDemo && (
          <div className="fixed top-6 left-6 flex flex-col gap-2 z-[80] items-start pointer-events-auto">
            <motion.button type="button" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={onGoHome} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-white hover:bg-white/20 transition-all uppercase tracking-[0.2em] shadow-xl backdrop-blur-xl"><Home className="w-3.5 h-3.5" /> Home</motion.button>
            <AnimatePresence>
              {!demoBannerDismissed && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative bg-orange-500/20 border border-orange-500/30 p-5 pt-10 rounded-3xl max-w-[220px] text-left backdrop-blur-md shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={handleDismissDemoBanner}
                    onPointerDown={e => e.stopPropagation()}
                    className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    aria-label="Dismiss demo notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3 fill-current" /> Demo Node Active</p>
                  <p className="text-[10px] text-white/90 leading-relaxed font-black uppercase tracking-tight">Tipping is enabled and fully functional. Anything is appreciated! ✨</p>
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <p className="text-[9px] text-white/40 font-bold uppercase">Registration Problems?</p>
                    <p className="text-[8px] text-white/60 leading-tight uppercase font-black">
                      Click <span className="text-purple-400">📬 Hub</span> → <span className="text-purple-400">Support</span> to report bugs. Include your Discord/Email for a reply!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Avatar */}
        <div className="relative mb-4 group scale-110">
          <motion.div className="w-40 h-40 rounded-full p-[5px] animate-spin-slow shadow-[0_0_50px_rgba(0,0,0,0.8)]" style={{ backgroundImage: `conic-gradient(from 0deg, rgba(${theme.accentRgb}, 1), transparent 40%, rgba(${theme.accentRgb}, 0.6), transparent 70%, rgba(${theme.accentRgb}, 1))` }}><div className="w-full h-full rounded-full bg-[#080810]" /></motion.div>
          <div className="absolute inset-0 flex items-center justify-center"><div className="w-36 h-36 rounded-full bg-[#151520] flex items-center justify-center text-6xl font-black text-white/90 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden relative">{avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : profile.avatarEmoji || 'V'}{playing && <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[6px] border-dotted opacity-40" style={{ borderColor: `rgb(${theme.accentRgb})` }} />}</div></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-green-500 rounded-full border-[6px] border-[#080810] shadow-[0_0_25px_rgba(34,197,94,0.8)]" />
        </div>

        {profile.showQR && vaultShareUrl && (
          <div className="mb-8 flex flex-col items-center">
            <ShareProfileQR
              shareUrl={vaultShareUrl}
              shareCode={vaultShareCode}
              accentRgb={theme.accentRgb}
              variant="compact"
            />
          </div>
        )}

        {/* Identity */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl">{profile.displayName}</h1>
            {profile.isVerified && <CheckCircle2 className="w-7 h-7 text-blue-400 fill-blue-400/10 filter drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" />}
          </div>
          {profile.badges.length > 0 && <div className="flex flex-wrap justify-center gap-1.5 mt-1">{profile.badges.map(t => { const b = BADGE_METADATA[t]; return b ? <div key={b.type} className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${b.color} text-[8px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md`}><span>{b.icon}</span>{b.label}</div> : null; })}</div>}
        </div>
        <p className="text-white/40 text-[10px] font-black tracking-[0.5em] mb-10 uppercase">@{profile.username}</p>
        <p className="text-center text-white/90 text-sm font-bold max-w-md mb-12 leading-relaxed whitespace-pre-line drop-shadow-md">{profile.bio}</p>

        {/* TIP CARD */}
        {hasTip && (
          <div className="w-full mb-12 text-left">
            <div className="rounded-[3.5rem] bg-white/[0.05] border border-white/[0.12] p-10 backdrop-blur-3xl relative group overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
              <div className="absolute -top-32 -right-32 w-64 h-64 opacity-20 blur-[80px] transition-all duration-700 group-hover:opacity-40" style={{ background: `rgb(${theme.accentRgb})` }} />
              <div className="flex items-center gap-6 mb-12"><div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105" style={{ background: `linear-gradient(135deg, rgb(${theme.accentRgb}), #000)`, boxShadow: `0 15px 40px rgba(${theme.accentRgb}, 0.4)` }}><PayProviderIcon method={tipProvider} size={40} /></div><div><h3 className="text-2xl font-black tracking-tight text-white uppercase">{tipProvider === 'zbd' ? 'ZBD Lightning' : 'Alby Lightning'}</h3><p className="text-[10px] text-white/40 font-black tracking-widest uppercase mt-1">{profile.zbdGamerTag ? `${profile.zbdGamerTag}@zbd.gg` : profile.albyAddress}</p></div></div>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setPaymentMode('tip')} className="flex flex-col items-center justify-center gap-4 py-8 rounded-[2.5rem] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/20 transition-all group/btn shadow-inner"><Zap className="w-8 h-8 text-orange-400 fill-orange-400 group-hover/btn:scale-110 transition-all" /><span className="text-[11px] font-black uppercase tracking-widest text-orange-400">Tip</span></button>
                <button onClick={() => setPaymentMode('send')} className="flex flex-col items-center justify-center gap-4 py-8 rounded-[2.5rem] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-cyan-400/30 transition-all group/btn shadow-inner"><Send className="w-8 h-8 text-cyan-400 group-hover/btn:scale-110 transition-all" /><span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">Send</span></button>
                <button onClick={() => setPaymentMode('request')} className="flex flex-col items-center justify-center gap-4 py-8 rounded-[2.5rem] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-green-400/30 transition-all group/btn shadow-inner"><Download className="w-8 h-8 text-green-400 group-hover/btn:scale-110 transition-all" /><span className="text-[11px] font-black uppercase tracking-widest text-green-400">Req</span></button>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO FEED */}
        {profile.music.length > 0 && (
          <div className="w-full mb-6">
            <button onClick={() => setFeedExpanded(!feedExpanded)} className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] ${feedExpanded ? 'rounded-b-none border-b-0 bg-white/[0.06]' : 'bg-white/[0.03]'} border border-white/[0.08] transition-all group shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-5 min-w-0">
                <Disc className={`w-6 h-6 shrink-0 ${playing ? 'animate-spin text-white' : 'text-white/50'}`} />
                <div className="text-left min-w-0">
                  <p className="text-white/50 uppercase tracking-[0.5em] font-black text-[10px]">Live Audio Feed</p>
                  {nowPlaying && !feedExpanded && (
                    <p className="text-[10px] font-black text-white/70 truncate mt-1 normal-case tracking-normal">Now playing: {nowPlaying.title}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">{profile.music.length} track{profile.music.length !== 1 ? 's' : ''}</span>
                {feedExpanded ? <ChevronUp className="w-6 h-6 text-white/30" /> : <ChevronDown className="w-6 h-6 text-white/30 group-hover:text-white/60" />}
              </div>
            </button>
            <AnimatePresence>
              {feedExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.04] border-x border-b border-white/[0.08] rounded-b-[2.5rem] shadow-2xl backdrop-blur-3xl">
                  <div className="p-6 space-y-4">
                    {profile.music.map(m => (
                      <MusicFeedItem
                        key={m.id}
                        track={m}
                        isPlaying={playing === m.id}
                        onToggle={() => handleMusicToggle(m.id)}
                        theme={theme}
                        onEngage={onEngage}
                        onTip={() => setPaymentMode('tip')}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ART MATRIX */}
        {profile.artworks.length > 0 && (
          <div className="w-full mb-16">
            <button onClick={() => setArtExpanded(!artExpanded)} className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] ${artExpanded ? 'rounded-b-none border-b-0 bg-white/[0.06]' : 'bg-white/[0.03]'} border border-white/[0.08] transition-all group shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center gap-5 text-white/50 uppercase tracking-[0.5em] font-black text-[10px]"><ImageIcon className="w-6 h-6" />Art Matrix</div>
              {artExpanded ? <ChevronUp className="w-6 h-6 text-white/30" /> : <ChevronDown className="w-6 h-6 text-white/30 group-hover:text-white/60" />}
            </button>
            <AnimatePresence>
              {artExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.04] border-x border-b border-white/[0.08] rounded-b-[2.5rem] shadow-2xl backdrop-blur-3xl">
                  <div className="p-8 grid grid-cols-2 gap-6">
                    {profile.artworks.slice(0, 10).map((art, i) => (
                      <motion.div key={art.id} whileHover={{ y: -8, scale: 1.05 }} onClick={() => setFullscreenArtId(art.id)} className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 group bg-black/40 shadow-2xl transition-all duration-500 cursor-zoom-in">
                        <img src={art.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4 text-white" /></div>
                        <div className="absolute bottom-6 left-6 right-6"><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Index_{i+1}</p><p className="text-[11px] font-black text-white uppercase truncate tracking-tight drop-shadow-2xl">{art.title}</p></div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* LINKS */}
        <div className="w-full flex flex-wrap justify-center gap-4 mb-24">
          {enabled.map(l => (
            <button key={l.id} onClick={() => handleClick(l)} className="flex items-center gap-4 px-9 py-4.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.1] hover:border-white/30 hover:scale-105 transition-all text-[11px] font-black uppercase tracking-widest text-white group shadow-2xl backdrop-blur-2xl">
              <LinkIcon link={l} size={24} className="group-hover:rotate-12 transition-transform duration-300" />{l.title}
            </button>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="mt-24 pb-20 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="inline-flex flex-col items-center gap-5">
            <div className="h-[1px] w-12 bg-white/10" /><span className="text-[9px] font-black tracking-[0.6em] uppercase text-white/10 font-sans">Authorized Protocol v01</span>
            <div className="relative group cursor-pointer"><div className="absolute -inset-10 bg-gradient-to-r from-purple-600/30 via-fuchsia-600/30 to-blue-600/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000 scale-150"></div><span className="relative text-xl font-black tracking-tighter text-white/30 group-hover:text-white transition-all duration-700">╰┈➤⚡<span className="text-purple-500 group-hover:text-purple-400">𝕄𝕣𝕎𝕙𝕠</span>?.𝔸𝕀⚡</span></div>
          </motion.div>
        </footer>
      </div>

      {/* FULLSCREEN ART VIEWER */}
      <AnimatePresence>
        {fullscreenArt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col p-6" onClick={() => setFullscreenArtId(null)}>
            <div className="flex justify-between items-center mb-8">
              <div className="text-left"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Matrix Artwork</p><h2 className="text-2xl font-black text-white">{fullscreenArt.title}</h2></div>
              <button onClick={() => setFullscreenArtId(null)} className="p-4 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4"><motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={fullscreenArt.url} className="max-w-full max-h-[70vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 object-contain" onClick={e => e.stopPropagation()} /></div>
            <div className="mt-auto flex flex-col items-center gap-8 pb-12">
              <div className="flex items-center gap-12">
                <button onClick={e => { e.stopPropagation(); onEngage('artwork', fullscreenArt.id, 'like'); }} className="flex flex-col items-center gap-2 group"><ThumbsUp className="w-8 h-8 text-white/20 group-hover:text-green-400 transition-colors" /><span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{fullscreenArt.likes}</span></button>
                <button onClick={e => { e.stopPropagation(); onEngage('artwork', fullscreenArt.id, 'dislike'); }} className="flex flex-col items-center gap-2 group"><ThumbsDown className="w-8 h-8 text-white/20 group-hover:text-red-400 transition-colors" /><span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{fullscreenArt.dislikes}</span></button>
                <button onClick={e => { e.stopPropagation(); onEngage('artwork', fullscreenArt.id, 'favorite'); }} className="flex flex-col items-center gap-2 group"><Heart className="w-8 h-8 text-white/20 group-hover:text-pink-400 transition-colors" /><span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{fullscreenArt.favorites}</span></button>
                <button onClick={e => { e.stopPropagation(); onEngage('artwork', fullscreenArt.id, 'zap'); setPaymentMode('tip'); }} className="flex flex-col items-center gap-2 group"><Zap className="w-8 h-8 text-white/20 group-hover:text-orange-400 transition-colors" /><span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{fullscreenArt.zaps}</span></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentModal mode={paymentMode} onClose={() => setPaymentMode(null)} profile={profile} settings={settings} theme={theme} />
    </div>
  );
}

function MusicFeedItem({ track: m, isPlaying, onToggle, theme, onEngage, onTip }: {
  track: MusicItem;
  isPlaying: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof getTheme>;
  onEngage: Props['onEngage'];
  onTip: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [embedFailed, setEmbedFailed] = useState(false);
  const platform = resolveMusicPlatform(m);
  const platformMeta = getMusicPlatform(platform);
  const audioSrc = getAudioSrc(m);
  const playbackMode = getPlaybackMode(m);
  const embedUrl = isPlaying ? getEmbedUrl(m, true) : null;

  const externalUrl = m.url?.startsWith('http') ? m.url : (m.fileData?.startsWith('data:') ? undefined : m.url);

  const handlePlayClick = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      onToggle();
      return;
    }
    setEmbedFailed(false);
    onToggle();
  };

  useEffect(() => {
    if (!isPlaying) {
      audioRef.current?.pause();
      return;
    }
    if (audioSrc && audioRef.current) {
      const el = audioRef.current;
      el.currentTime = 0;
      void el.play().catch(() => setEmbedFailed(true));
    }
  }, [isPlaying, audioSrc, m.id]);

  const showPlayer = isPlaying && (playbackMode === 'audio' || playbackMode === 'embed');

  return (
    <div className={`w-full rounded-[2rem] border transition-all duration-500 ${isPlaying ? 'border-white/30 bg-white/[0.1] shadow-2xl' : 'border-white/5 bg-black/20 hover:bg-white/5'}`}>
      <div className="p-6">
        <div className="flex items-center gap-6">
          <button type="button" onClick={handlePlayClick} aria-label={isPlaying ? 'Pause' : 'Play'} className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 ${isPlaying ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-1" />}
          </button>
          <button type="button" onClick={handlePlayClick} className="flex-1 text-left min-w-0">
            <p className={`text-base font-black truncate ${isPlaying ? 'text-white' : 'text-white/60'}`}>{m.title}</p>
            <div className="flex items-center gap-3 mt-1.5 font-black text-[9px] uppercase tracking-widest text-white/30">
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{platformMeta?.label ?? platform}</span>
              {isPlaying && (
                <>
                  <span className="text-green-400/80 normal-case tracking-normal">Playing</span>
                  <div className="flex gap-1 h-3 items-end">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div key={i} animate={{ height: [4, 14, 4] }} transition={{ duration: 0.4 + i * 0.1, repeat: Infinity }} className="w-1 rounded-full" style={{ backgroundColor: `rgb(${theme.accentRgb})` }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </button>
        </div>

        {audioSrc && (
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            className={showPlayer && playbackMode === 'audio' && !embedFailed ? 'w-full h-10 mt-6 opacity-90' : 'hidden'}
            controls={showPlayer && playbackMode === 'audio' && !embedFailed}
            onError={() => setEmbedFailed(true)}
          />
        )}

        {showPlayer && playbackMode === 'embed' && embedUrl && !embedFailed && (
          <div className="mt-6 space-y-2">
            <iframe
              key={embedUrl}
              src={embedUrl}
              width="100%"
              height={getEmbedHeight(platform)}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="eager"
              className="rounded-2xl w-full border border-white/10 bg-black/40"
              title={m.title}
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <p className="text-center text-[8px] font-bold uppercase tracking-widest text-white/25">
              Tap play inside the player if audio does not start automatically
            </p>
          </div>
        )}

        {isPlaying && (embedFailed || playbackMode === 'external' || (!audioSrc && !embedUrl)) && (
          <div className="mt-6">
            <a
              href={externalUrl || m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Open on {platformMeta?.label ?? platform}
            </a>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); onEngage('music', m.id, 'like'); }} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/20 hover:text-green-400 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /> {m.likes}</button>
            <button onClick={(e) => { e.stopPropagation(); onEngage('music', m.id, 'dislike'); }} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/20 hover:text-red-400 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /> {m.dislikes}</button>
            <button onClick={(e) => { e.stopPropagation(); onEngage('music', m.id, 'favorite'); }} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/20 hover:text-pink-400 transition-colors"><Heart className="w-3.5 h-3.5" /> {m.favorites}</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEngage('music', m.id, 'zap'); onTip(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[8px] font-black uppercase text-orange-400 hover:bg-orange-500/20 transition-all"><Zap className="w-3 h-3 fill-current" /> Zap {m.zaps}</button>
            {(externalUrl || m.url) && (
              <button onClick={(e) => { e.stopPropagation(); window.open(externalUrl || m.url, '_blank', 'noopener,noreferrer'); }} className="p-2 text-white/10 hover:text-white"><ExternalLink className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ mode, onClose, profile, settings, theme }: { mode: 'tip' | 'send' | 'request' | null; onClose: () => void; profile: UserProfile; settings: AppSettings; theme: ReturnType<typeof getTheme> }) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<'form' | 'qr'>('form');
  const [paymentId, setPaymentId] = useState('');
  const [bolt11Invoice, setBolt11Invoice] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [copied, setCopied] = useState(false);
  const isOpen = mode !== null;
  const mobile = isMobileDevice();
  const payMethod: PayMethod = resolvePayMethod(settings.enableZBD, settings.enableAlby, profile.zbdGamerTag, profile.albyAddress) ?? 'alby';
  const presets = [100, 500, 1000, 5000, 10000, 21000];
  const payeeAddress = resolveLightningAddress({ method: payMethod, zbdGamerTag: profile.zbdGamerTag, albyAddress: profile.albyAddress });

  const titles = { tip: 'Direct Tip', send: 'Send Sats', request: 'Request Payment' };
  const subtitles = { tip: 'Support with any amount', send: 'Send Lightning to this vault', request: 'Scan to pay requested amount' };

  const payOpts = useMemo((): LightningPayOptions => ({
    method: payMethod,
    zbdGamerTag: profile.zbdGamerTag,
    albyAddress: profile.albyAddress,
    amountSats: Number(amount) || undefined,
    memo,
    mode: mode ?? 'tip',
    username: profile.username,
    paymentId: paymentId || undefined,
  }), [amount, memo, mode, profile, payMethod, paymentId]);

  const walletUrl = useMemo(
    () => (step === 'qr' && qrUri ? buildWalletOpenUrl(payOpts, bolt11Invoice || undefined) : ''),
    [payOpts, step, qrUri, bolt11Invoice],
  );
  const zbdOpenUrl = useMemo(
    () => (payMethod === 'zbd' && step === 'qr' && qrUri ? buildZbdOpenUrl(payOpts, bolt11Invoice || undefined) : ''),
    [payMethod, payOpts, step, qrUri, bolt11Invoice],
  );

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setAmount('');
      setMemo('');
      setPaymentId('');
      setBolt11Invoice('');
      setQrUri('');
      setQrLoading(false);
      setQrError('');
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerateQr = async () => {
    const sats = Number(amount);
    if (!sats || !payeeAddress || !mode) return;

    const id = `${mode}-${profile.username}-${Date.now()}`;
    const opts: LightningPayOptions = {
      method: payMethod,
      zbdGamerTag: profile.zbdGamerTag,
      albyAddress: profile.albyAddress,
      amountSats: sats,
      memo,
      mode,
      username: profile.username,
      paymentId: id,
    };

    setPaymentId(id);
    setStep('qr');
    setQrLoading(true);
    setQrError('');
    setBolt11Invoice('');
    setQrUri('');

    const comment = buildPayComment(opts);
    const fallbackUri = buildLightningPayUri(opts);

    try {
      const invoice = await fetchLightningInvoice(payeeAddress, sats, comment);
      setBolt11Invoice(invoice);
      setQrUri(buildBolt11PayUri(invoice));
    } catch {
      setQrError('Using address QR — tap Open in ZBD or scan with a Lightning wallet.');
      setQrUri(fallbackUri);
    } finally {
      setQrLoading(false);
    }
  };

  const handleOpenZbd = () => {
    if (!zbdOpenUrl) return;
    if (mobile) openInWalletApp(zbdOpenUrl);
    else openExternalUrl(zbdOpenUrl);
  };

  const handleCopyUri = async () => {
    if (!qrUri) return;
    try {
      await navigator.clipboard.writeText(qrUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {isOpen && mode && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="relative w-full max-w-md rounded-[4.5rem] border border-white/10 bg-[#0c0c12] p-12 shadow-[0_0_100px_rgba(0,0,0,1)]" initial={{ scale: 0.9, y: 60, rotate: -3 }} animate={{ scale: 1, y: 0, rotate: 0 }} exit={{ scale: 0.9, y: 60 }} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute right-12 top-12 rounded-full p-2 text-white/20 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
            <div className="text-center mb-12">
              <div className={`w-24 h-24 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-white/5`} style={{ background: `linear-gradient(135deg, rgb(${theme.accentRgb}), #000)`, boxShadow: `0 20px 60px rgba(${theme.accentRgb}, 0.5)` }}>
                {mode === 'send' ? <Send className="w-12 h-12 text-white" /> : mode === 'request' ? <Download className="w-12 h-12 text-white" /> : <PayProviderIcon method={payMethod} size={48} />}
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-2 text-white uppercase">{titles[mode]}</h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2"><PayProviderIcon method={payMethod} size={14} /> {subtitles[mode]} · {payMethod.toUpperCase()}</p>
              <p className="text-white/50 text-[10px] font-bold mt-2">@{profile.username} · {payeeAddress}</p>
            </div>
            {step === 'form' ? (
              <div className="space-y-8">
                <div>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] px-10 py-9 text-6xl font-black focus:border-white/40 outline-none transition-all text-center text-white placeholder:text-white/5" />
                  <div className="grid grid-cols-3 gap-3 mt-8">
                    {presets.map(p => <button key={p} type="button" onClick={() => setAmount(String(p))} className={`py-5 rounded-3xl text-xs font-black border transition-all ${amount === String(p) ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}>{p}</button>)}
                  </div>
                </div>
                {(mode === 'send' || mode === 'request') && (
                  <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder={mode === 'send' ? 'Memo (optional)' : 'What is this payment for?'} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-white/30" />
                )}
                <motion.button type="button" disabled={!amount} onClick={handleGenerateQr} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-8 rounded-[3rem] bg-white text-black font-black tracking-[0.3em] uppercase text-[11px] shadow-2xl disabled:opacity-5 transition-all">Generate Lightning QR</motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8">
                {qrLoading ? (
                  <div className="flex h-[300px] w-[300px] items-center justify-center rounded-[4rem] border border-white/10 bg-white/[0.03]">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Building QR…</p>
                  </div>
                ) : qrUri ? (
                  <div className="p-10 bg-white rounded-[4rem] shadow-[0_0_80px_rgba(255,255,255,0.2)] scale-110">
                    <QRCodeSVG value={qrUri} size={220} level="M" includeMargin />
                  </div>
                ) : null}
                {qrError && (
                  <p className="text-center text-[10px] font-bold text-amber-400/80 max-w-xs">{qrError}</p>
                )}
                <div className="text-center">
                  <p className="text-6xl font-black text-white tracking-tighter">{Number(amount).toLocaleString()}</p>
                  <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.5em] mt-3">Satoshis {mode === 'request' ? 'Requested' : mode === 'send' ? 'to Send' : 'Tipped'}</p>
                  {qrUri && (
                    <p className="text-[9px] text-white/20 font-mono mt-3 break-all max-w-xs mx-auto line-clamp-3">{qrUri}</p>
                  )}
                </div>
                {payMethod === 'zbd' && zbdOpenUrl && !qrLoading && (
                  <motion.button
                    type="button"
                    onClick={handleOpenZbd}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-6 rounded-[2.5rem] bg-[#8B5CF6] text-white font-black tracking-[0.2em] uppercase text-[11px] shadow-[0_0_40px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3"
                  >
                    <ZbdIcon size={20} /> {mobile ? 'Open in ZBD App' : 'Open in ZBD'}
                  </motion.button>
                )}
                {payMethod === 'alby' && mobile && walletUrl && !qrLoading && (
                  <motion.button
                    type="button"
                    onClick={() => openInWalletApp(walletUrl)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-6 rounded-[2.5rem] bg-orange-500 text-black font-black tracking-[0.2em] uppercase text-[11px] shadow-2xl flex items-center justify-center gap-3"
                  >
                    <Smartphone className="w-5 h-5" /> Open in Wallet
                  </motion.button>
                )}
                <button
                  type="button"
                  onClick={handleCopyUri}
                  disabled={!qrUri}
                  className="flex items-center gap-2 text-[10px] font-black text-white/30 hover:text-white uppercase tracking-[0.3em] transition-colors disabled:opacity-20"
                >
                  <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Lightning URI'}
                </button>
                <button type="button" onClick={() => setStep('form')} className="text-[11px] font-black text-white/20 hover:text-white uppercase tracking-[0.4em] transition-colors">Edit Amount</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
