import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Trash2, CheckCheck, Clock, Send, MessageSquare, Shield, Users, LifeBuoy } from 'lucide-react';
import { useState } from 'react';
import type { InboxMessage, ChatMessage } from '../types';

function timeAgo(ts:number):string{ const d=Date.now()-ts; const m=Math.floor(d/60000); if(m<1)return'Just now'; if(m<60)return`${m}m ago`; const h=Math.floor(m/60); if(h<24)return`${h}h ago`; return`${Math.floor(h/24)}d ago`; }

interface Props { 
  isOpen:boolean; 
  onClose:()=>void; 
  messages:InboxMessage[]; 
  chatMessages:ChatMessage[];
  communityMembers: { id: string; name: string; initial: string; role: string }[];
  onMarkRead:(id:string)=>void; 
  onMarkAllRead:()=>void; 
  onDelete:(id:string)=>void; 
  onSendChat:(msg:string)=>void;
  onSendSupport: (data: { category: string, subject: string, message: string }) => Promise<{ ok: boolean; error?: string }>;
}

export default function InboxPanel({isOpen,onClose,messages,chatMessages,communityMembers,onMarkRead,onMarkAllRead,onDelete,onSendChat,onSendSupport}:Props){
  const [activeView, setActiveView] = useState<'inbox' | 'chat' | 'social' | 'support'>('inbox');
  const [chatInput, setChatInput] = useState('');
  
  // Support Form State
  const [supCategory, setSupCategory] = useState('Bug');
  const [supSubject, setSupSubject] = useState('');
  const [supMessage, setSupMessage] = useState('');
  const [supLoading, setSupLoading] = useState(false);
  const [supSuccess, setSupSuccess] = useState(false);
  const [supError, setSupError] = useState('');

  const dragControls = useDragControls();
  
  const unread=messages.filter(m=>!m.read).length;

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return(
    <AnimatePresence>
      {isOpen&&(
        <motion.div 
          className="fixed z-[60] bottom-24 right-6 w-full max-w-md pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
        >
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="relative w-full rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] shadow-2xl max-h-[70vh] flex flex-col pointer-events-auto overflow-hidden backdrop-blur-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between p-5 border-b border-white/[0.06] cursor-grab active:cursor-grabbing bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-xl">📬</div>
                <div>
                  <h3 className="text-lg font-bold text-white" style={{fontFamily:'Space Grotesk'}}>Communication Hub</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                    {activeView === 'inbox' ? (unread > 0 ? `${unread} unread notifications` : 'System Clear') : 'Live Matrix Chat'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="rounded-full p-1.5 text-white/30 hover:bg-white/10 hover:text-white transition-colors"><X className="h-5 w-5"/></button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex p-2 gap-1.5 bg-black/20 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveView('inbox')}
                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeView === 'inbox' ? 'bg-white text-black' : 'text-white/30 hover:bg-white/5'}`}
              >
                <Inbox className="w-3 h-3" /> Info
              </button>
              <button 
                onClick={() => setActiveView('chat')}
                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeView === 'chat' ? 'bg-white text-black' : 'text-white/30 hover:bg-white/5'}`}
              >
                <MessageSquare className="w-3 h-3" /> Public
              </button>
              <button 
                onClick={() => setActiveView('social')}
                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeView === 'social' ? 'bg-white text-black' : 'text-white/30 hover:bg-white/5'}`}
              >
                <Users className="w-3 h-3" /> Community
              </button>
              <button 
                onClick={() => setActiveView('support')}
                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeView === 'support' ? 'bg-white text-black' : 'text-white/30 hover:bg-white/5'}`}
              >
                <LifeBuoy className="w-3 h-3" /> Support
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[350px] no-scrollbar relative">
              {activeView === 'inbox' && (
                messages.length===0?(
                  <div className="text-center py-16">
                    <span className="text-5xl block mb-3 opacity-20">📭</span>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Buffer Empty</p>
                  </div>
                ):(
                  messages.map(m=>(
                    <motion.div key={m.id} layout
                      className={`group rounded-2xl border p-4 transition-all cursor-pointer ${
                        m.read?'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                        :'bg-purple-500/[0.06] border-purple-500/15 shadow-lg shadow-purple-500/5 hover:bg-purple-500/[0.10]'
                      }`}
                      onClick={()=>!m.read&&onMarkRead(m.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{m.senderName}</span>
                            {!m.read&&<span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"/>}
                            {m.type==='welcome'&&<span className="rounded-full bg-green-500/15 border border-green-500/20 px-2 py-0.5 text-[8px] font-black text-green-400 uppercase">SYSTEM</span>}
                          </div>
                          <p className="mt-1.5 text-xs text-white/50 leading-relaxed whitespace-pre-line">{m.message}</p>
                          <div className="mt-2 flex items-center gap-1 text-[9px] text-white/20 font-black uppercase tracking-tighter"><Clock className="h-3 w-3"/>{timeAgo(m.timestamp)}</div>
                        </div>
                        <button onClick={e=>{e.stopPropagation();onDelete(m.id);}}
                          className="rounded-lg p-1.5 text-white/10 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )
              )}

              {activeView === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4 mb-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center"><Shield className="w-6 h-6 text-white/10" /></div>
                        <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Your session messages</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{msg.senderName}</span>
                            <span className="text-[8px] text-white/10">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none">
                            <p className="text-xs text-white/70">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleChatSubmit} className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-500/50 transition-all" />
                    <button type="submit" className="p-3 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
                  </form>
                </div>
              )}

              {activeView === 'social' && (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center text-green-400 animate-pulse">●</div>
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Registered LinkVault Users</p>
                    <div className="mt-6 flex flex-col gap-2">
                      {communityMembers.length === 0 ? (
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest py-4">No other users visible right now</p>
                      ) : (
                        communityMembers.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-black text-xs">{member.initial}</div>
                              <span className="text-xs font-bold">{member.name}</span>
                            </div>
                            <span className="text-[8px] font-black uppercase text-green-400 tracking-tighter">{member.role}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-[8px] font-black text-white/10 text-center uppercase tracking-[0.3em]">Users with stealth mode off appear here</p>
                </div>
              )}

              {activeView === 'support' && (
                <div className="space-y-4 h-full flex flex-col">
                  {supSuccess ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-6">
                        <CheckCheck className="w-10 h-10 text-green-400" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Transmission Successful</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Your report has been received by the Core.</p>
                      <button onClick={() => setSupSuccess(false)} className="mt-8 text-[10px] font-black uppercase text-purple-400 hover:text-purple-300 tracking-[0.3em]">Send Another Report</button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center">
                          <LifeBuoy className="w-6 h-6 text-purple-400 animate-spin-slow" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">Support Protocol</h4>
                          <p className="text-[9px] text-white/30 uppercase font-bold mt-0.5">Automated Feedback Stream</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 px-1">
                        <div className="grid grid-cols-3 gap-2">
                          {['Bug', 'Glitch', 'Feature Request'].map(cat => (
                            <button 
                              key={cat}
                              onClick={() => setSupCategory(cat)}
                              className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${supCategory === cat ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/[0.05]'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        <input 
                          value={supSubject}
                          onChange={e => setSupSubject(e.target.value)}
                          placeholder="SUBJECT_TITLE"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white uppercase font-black tracking-widest focus:border-purple-500/50 outline-none transition-all"
                        />

                        <textarea 
                          value={supMessage}
                          onChange={e => setSupMessage(e.target.value)}
                          placeholder="DETAILED_DESCRIPTION"
                          rows={6}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white font-bold focus:border-purple-500/50 outline-none transition-all resize-none no-scrollbar"
                        />

                        {supError && (
                          <p className="text-[10px] font-bold text-red-400 text-center uppercase tracking-widest">{supError}</p>
                        )}

                        <button 
                          onClick={async () => {
                            if (!supSubject.trim() || !supMessage.trim()) return;
                            setSupLoading(true);
                            setSupError('');
                            const res = await onSendSupport({ category: supCategory, subject: supSubject, message: supMessage });
                            setSupLoading(false);
                            if (!res.ok) {
                              setSupError(res.error || 'Failed to send support request.');
                              return;
                            }
                            setSupSuccess(true);
                            setSupSubject('');
                            setSupMessage('');
                          }}
                          disabled={supLoading || !supSubject.trim() || !supMessage.trim()}
                          className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-purple-600 hover:text-white transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                        >
                          {supLoading ? 'TRANSMITTING...' : 'INITIATE FEEDBACK'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action */}
            {activeView === 'inbox' && unread > 0 && (
              <div className="p-4 bg-black/20 border-t border-white/5">
                <button onClick={onMarkAllRead} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/40 hover:bg-white/10 hover:text-white transition-all tracking-widest">
                  <CheckCheck className="w-3.5 h-3.5" /> Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Add simple Inbox icon for local component scope
function Inbox(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
