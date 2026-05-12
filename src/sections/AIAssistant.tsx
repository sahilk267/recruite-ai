import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Show me all high-scoring candidates (75+) currently in the Interviewing stage',
  'Which candidates have Python and AWS skills?',
  'Who are the top 3 candidates by AI score?',
  'List candidates with more than 5 years of experience',
  'Which candidates are ready to receive an offer?',
  'Find candidates with React skills who are in the Screened stage',
];

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-emerald-500/15 border border-emerald-500/30'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-violet-400" />
          : <Bot className="w-4 h-4 text-emerald-400" />}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[80%] relative', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-violet-600/25 border border-violet-500/30 text-violet-100 rounded-tr-sm'
            : 'bg-[#242424] border border-white/8 text-zinc-200 rounded-tl-sm'
        )}>
          {msg.content}
        </div>
        <div className={cn(
          'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-[10px] text-zinc-600">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={copy} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your RecruitAI assistant powered by Gemini. Ask me anything about your candidates — their skills, scores, pipeline stages, experience, or anything else. I have real-time access to your candidate database.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/ai/chat', { question });
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err?.response?.data?.detail ?? 'Something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared. Ask me anything about your candidates!",
      timestamp: new Date(),
    }]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            AI Recruitment Assistant
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Powered by Gemini 2.5 Flash · Real-time access to your candidate database
          </p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Clear chat
        </button>
      </div>

      <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* Suggestions (show only when just welcome message) */}
        {messages.length === 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Try asking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/8 text-zinc-400 hover:text-zinc-200 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto bg-[#141414] border border-white/6 rounded-2xl p-4 space-y-4 mb-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/15 border border-emerald-500/30">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-[#242424] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gemini is thinking…
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="relative bg-[#1e1e1e] border border-white/10 rounded-2xl flex items-end gap-3 p-3 focus-within:border-violet-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about candidates, skills, pipeline stages…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 resize-none outline-none leading-relaxed max-h-32 py-1"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !loading
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            )}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-700 mt-2">
          Press Enter to send · Shift+Enter for new line · Responses billed to Replit AI credits
        </p>
      </div>
    </div>
  );
}
