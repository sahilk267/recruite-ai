import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Hash, RefreshCw, Users, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  channel: string;
  reply_to: string | null;
  created_at: string;
}

const CHANNELS = [
  { id: 'general',       label: 'General',       desc: 'Team-wide announcements & updates' },
  { id: 'deals',         label: 'Deals',          desc: 'Deal updates and negotiations' },
  { id: 'candidates',    label: 'Candidates',     desc: 'Candidate discussion' },
  { id: 'recruiters',    label: 'Recruiters',     desc: 'Recruiter coordination' },
  { id: 'announcements', label: 'Announcements',  desc: 'Important notices' },
];

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60)  return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-cyan-600', 'bg-pink-600',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = hash * 31 + ch.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function TeamMessages() {
  const { user } = useAuth();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (ch: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/messages', { params: { channel: ch, limit: 100 } });
      setMessages(res.data.data ?? []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect WebSocket for real-time updates
  const connectWs = useCallback((ch: string) => {
    const prevWs = ws;
    if (prevWs) prevWs.close();
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat/${ch}`;
      const socket = new WebSocket(wsUrl);
      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as ChatMessage;
          setMessages(prev => [...prev, msg]);
        } catch { }
      };
      socket.onerror = () => { /* silently degrade */ };
      setWs(socket);
    } catch { }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMessages(channel);
    connectWs(channel);
    return () => { ws?.close(); };
  }, [channel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await apiClient.post('/api/messages', { message: trimmed, channel });
      setText('');
      // If WS didn't pick it up, refresh
      setTimeout(() => fetchMessages(channel), 300);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-0 rounded-xl overflow-hidden border border-white/6">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-[#0d0d0d] border-r border-white/6 flex flex-col">
        <div className="p-4 border-b border-white/6">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            Team Chat
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">Real-time collaboration</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-zinc-500 text-xs px-2 py-2 uppercase tracking-wider">Channels</p>
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                channel === ch.id ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}>
              <span className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ch.label}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(user?.email ?? 'A')}`}>
              {initials(user?.name ?? user?.email ?? 'AU')}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name ?? 'You'}</p>
              <p className="text-zinc-500 text-xs truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a]">
        {/* Channel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 bg-[#0d0d0d]">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-zinc-400" />
            <span className="text-white font-semibold">{CHANNELS.find(c => c.id === channel)?.label}</span>
            <span className="text-zinc-500 text-sm">— {CHANNELS.find(c => c.id === channel)?.desc}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/10 text-zinc-400 text-xs">{messages.length} messages</Badge>
            <button onClick={() => fetchMessages(channel)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin w-6 h-6 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isOwn = m.sender_email === user?.email;
              const showAvatar = i === 0 || messages[i-1].sender_email !== m.sender_email;
              return (
                <div key={m.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {showAvatar ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(m.sender_name)}`}>
                      {initials(m.sender_name)}
                    </div>
                  ) : <div className="w-8 shrink-0" />}
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-zinc-300 text-xs font-medium">{m.sender_name}</span>
                        <span className="text-zinc-600 text-xs">{formatTime(m.created_at)}</span>
                      </div>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-[#1a1a1a] text-zinc-100 border border-white/6 rounded-tl-sm'
                    }`}>
                      {m.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/6 bg-[#0d0d0d]">
          <div className="flex gap-2 items-end">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${CHANNELS.find(c => c.id === channel)?.label ?? channel}...`}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !text.trim()}
              className="bg-violet-600 hover:bg-violet-700 shrink-0 px-4">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-zinc-600 text-xs mt-1">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
