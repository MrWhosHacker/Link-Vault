import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Link2, BarChart3, Settings, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Pencil, Check, X, Zap, Music, AlertTriangle, MousePointerClick, Smartphone, Image as ImageIcon, Sparkles, Terminal, Award, ThumbsUp, Heart, Lock, RotateCcw } from 'lucide-react';
import type { LinkItem, UserProfile, AppSettings, DashTab, Analytics, MusicItem, BadgeType, UserAccount, MusicPlatform } from '../types';
import { SOCIAL_PRESETS, SOCIAL_CATEGORIES, MUSIC_PLATFORMS, getMusicPlatform, detectMusicPlatformFromUrl, resolveMusicPlatform } from '../presets';
import { THEMES, getTheme, BADGE_METADATA, buildVaultShareUrl, hasBadge, hasVipAccess } from '../store';
import { saveDevicePrefs } from '../devicePrefs';
import ShareProfileQR from './ShareProfileQR';
import ProfilePage from './ProfilePage';
import BrandIcon, { LinkIcon, ZbdIcon, AlbyIcon } from './BrandIcon';
import IconPickerPopover from './IconPickerPopover';

function Toggle({on,onChange,color='purple'}:{on:boolean;onChange:()=>void;color?:string}){
  const c:Record<string,string>={purple:'bg-purple-600',yellow:'bg-yellow-500',green:'bg-green-500',blue:'bg-blue-500',orange:'bg-orange-500'};
  return(<button onClick={onChange} className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${on?c[color]||c.purple:'bg-white/10'}`}><motion.span className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg" animate={{x:on?24:4}} transition={{type:'spring',stiffness:500,damping:30}}/></button>);
}

interface Props{links:LinkItem[];profile:UserProfile;settings:AppSettings;analytics:Analytics;currentAccount?:UserAccount|null;hasVip:boolean;onAddLink:(l:any)=>void;onRemoveLink:(id:string)=>void;onToggleLink:(id:string)=>void;onUpdateLink:(id:string,u:Partial<LinkItem>)=>void;onReorderLinks:(f:number,t:number)=>void;onUpdateProfile:(u:Partial<UserProfile>)=>void;onUpdateSettings:(u:Partial<AppSettings>)=>void;onDeleteAccount:()=>void;onAddMusic:(m:any)=>void;onRemoveMusic:(id:string)=>void;onAddArtwork:(a:any)=>void;onRemoveArtwork:(id:string)=>void;onAdminCommand:(c:string)=>any;onGoHome:()=>void;onBadgeRequest:(b:BadgeType[])=>Promise<any>;onApplyBadge:(c:string)=>any;onResetAnalyticsViews:()=>void;onResetAnalyticsClicks:()=>void;}

type SettingsSection = 'profile' | 'crypto' | 'theme' | 'storage' | 'vip' | 'supporter' | 'beta' | 'danger';

function BadgeLockedPanel({ badge, onRequest }: { badge: BadgeType; onRequest: () => void }) {
  const meta = BADGE_METADATA[badge];
  return (
    <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/10 p-10 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        <Lock className="h-8 w-8 text-white/30" />
      </div>
      <div>
        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Section Locked</h3>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
          Requires the <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.icon} {meta.label}</span> badge.
          Request it in Identity settings, then enter your sync code from Discord.
        </p>
      </div>
      <button type="button" onClick={onRequest} className="rounded-2xl bg-purple-600/20 border border-purple-500/30 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-600/30 transition-all">
        Go to Badge Requests
      </button>
    </div>
  );
}

export default function Dashboard({links,profile,settings,analytics,currentAccount,hasVip,onAddLink,onRemoveLink,onToggleLink,onUpdateLink,onReorderLinks,onUpdateProfile,onUpdateSettings,onDeleteAccount,onAddMusic,onRemoveMusic,onAddArtwork,onRemoveArtwork, onAdminCommand, onGoHome, onBadgeRequest, onApplyBadge, onResetAnalyticsViews, onResetAnalyticsClicks}:Props){
  const [tab,setTab]=useState<DashTab | 'artwork' | 'terminal'>('links');
  const [editId,setEditId]=useState<string|null>(null);
  const [eTitle,setET]=useState('');const [eUrl,setEU]=useState('');const [eIcon,setEI]=useState('');const [eBrandSlug,setEBS]=useState<string|undefined>();
  const [iconPickerLinkId,setIconPickerLinkId]=useState<string|null>(null);
  const [showCustomIconPicker,setShowCustomIconPicker]=useState(false);
  const [showPresets,setShowPresets]=useState(false);
  const [newHandle,setNewHandle]=useState('');
  const [selPreset,setSelPreset]=useState<string|null>(null);
  const [presetCategory, setPresetCategory] = useState<string>('All');
  const [showCustom,setShowCustom]=useState(false);
  const [cTitle,setCT]=useState('');const [cUrl,setCU]=useState('');const [cIcon,setCI]=useState('🔗');const [cBrandSlug,setCBS]=useState<string|undefined>();
  const [mTitle,setMT]=useState('');const [mUrl,setMU]=useState('');const [mPlat,setMP]=useState<MusicPlatform>('wavelake');
  const [mFileData, setMFileData] = useState<string | undefined>(undefined);
  const [artTitle,setArtTitle]=useState('');const [artUrl,setArtUrl]=useState('');const [artPreview,setArtPreview]=useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const [confirmResetViews, setConfirmResetViews] = useState(false);
  const [confirmResetClicks, setConfirmResetClicks] = useState(false);
  const [settSec,setSettSec]=useState<SettingsSection>('profile');
  const [cmd, setCmd] = useState('');
  const [cmdLogs, setCmdLogs] = useState<string[]>(['System Ready. Initializing Owner Console...']);

  const [selectedBadges, setSelectedBadges] = useState<BadgeType[]>([]);
  const [badgeInputCode, setBadgeInputCode] = useState('');
  const [badgeReqLoading, setBadgeReqLoading] = useState(false);
  const [badgeSuccess, setBadgeSuccess] = useState(false);
  
  const dragControls = useDragControls();

  const tabs:{id:any;label:string;icon:React.ReactNode}[]=[
    {id:'links',label:'Links',icon:<Link2 className="h-4 w-4"/>},
    {id:'music',label:'Music',icon:<Music className="h-4 w-4"/>},
    {id:'artwork',label:'Artwork',icon:<ImageIcon className="h-4 w-4"/>},
    {id:'analytics',label:'Stats',icon:<BarChart3 className="h-4 w-4"/>},
    {id:'settings',label:'Settings',icon:<Settings className="h-4 w-4"/>},
    ...(profile.isAdmin ? [{id:'terminal', label:'Admin', icon:<Terminal className="h-4 w-4"/>}] : []),
  ];

  const handleAddPreset=()=>{
    if(!selPreset||!newHandle.trim())return;
    const p=SOCIAL_PRESETS.find(x=>x.id===selPreset);
    if(!p)return;
    onAddLink({title:p.label,url:p.urlBase+newHandle.trim(),icon:p.icon,brandSlug:p.brandSlug,enabled:true,category:p.category});
    setNewHandle('');setSelPreset(null);setShowPresets(false);
  };
  const selectedPreset = selPreset ? SOCIAL_PRESETS.find(p => p.id === selPreset) : null;
  const filteredPresets = SOCIAL_PRESETS.filter(p => presetCategory === 'All' || p.category === presetCategory);
  const activeMusicPlatform = getMusicPlatform(mPlat);
  const handleAddCustom=()=>{if(!cTitle.trim()||!cUrl.trim())return;onAddLink({title:cTitle.trim(),url:cUrl.trim(),icon:cIcon,brandSlug:cBrandSlug,enabled:true,category:'Custom'});setCT('');setCU('');setCI('🔗');setCBS(undefined);setShowCustom(false);setShowCustomIconPicker(false);};
  const handleMusicUrlChange = (value: string) => {
    setMU(value);
    const detected = detectMusicPlatformFromUrl(value);
    if (detected && detected !== 'local') setMP(detected);
  };
  const handleAddMusic=()=>{
    if(!mTitle.trim()) { alert("Matrix Error: Track Name required."); return; }
    if(mPlat !== 'local' && !mUrl.trim()) { alert("Matrix Error: Source URL required."); return; }
    if(mPlat === 'local' && !mFileData) { alert("Matrix Error: File not uploaded."); return; }
    const platform = mPlat === 'local'
      ? 'local'
      : (detectMusicPlatformFromUrl(mUrl) ?? mPlat);
    onAddMusic({
      title: mTitle.trim(),
      url: mPlat === 'local' ? (mFileData || mUrl.trim()) : mUrl.trim(),
      platform,
      fileData: mFileData,
    });
    setMT(''); setMU(''); setMFileData(undefined);
    alert("Audio Protocol Synchronized.");
  };
  const handleAddArt=()=>{
    const source = artPreview || artUrl.trim();
    if (!source) { alert('Pick an image file or paste an image URL.'); return; }
    const title = artTitle.trim() || 'Untitled Art';
    onAddArtwork({ title, url: source });
    setArtTitle(''); setArtUrl(''); setArtPreview('');
    alert('Artwork added to your gallery.');
  };

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  const compressImageFile = (file: File): Promise<string> => readFileAsDataUrl(file).then(dataUrl => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 2048;
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'artwork' | 'music') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif)$/i.test(file.name);
    if ((target === 'avatar' || target === 'artwork') && !isImage) {
      alert('Please choose an image file (JPG, PNG, GIF, WebP, etc.).');
      return;
    }

    const maxRaw = target === 'music' ? 8 : 20;
    if (file.size > maxRaw * 1024 * 1024) {
      alert(`File is too large. Max ${maxRaw}MB.`);
      return;
    }

    setIsUploading(true);
    try {
      if (target === 'avatar' || target === 'artwork') {
        const dataUrl = await compressImageFile(file);
        if (target === 'avatar') {
          if (hasVip) {
            onUpdateProfile({ avatarUrl: dataUrl, avatarType: 'image' });
          } else if (currentAccount?.id) {
            saveDevicePrefs(currentAccount.id, { localAvatarUrl: dataUrl });
            onUpdateProfile({ avatarUrl: dataUrl, avatarType: 'image' });
          } else {
            onUpdateProfile({ avatarUrl: dataUrl, avatarType: 'image' });
          }
        } else {
          setArtPreview(dataUrl);
          setArtUrl('');
          const title = artTitle.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 60) || 'My Art';
          if (!artTitle.trim()) setArtTitle(title);
          onAddArtwork({ title, url: dataUrl });
          setArtTitle('');
          setArtPreview('');
        }
      } else {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = () => {
            setMFileData(reader.result as string);
            resolve();
          };
          reader.onerror = () => reject(new Error('Could not read audio file'));
          reader.readAsDataURL(file);
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed. Try a different image.');
    } finally {
      setIsUploading(false);
    }
  };
  const startEdit=(l:LinkItem)=>{setEditId(l.id);setET(l.title);setEU(l.url);setEI(l.icon);setEBS(l.brandSlug);setIconPickerLinkId(null);};
  const saveEdit=(id:string)=>{onUpdateLink(id,{title:eTitle,url:eUrl,icon:eIcon,brandSlug:eBrandSlug});setEditId(null);setIconPickerLinkId(null);};
  const applyIconSelection=(selection:{icon:string;brandSlug?:string})=>{
    if(editId){
      setEI(selection.icon);
      setEBS(selection.brandSlug);
      return;
    }
    if(showCustom){
      setCI(selection.icon);
      setCBS(selection.brandSlug);
      return;
    }
    if(iconPickerLinkId){
      onUpdateLink(iconPickerLinkId,{icon:selection.icon,brandSlug:selection.brandSlug});
      setIconPickerLinkId(null);
    }
  };
  const handleDelete = () => setShowDeleteConfirm(true);
  const handleConfirmDelete = () => { onDeleteAccount(); setShowDeleteConfirm(false); };
  const handleCmd = (e: React.FormEvent) => { e.preventDefault(); if (!cmd.trim()) return; const res = onAdminCommand(cmd); setCmdLogs(prev => [...prev, `> ${cmd}`, res.ok ? (res.msg || 'Success') : `Error: ${res.error}`]); setCmd(''); };

  const handleSendBadgeRequest = async () => {
    if (selectedBadges.length === 0) return;
    setBadgeReqLoading(true);
    const res = await onBadgeRequest(selectedBadges);
    if (res.ok) {
      alert(`Authorization code sent to Discord. Codes from channel 1518310697220444381.`);
      setSelectedBadges([]);
    }
    setBadgeReqLoading(false);
  };

  const handleApplyBadge = () => {
    if (!badgeInputCode.trim()) return;
    const res = onApplyBadge(badgeInputCode);
    if (res.ok) {
      setBadgeSuccess(true);
      setBadgeInputCode('');
      setTimeout(() => setBadgeSuccess(false), 3000);
    } else {
      alert(res.error);
    }
  };

  const handleStorageChange = (key: 'musicStorage' | 'artworkStorage', mode: 'local' | 'server') => {
    if (mode === 'server' && !hasVipAccess(profile)) {
      alert('VIP badge required to store on the server. Request VIP in Settings → VIP section.');
      return;
    }
    onUpdateSettings({ [key]: mode });
  };

  const hasVipBadge = hasVipAccess(profile);
  const hasSupporterBadge = hasBadge(profile, 'supporter') || profile.isAdmin;
  const hasBetaBadge = hasBadge(profile, 'beta') || hasBadge(profile, 'tester') || profile.isAdmin;

  const settingsTabs: { id: SettingsSection; l: string; badge?: BadgeType }[] = [
    { id: 'profile', l: '👤 Identity' },
    { id: 'crypto', l: '⚡ Payments' },
    { id: 'theme', l: '🎨 Themes' },
    { id: 'storage', l: '💾 Storage' },
    { id: 'vip', l: '💎 VIP', badge: 'vip' },
    { id: 'supporter', l: '💖 Supporter', badge: 'supporter' },
    { id: 'beta', l: '🚀 Beta', badge: 'beta' },
    { id: 'danger', l: '⚠️ Danger' },
  ];

  const isSectionUnlocked = (sec: SettingsSection): boolean => {
    if (sec === 'vip') return hasVipBadge;
    if (sec === 'supporter') return hasSupporterBadge;
    if (sec === 'beta') return hasBetaBadge;
    return true;
  };

  const handleSettingsTab = (id: SettingsSection) => {
    setSettSec(id);
  };

  return(
    <div className="min-h-screen bg-[#05050a] relative overflow-hidden" onClick={onGoHome}>
      <div className="absolute inset-0 opacity-20"><div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]"/><div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]"/></div>
      <motion.div drag dragControls={dragControls} dragListener={false} dragMomentum={false} className="relative z-10 mx-auto max-w-[1400px] px-6 py-10 flex flex-col lg:flex-row gap-12 h-screen" onClick={e => e.stopPropagation()}>
        <div className="flex-1 lg:max-w-4xl bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 shadow-2xl overflow-y-auto no-scrollbar">
          <div onPointerDown={e => dragControls.start(e)} className="cursor-grab active:cursor-grabbing mb-8 group">
            <div className="flex items-center gap-4 mb-2"><div className="h-12 w-12 rounded-[1.25rem] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-500/20 group-active:scale-95 transition-transform"><Zap className="h-6 w-6 text-white" fill="white"/></div><h1 className="text-3xl font-black text-white tracking-tighter" style={{fontFamily:'Orbitron'}}><span>Link</span><span className="text-purple-400">Vault</span></h1></div>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] ml-16">{profile.username || 'System'} Control_Node v1.0.0</p>
          </div>
          <div className="mb-10 flex flex-wrap items-center gap-2 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-2 backdrop-blur-xl">
            {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 flex items-center justify-center gap-3 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${tab===t.id?'bg-white text-black shadow-2xl':'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>{t.icon}{t.label}</button>)}
          </div>
          <AnimatePresence mode="wait">
          {tab==='links'&&<motion.div key="links" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
            <div className="flex gap-3"><button onClick={()=>setShowPresets(true)} className="flex-1 flex items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-purple-500/20 p-6 text-purple-400/60 hover:border-purple-500/50 hover:text-purple-300 transition-all font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4"/>Social Preset</button><button onClick={()=>setShowCustom(true)} className="flex-1 flex items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-white/10 p-6 text-white/30 hover:border-white/30 hover:text-white/60 transition-all font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4"/>Custom link</button></div>
            {showPresets&&<motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="rounded-[2.5rem] bg-white/[0.03] border border-purple-500/20 p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Social Presets</h3>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{filteredPresets.length} platforms</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
                {SOCIAL_CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => { setPresetCategory(cat); setSelPreset(null); }} className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-widest border transition-all ${presetCategory === cat ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[340px] overflow-y-auto pr-2 no-scrollbar">
                {filteredPresets.map(p => (
                  <button key={p.id} type="button" title={p.label} onClick={() => setSelPreset(p.id)} className={`rounded-2xl p-3 text-center border transition-all min-h-[88px] flex flex-col items-center justify-center gap-1 ${selPreset===p.id?'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20':'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:border-white/15'}`}>
                    <BrandIcon brandSlug={p.brandSlug} emoji={p.icon} size={28} className="shrink-0" />
                    <span className="text-[9px] font-black uppercase leading-tight line-clamp-2">{p.shortLabel}</span>
                  </button>
                ))}
              </div>
              {selectedPreset&&<div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{selectedPreset.label}</p>
                <label className="block text-[10px] text-white/30 uppercase tracking-widest font-black">Handle / ID</label>
                <div className="flex gap-2 items-center bg-black/40 p-1 rounded-2xl border border-white/5">
                  <span className="px-3 py-3 text-[10px] text-white/25 font-mono truncate max-w-[45%] shrink-0">{selectedPreset.urlBase}</span>
                  <input value={newHandle} onChange={e=>setNewHandle(e.target.value)} placeholder={selectedPreset.handlePlaceholder} className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-white focus:outline-none font-bold"/>
                </div>
              </div>}
              <div className="flex gap-3"><button onClick={()=>{setShowPresets(false);setSelPreset(null);setPresetCategory('All');}} className="flex-1 rounded-2xl bg-white/5 py-4 text-[10px] font-black uppercase text-white/40 tracking-widest">Cancel</button><button onClick={handleAddPreset} disabled={!selPreset||!newHandle.trim()} className="flex-1 rounded-2xl bg-white text-black py-4 text-[10px] font-black uppercase tracking-widest disabled:opacity-10">Add Link</button></div>
            </motion.div>}
            {showCustom&&<motion.div initial={{opacity:0}} animate={{opacity:1}} className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Manual Injection</h3>
              <div className="flex gap-4 items-start">
                <div className="relative">
                  <button type="button" onClick={()=>setShowCustomIconPicker(v=>!v)} className="flex h-[72px] w-20 flex-col items-center justify-center gap-1 rounded-2xl border border-purple-500/20 bg-white/5 transition-all hover:border-purple-500/50 hover:bg-purple-600/10" title="Pick brand icon">
                    <LinkIcon link={{ icon: cIcon, brandSlug: cBrandSlug }} size={28} />
                    <span className="text-[7px] font-black uppercase tracking-widest text-white/30">Icon</span>
                  </button>
                  <IconPickerPopover open={showCustomIconPicker} onClose={()=>setShowCustomIconPicker(false)} onSelect={applyIconSelection} />
                </div>
                <input value={cIcon} onChange={e=>setCI(e.target.value)} className="w-20 rounded-2xl bg-white/5 border border-white/10 p-4 text-center text-3xl"/>
                <input value={cTitle} onChange={e=>setCT(e.target.value)} placeholder="Link Title" className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-4 text-white font-bold"/>
              </div>
              <input value={cUrl} onChange={e=>setCU(e.target.value)} placeholder="Destination URL" className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white font-mono"/>
              <div className="flex gap-3"><button onClick={()=>{setShowCustom(false);setShowCustomIconPicker(false);setCBS(undefined);}} className="flex-1 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Cancel</button><button onClick={handleAddCustom} className="flex-1 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest">Add Link</button></div>
            </motion.div>}
            {links.map((l,i)=><motion.div key={l.id} layout className={`group rounded-[2rem] border p-6 transition-all ${l.enabled?'bg-white/[0.03] border-white/10':'bg-white/[0.01] border-white/5 opacity-40'}`}>
              {editId===l.id?(<div className="space-y-4"><div className="flex gap-4 items-start"><div className="relative"><button type="button" onClick={()=>setIconPickerLinkId(iconPickerLinkId===l.id?null:l.id)} className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-purple-500/20 bg-white/5 transition-all hover:border-purple-500/50 hover:bg-purple-600/10" title="Pick brand icon"><LinkIcon link={{ icon: eIcon, brandSlug: eBrandSlug }} size={24} /></button><IconPickerPopover open={iconPickerLinkId===l.id} onClose={()=>setIconPickerLinkId(null)} onSelect={applyIconSelection} /></div><input value={eIcon} onChange={e=>setEI(e.target.value)} className="w-16 rounded-xl bg-white/5 border border-white/10 p-3 text-center text-xl"/><input value={eTitle} onChange={e=>setET(e.target.value)} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-white font-bold"/></div><input value={eUrl} onChange={e=>setEU(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white font-mono text-xs"/><div className="flex justify-end gap-2"><button onClick={()=>{setEditId(null);setIconPickerLinkId(null);}} className="p-2 text-white/20"><X className="w-5 h-5"/></button><button onClick={()=>saveEdit(l.id)} className="p-2 text-purple-400"><Check className="w-5 h-5"/></button></div></div>
              ):(<div className="flex items-center gap-5"><div className="relative"><button type="button" onClick={()=>setIconPickerLinkId(iconPickerLinkId===l.id?null:l.id)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 transition-transform hover:scale-110 hover:border hover:border-purple-500/30 group-hover:scale-110" title="Change icon"><LinkIcon link={l} size={28} /></button><IconPickerPopover open={iconPickerLinkId===l.id} onClose={()=>setIconPickerLinkId(null)} onSelect={applyIconSelection} /></div><div className="flex-1 min-w-0"><p className="text-sm font-black text-white truncate uppercase tracking-tight">{l.title}</p><p className="text-[10px] text-white/20 truncate font-mono mt-0.5">{l.url}</p></div><div className="flex items-center gap-2"><div className="flex flex-col items-end pr-4 border-r border-white/5"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{l.clicks}</p><p className="text-[8px] font-black text-white/10 uppercase tracking-widest">clicks</p></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>onReorderLinks(i,i-1)} className="p-2 text-white/10 disabled:opacity-0" disabled={i===0}><ArrowUp className="w-4 h-4"/></button><button onClick={()=>onReorderLinks(i,i+1)} className="p-2 text-white/10 disabled:opacity-0" disabled={i===links.length-1}><ArrowDown className="w-4 h-4"/></button><button onClick={()=>startEdit(l)} className="p-2 text-white/10 hover:text-blue-400"><Pencil className="w-4 h-4"/></button><button onClick={()=>onToggleLink(l.id)} className="p-2 text-white/10 hover:text-yellow-400">{l.enabled?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button><button onClick={()=>onRemoveLink(l.id)} className="p-2 text-white/10 hover:text-red-400"><Trash2 className="w-4 h-4"/></button></div></div></div>)}
            </motion.div>)}
          </motion.div>}
          {tab==='music'&&<motion.div key="music" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6">
            <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-black text-white tracking-tight uppercase">Audio Injection</h3>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{MUSIC_PLATFORMS.length} sources</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
                {MUSIC_PLATFORMS.map(p => (
                  <button key={p.id} type="button" title={p.label} onClick={() => { setMP(p.id); setMFileData(undefined); setMU(''); }} className={`rounded-xl px-3 py-3 text-left border transition-all flex items-center gap-2 ${mPlat===p.id?'bg-white text-black border-white shadow-lg':'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                    {p.brandSlug ? (
                      <BrandIcon brandSlug={p.brandSlug} emoji={p.icon} size={18} withBackground={false} className={mPlat===p.id ? '[&_img]:invert-0 [&_img]:brightness-100' : ''} invertOnDark={mPlat!==p.id} />
                    ) : (
                      <span className="text-lg shrink-0">{p.icon}</span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{p.shortLabel}</span>
                  </button>
                ))}
              </div>
              {activeMusicPlatform && (
                <p className="text-[9px] text-white/35 font-bold uppercase tracking-widest">
                  {activeMusicPlatform.label}
                  {activeMusicPlatform.embed ? ' · embeds in profile' : ' · opens external link'}
                </p>
              )}
              <div className="space-y-4">
                <input value={mTitle} onChange={e=>setMT(e.target.value)} placeholder="Track title" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black uppercase tracking-widest focus:border-purple-500/50 outline-none transition-all"/>
                {mPlat === 'local' ? (
                  <div className="relative group"><input type="file" accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac" onChange={e => handleFileUpload(e, 'music')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl px-6 py-4 text-center group-hover:bg-purple-600/20 transition-all"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{isUploading ? 'Uploading...' : (mFileData ? 'File ready — click Add Track' : 'Upload audio file')}</p></div></div>
                ) : (
                  <input value={mUrl} onChange={e=>handleMusicUrlChange(e.target.value)} placeholder={activeMusicPlatform?.placeholder ?? 'Paste track URL'} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono focus:border-purple-500/50 outline-none transition-all"/>
                )}
              </div>
              <button onClick={handleAddMusic} className="w-full bg-white text-black rounded-2xl py-5 text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-purple-600 hover:text-white transition-all active:scale-[0.98]">Add to Audio Feed</button>
            </div>
            {profile.music.map(m=>{
              const plat = getMusicPlatform(resolveMusicPlatform(m));
              return (
              <div key={m.id} className="flex items-center gap-4 rounded-3xl bg-white/[0.03] border border-white/5 p-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  {plat?.brandSlug ? (
                    <BrandIcon brandSlug={plat.brandSlug} emoji={plat.icon} size={22} withBackground={false} />
                  ) : (
                    <span className="text-xl">{plat?.icon ?? '🎵'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-black text-white truncate">{m.title}</p><p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{plat?.label ?? m.platform}</p></div>
                <button onClick={()=>onRemoveMusic(m.id)} className="p-3 text-white/10 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            );})}
          </motion.div>}
          {tab==='artwork'&&<motion.div key="artwork" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6">
            <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6">
              <div className="flex items-center justify-between"><h3 className="text-lg font-black text-white tracking-tight uppercase">Art Matrix Injection</h3><ImageIcon className="w-5 h-5 text-purple-500" /></div>
              <div className="space-y-4"><input value={artTitle} onChange={e=>setArtTitle(e.target.value)} placeholder="ARTWORK TITLE (optional)" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black uppercase tracking-widest focus:border-purple-500/50 outline-none transition-all"/><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="relative group"><input type="file" accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg" onChange={e => handleFileUpload(e, 'artwork')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/><div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl px-6 py-4 text-center group-hover:bg-purple-600/20 transition-all"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{isUploading ? 'PROCESSING...' : 'UPLOAD ANY IMAGE'}</p></div></div><input value={artUrl} onChange={e=>{setArtUrl(e.target.value);setArtPreview('');}} placeholder="OR PASTE IMAGE URL" className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono focus:border-purple-500/50 outline-none transition-all"/></div></div>
              {(artPreview || artUrl) && <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10"><img src={artPreview || artUrl} className="w-full h-full object-cover" alt=""/><button type="button" onClick={() => { setArtUrl(''); setArtPreview(''); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"><X className="w-3 h-3"/></button></div>}
              <button type="button" onClick={handleAddArt} disabled={isUploading || (!artPreview && !artUrl.trim())} className="w-full bg-white text-black rounded-2xl py-5 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-purple-600 hover:text-white active:scale-95 disabled:opacity-10">Add to Gallery</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{profile.artworks.map(a=><div key={a.id} className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 group shadow-lg bg-black/40"><img src={a.url} className="w-full h-full object-cover" alt=""/><button onClick={()=>onRemoveArtwork(a.id)} className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button></div>)}</div>
          </motion.div>}
          {tab==='analytics'&&<motion.div key="analytics" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6 text-left font-black uppercase tracking-widest">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-3"><MousePointerClick className="h-5 w-5"/></div>
                <p className="text-3xl font-black text-white">{analytics.totalClicks}</p>
                <p className="text-[10px] text-white/30 mb-3">Total Clicks</p>
                <button type="button" onClick={() => setConfirmResetClicks(true)} className="flex items-center gap-2 text-[9px] font-black text-red-400/70 hover:text-red-400 uppercase tracking-widest transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reset clicks
                </button>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 mb-3"><Eye className="h-5 w-5"/></div>
                <p className="text-3xl font-black text-white">{analytics.totalViews}</p>
                <p className="text-[10px] text-white/30 mb-3">Page Views</p>
                <button type="button" onClick={() => setConfirmResetViews(true)} className="flex items-center gap-2 text-[9px] font-black text-red-400/70 hover:text-red-400 uppercase tracking-widest transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reset views
                </button>
              </div>
            </div>
            <p className="text-[9px] text-white/25 font-bold normal-case tracking-normal">Link-level clicks: {links.reduce((s,l)=>s+l.clicks,0)} (per-link counts are separate from analytics total)</p>
            <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-8">
              <h3 className="text-sm font-black text-white opacity-40">Engagement Matrix</h3>
              <div className="space-y-6">
                <div><p className="text-[9px] mb-4 text-purple-400 tracking-[0.4em]">Audio Feed Performance</p><div className="space-y-3">{profile.music.map(m => (<div key={m.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5"><div className="flex-1 min-w-0 pr-4"><p className="text-xs text-white truncate">{m.title}</p><p className="text-[8px] text-white/20 mt-0.5">{m.platform}</p></div><div className="flex gap-4"><div className="flex flex-col items-center"><ThumbsUp className="w-3 h-3 text-green-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{m.likes}</span></div><div className="flex flex-col items-center"><Heart className="w-3 h-3 text-pink-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{m.favorites}</span></div><div className="flex flex-col items-center"><Zap className="w-3 h-3 text-orange-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{m.zaps}</span></div></div></div>))}</div></div>
                <div><p className="text-[9px] mb-4 text-blue-400 tracking-[0.4em]">Art Matrix Performance</p><div className="space-y-3">{profile.artworks.map(a => (<div key={a.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5"><div className="flex-1 min-w-0 pr-4"><p className="text-xs text-white truncate">{a.title}</p></div><div className="flex gap-4"><div className="flex flex-col items-center"><ThumbsUp className="w-3 h-3 text-green-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{a.likes}</span></div><div className="flex flex-col items-center"><Heart className="w-3 h-3 text-pink-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{a.favorites}</span></div><div className="flex flex-col items-center"><Zap className="w-3 h-3 text-orange-500 mb-1 opacity-40"/><span className="text-[9px] text-white/60">{a.zaps}</span></div></div></div>))}</div></div>
              </div>
            </div>
          </motion.div>}
          {tab==='settings'&&<motion.div key="settings" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-6">
              {settingsTabs.map(s => {
                const locked = s.badge && !isSectionUnlocked(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSettingsTab(s.id)}
                    className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${settSec===s.id?'bg-white text-black shadow-xl': locked ? 'bg-white/[0.02] text-white/20 border border-white/5' : 'bg-white/5 text-white/30 border border-white/5'}`}
                  >
                    {locked && <Lock className="w-3 h-3 shrink-0" />}
                    {s.l}
                  </button>
                );
              })}
            </div>
            {settSec==='theme'&&<div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-8"><div className="flex items-center justify-between"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Visual Engine</h3><Sparkles className="w-5 h-5 text-purple-500"/></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-3 no-scrollbar">{THEMES.map(t => (<button key={t.id} onClick={() => onUpdateProfile({ theme: t.id })} className={`group relative rounded-3xl p-5 border-2 transition-all text-left overflow-hidden ${profile.theme === t.id ? 'border-white bg-white/10 shadow-2xl scale-[0.98]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'}`}>{profile.theme === t.id && <div className="absolute top-0 right-0 w-8 h-8 bg-white flex items-center justify-center rounded-bl-2xl"><Check className="w-3.5 h-3.5 text-black font-black" /></div>}<span className="text-3xl block mb-3 drop-shadow-xl">{t.emoji}</span><p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${profile.theme === t.id ? 'text-white' : 'text-white/40'}`}>{t.name}</p><div className="mt-2 flex gap-1">{[1,2,3].map(i=><div key={i} className="w-2 h-2 rounded-full opacity-20" style={{backgroundColor:t.particleColor}}/>)}</div></button>))}</div></div>}
            {settSec==='profile'&&<div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Identity Protocol</h3>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4 bg-white/[0.02] rounded-3xl border border-white/5">
                  <div className="relative group"><div className="w-24 h-24 rounded-full bg-[#111] flex items-center justify-center text-4xl border border-white/10 shadow-2xl overflow-hidden">{(profile.avatarType === 'image' || profile.avatarType === 'url') && profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : profile.avatarEmoji}</div><input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'avatar')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"><ImageIcon className="w-6 h-6 text-white" /></div></div>
                  <div className="flex flex-wrap gap-2 justify-center"><button onClick={() => onUpdateProfile({ avatarType: 'emoji' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profile.avatarType === 'emoji' ? 'bg-white text-black' : 'text-white/40 border-white/10'}`}>Emoji</button><button onClick={() => onUpdateProfile({ avatarType: 'image' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profile.avatarType === 'image' ? 'bg-white text-black' : 'text-white/40 border-white/10'}`}>Upload {!hasVip && '🔒'}</button><button onClick={() => onUpdateProfile({ avatarType: 'url' })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profile.avatarType === 'url' ? 'bg-white text-black' : 'text-white/40 border-white/10'}`}>URL</button></div>
                  {profile.avatarType === 'url' && (
                    <input value={profile.avatarUrl} onChange={e => onUpdateProfile({ avatarUrl: e.target.value.trim(), avatarType: 'url' })} placeholder="https://example.com/avatar.jpg" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-3 text-sm text-white font-mono focus:border-purple-500/50 outline-none" />
                  )}
                  {!hasVip && profile.avatarType === 'image' && (
                    <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest text-center">Uploaded avatars stay on this device. VIP syncs to server.</p>
                  )}
                </div>
                
                {/* Badge Protocol (Authorization Required) */}
                <div className="p-8 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] space-y-6">
                  <div className="flex items-center justify-between"><label className="block text-[10px] text-purple-400 uppercase tracking-[0.3em] font-black">Badge Matrix Authorization</label><Award className="w-4 h-4 text-purple-500" /></div>
                  <p className="text-[10px] text-white/30 font-bold uppercase leading-relaxed tracking-wider">Select badges to request. They must be approved by the owner on Discord before synchronization.</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(BADGE_METADATA) as BadgeType[]).map(type => {
                      const b = BADGE_METADATA[type];
                      const isAssigned = profile.badges.includes(type);
                      const isSelected = selectedBadges.includes(type);
                      if (isAssigned) return (<div key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${b.color} text-[9px] font-black uppercase tracking-widest shadow-xl opacity-100`}><span>{b.icon}</span> {b.label}</div>);
                      return (<button key={type} onClick={() => { const nx = isSelected ? selectedBadges.filter(t => t !== type) : [...selectedBadges, type]; setSelectedBadges(nx); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-white/20 border-white/5 hover:border-white/20'}`}><span>{b.icon}</span>{b.label}</button>);
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <button onClick={handleSendBadgeRequest} disabled={selectedBadges.length === 0 || badgeReqLoading} className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20"><Zap className="w-3.5 h-3.5 fill-current" />{badgeReqLoading ? 'Transmitting...' : 'Send to Discord'}</button>
                    <div className="relative group"><input type="text" value={badgeInputCode} onChange={e => setBadgeInputCode(e.target.value.toUpperCase())} placeholder="ENTER SYNC CODE" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-center text-xs font-black tracking-[0.3em] text-white focus:border-purple-500 outline-none transition-all placeholder:tracking-normal placeholder:opacity-20"/><button onClick={handleApplyBadge} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white/40 hover:bg-purple-600 hover:text-white transition-all"><Check className="w-4 h-4" /></button></div>
                  </div>
                  {badgeSuccess && (<p className="text-center text-[9px] font-black text-green-400 uppercase tracking-widest animate-pulse">✅ Authorization Synchronized</p>)}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div><label className="block text-[10px] text-white/30 mb-2 uppercase tracking-[0.2em] font-black">Global Name</label><input value={profile.displayName} onChange={e=>onUpdateProfile({displayName:e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:border-purple-500/50 outline-none"/></div>
                  <div><label className="block text-[10px] text-white/30 mb-2 uppercase tracking-[0.2em] font-black">Avatar Emoji</label><input value={profile.avatarEmoji} onChange={e=>onUpdateProfile({avatarEmoji:e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl focus:border-purple-500/50 outline-none"/></div>
                </div>
                <div><label className="block text-[10px] text-white/30 mb-2 uppercase tracking-[0.2em] font-black">Bio_Stream</label><textarea value={profile.bio} onChange={e=>onUpdateProfile({bio:e.target.value})} rows={3} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:border-purple-500/50 outline-none resize-none"/></div>

                {currentAccount?.shareCode && (
                  <ShareProfileQR
                    shareUrl={buildVaultShareUrl(currentAccount.shareCode)}
                    shareCode={currentAccount.shareCode}
                    variant="inline"
                  />
                )}
              </div>
            </div>}
            {settSec==='crypto'&&<div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6"><h3 className="text-lg font-black text-white uppercase tracking-widest">Financial Matrix</h3><div className="space-y-4"><div><label className="flex items-center gap-2 text-[10px] text-white/30 mb-2 uppercase tracking-[0.2em] font-black"><ZbdIcon size={14} /> ZBD Gamertag</label><div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/5"><input value={profile.zbdGamerTag} onChange={e=>onUpdateProfile({zbdGamerTag:e.target.value})} placeholder="gamer_id" className="flex-1 bg-transparent px-5 py-4 text-sm text-white font-bold focus:outline-none"/><span className="px-5 text-xs text-white/20 font-black">@zbd.gg</span></div></div><div><label className="flex items-center gap-2 text-[10px] text-white/30 mb-2 uppercase tracking-[0.2em] font-black"><AlbyIcon size={14} /> Alby LN Address</label><input value={profile.albyAddress} onChange={e=>onUpdateProfile({albyAddress:e.target.value})} placeholder="name@getalby.com" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:border-purple-500/50 outline-none"/></div></div><div className="pt-6 border-t border-white/5 space-y-3">{([{k:'enableZBD',l:'ZBD System',icon:<ZbdIcon size={18}/>},{k:'enableAlby',l:'Alby Link',icon:<AlbyIcon size={18}/>}] as const).map((f)=><div key={f.k} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5"><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">{f.icon}</span><p className="text-[10px] font-black uppercase text-white/60 tracking-widest">{f.l}</p></div><Toggle on={(settings as any)[f.k]} onChange={()=>onUpdateSettings({[f.k]:!(settings as any)[f.k]})} color="orange"/></div>)}</div></div>}
            {settSec==='storage'&&<div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Data Storage</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Account, settings, and links always sync to the server. Music and artwork default to this device — VIP members can enable server sync in the VIP section.</p>
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 text-[9px] text-white/30 uppercase font-bold tracking-widest space-y-1">
                <p>✓ Server: sign-up, login, username, emoji avatar, image URL</p>
                <p>✓ Local device: uploaded avatar image (VIP = server sync)</p>
                <p>✓ Local or server (VIP): music, artwork</p>
              </div>
              {!hasVipBadge && (
                <button type="button" onClick={() => setSettSec('vip')} className="w-full py-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Unlock server storage — VIP section
                </button>
              )}
            </div>}
            {settSec==='vip' && !hasVipBadge && (
              <BadgeLockedPanel badge="vip" onRequest={() => setSettSec('profile')} />
            )}
            {settSec==='vip' && hasVipBadge && <div className="rounded-[2.5rem] bg-white/[0.03] border border-purple-500/20 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">VIP Matrix</h3>
                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${BADGE_METADATA.vip.color}`}>{BADGE_METADATA.vip.icon} VIP Active</span>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">VIP perks: server-synced media, cross-device avatar uploads, and priority features.</p>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-3">Music Library</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleStorageChange('musicStorage', 'local')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${settings.musicStorage === 'local' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>Local Device</button>
                    <button type="button" onClick={() => handleStorageChange('musicStorage', 'server')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${settings.musicStorage === 'server' ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-white/40 border-white/10'}`}>Server 💎</button>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-3">Art Matrix</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleStorageChange('artworkStorage', 'local')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${settings.artworkStorage === 'local' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>Local Device</button>
                    <button type="button" onClick={() => handleStorageChange('artworkStorage', 'server')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${settings.artworkStorage === 'server' ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-white/40 border-white/10'}`}>Server 💎</button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-purple-500/5 border border-purple-500/15 p-4 text-[9px] text-purple-200/50 uppercase font-bold tracking-widest">
                Server storage keeps your music and artwork available when you sign in on another device.
              </div>
            </div>}
            {settSec==='supporter' && !hasSupporterBadge && (
              <BadgeLockedPanel badge="supporter" onRequest={() => setSettSec('profile')} />
            )}
            {settSec==='supporter' && hasSupporterBadge && <div className="rounded-[2.5rem] bg-white/[0.03] border border-pink-500/20 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Supporter Lounge</h3>
                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${BADGE_METADATA.supporter.color}`}>{BADGE_METADATA.supporter.icon} Supporter</span>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Thank you for supporting LinkVault. Supporter perks are rolling out here first.</p>
              <ul className="space-y-3 text-[10px] text-white/50 font-bold uppercase tracking-widest">
                <li className="flex gap-2 items-start"><span className="text-pink-400">◈</span><span>Early access to new themes and effects</span></li>
                <li className="flex gap-2 items-start"><span className="text-pink-400">◈</span><span>Supporter badge displayed on your public vault</span></li>
                <li className="flex gap-2 items-start"><span className="text-pink-400">◈</span><span>Priority support queue (coming soon)</span></li>
              </ul>
            </div>}
            {settSec==='beta' && !hasBetaBadge && (
              <BadgeLockedPanel badge="beta" onRequest={() => setSettSec('profile')} />
            )}
            {settSec==='beta' && hasBetaBadge && <div className="rounded-[2.5rem] bg-white/[0.03] border border-yellow-500/20 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Beta Testers</h3>
                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${BADGE_METADATA.beta.color}`}>{BADGE_METADATA.beta.icon} Beta Access</span>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">You have access to experimental features before public release.</p>
              <ul className="space-y-3 text-[10px] text-white/50 font-bold uppercase tracking-widest">
                <li className="flex gap-2 items-start"><span className="text-yellow-400">◈</span><span>Preview inbox enhancements and new dashboard tools</span></li>
                <li className="flex gap-2 items-start"><span className="text-yellow-400">◈</span><span>Report bugs directly from the Beta channel on Discord</span></li>
                <li className="flex gap-2 items-start"><span className="text-yellow-400">◈</span><span>Tester badge also unlocks this section</span></li>
              </ul>
            </div>}
            {settSec==='danger'&&<div className="space-y-6"><div className="rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] p-8 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black text-white uppercase tracking-widest">Account Status</h3><span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter ${currentAccount?.isActivated ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>{currentAccount?.isActivated ? 'Activated' : 'Pending Activation'}</span></div><div className="bg-black/40 border border-white/5 p-4 rounded-2xl"><p className="text-[10px] uppercase font-black text-white/20 mb-2">Recovery Key</p><p className="text-sm font-mono font-black text-purple-400 tracking-widest select-all">{currentAccount?.recoveryKey || 'Demo session — no account key'}</p></div><p className="text-[10px] text-white/30 leading-relaxed font-bold uppercase tracking-widest">Save your recovery key to reset your password if needed.</p></div><div className="rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/10 p-8 space-y-4"><h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Danger Zone</h3><button onClick={handleDelete} className="w-full rounded-2xl border p-5 text-sm font-bold transition-all bg-red-500/[0.05] border-red-500/15 text-red-400/60 hover:bg-red-500/10 hover:text-red-400">Delete Account</button></div></div>}
          </motion.div>}
          {tab==='terminal'&&<motion.div key="terminal" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-4"><div className="rounded-[2.5rem] bg-black border border-white/10 p-8 font-mono text-xs overflow-hidden"><div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-2"><Terminal className="w-3 h-3 text-purple-400" /><span className="text-purple-400 uppercase tracking-widest">Admin_Shell_v1.0.0</span></div><div className="h-64 overflow-y-auto mb-4 space-y-1 no-scrollbar text-[10px]">{cmdLogs.map((log, i) => (<p key={i} className={log.startsWith('>') ? 'text-white/40' : log.startsWith('Error') ? 'text-red-400' : 'text-green-400'}>{log}</p>))}</div><form onSubmit={handleCmd} className="flex gap-2 bg-white/5 p-4 rounded-2xl border border-white/10"><span className="text-purple-500 font-bold">λ</span><input autoFocus value={cmd} onChange={e => setCmd(e.target.value)} className="flex-1 bg-transparent outline-none text-white border-none p-0 ring-0 focus:ring-0" placeholder="Enter command"/></form></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 uppercase text-[8px] font-black text-white/20 tracking-widest"><span>/signup [u] [p]</span><span>/login [u] [p]</span><span>/ban [u]</span><span>/freeze [u]</span><span>/remove [u]</span><span>/list</span><span>/unban [u]</span><span>/unfreeze [u]</span></div></motion.div>}
          </AnimatePresence>
        </div>
        <div className="hidden lg:block w-[420px] shrink-0"><div className="sticky top-10 flex flex-col items-center"><div className="flex items-center justify-between w-full mb-6 px-4"><div className="flex items-center gap-3 text-white/20 font-black uppercase tracking-[0.5em] text-[10px]"><Smartphone className="w-4 h-4" /> Real-time Mirror</div><div className="flex gap-2">{[1,2,3].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"/>)}</div></div><div className="relative w-full aspect-[9/19.5] rounded-[3.5rem] border-[8px] border-white/10 bg-[#050505] shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden group"><div className="absolute inset-[-2px] rounded-[3.5rem] border-[2px] opacity-40 animate-pulse duration-[3s]" style={{ borderColor: `rgb(${getTheme(profile.theme).accentRgb})`, boxShadow: `0 0 40px rgba(${getTheme(profile.theme).accentRgb}, 0.2)` }} /><div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0a0a0a] rounded-b-[1.75rem] z-40 flex items-center justify-center border-x border-b border-white/5 shadow-2xl"><div className="w-10 h-1 rounded-full bg-white/10"/></div><div className="absolute inset-4 overflow-y-auto no-scrollbar pointer-events-none rounded-[2.5rem] overflow-hidden"><div className="scale-[0.88] origin-top w-[113.6%] min-h-[113.6%] transition-transform duration-500"><ProfilePage profile={profile} links={links} settings={settings} onClickLink={()=>{}} onEngage={()=>{}} /></div></div><div className="absolute inset-0 z-30 pointer-events-none border-[16px] border-black rounded-[3.5rem] ring-1 ring-inset ring-white/10"/></div><p className="mt-8 text-[10px] text-white/5 font-black uppercase tracking-[0.8em] animate-pulse">Connection Secured</p></div></div>
      </motion.div>

      {/* Reset Analytics Confirmations */}
      <AnimatePresence>
        {confirmResetViews && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setConfirmResetViews(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-3xl border border-fuchsia-500/20 bg-[#0f0a0a] p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20"><Eye className="h-7 w-7 text-fuchsia-400" /></div>
              <h4 className="text-xl font-black text-white mb-2">Reset Page Views?</h4>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">This sets total page views to zero. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmResetViews(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-4 text-xs font-black uppercase tracking-widest text-white/50 hover:bg-white/[0.06] transition-all">Cancel</button>
                <button onClick={() => { onResetAnalyticsViews(); setConfirmResetViews(false); }} className="flex-1 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 py-4 text-xs font-black uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-500/30 transition-all">Reset Views</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {confirmResetClicks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setConfirmResetClicks(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-3xl border border-purple-500/20 bg-[#0f0a0a] p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20"><MousePointerClick className="h-7 w-7 text-purple-400" /></div>
              <h4 className="text-xl font-black text-white mb-2">Reset Total Clicks?</h4>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">This clears analytics total clicks and daily click history. Per-link click counts are not changed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmResetClicks(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-4 text-xs font-black uppercase tracking-widest text-white/50 hover:bg-white/[0.06] transition-all">Cancel</button>
                <button onClick={() => { onResetAnalyticsClicks(); setConfirmResetClicks(false); }} className="flex-1 rounded-2xl bg-purple-500/20 border border-purple-500/30 py-4 text-xs font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/30 transition-all">Reset Clicks</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-red-500/20 bg-[#0f0a0a] p-8 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <h4 className="text-xl font-black text-white mb-2">Delete Account?</h4>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-4 text-xs font-black uppercase tracking-widest text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-2xl bg-red-500/20 border border-red-500/30 py-4 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
