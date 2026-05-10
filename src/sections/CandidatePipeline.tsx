import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  GripVertical,
  User,
  Star,
  Briefcase,
  Mail,
  Phone,
  ChevronRight,
  Users,
  Trophy,
  Target,
  Zap,
  MoreVertical,
  Check,
  X,
  FileText,
  ArrowRight,
  Calendar,
  BadgeCheck,
  Flame,
  ClipboardList,
  Search,
  SlidersHorizontal,
  ChevronDown,
  History,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: number;
  score: number;
  quality: string;
  priority: string;
  status: string;
  pipeline_stage: string;
  resume_text: string;
  createdAt: string;
}

const STAGES = [
  {
    id: 'screened',
    label: 'Screened',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    headerGradient: 'from-blue-600/20 to-blue-600/5',
    activeBg: 'bg-blue-500/20',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    headerGradient: 'from-violet-600/20 to-violet-600/5',
    activeBg: 'bg-violet-500/20',
  },
  {
    id: 'interviewing',
    label: 'Interviewing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    headerGradient: 'from-amber-600/20 to-amber-600/5',
    activeBg: 'bg-amber-500/20',
  },
  {
    id: 'offer',
    label: 'Offer',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    headerGradient: 'from-orange-600/20 to-orange-600/5',
    activeBg: 'bg-orange-500/20',
  },
  {
    id: 'hired',
    label: 'Hired',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    headerGradient: 'from-emerald-600/20 to-emerald-600/5',
    activeBg: 'bg-emerald-500/20',
  },
];

const STAGE_ICONS: Record<string, React.ElementType> = {
  screened: Target,
  contacted: Mail,
  interviewing: Users,
  offer: Zap,
  hired: Trophy,
};

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score >= 75) return 'bg-emerald-500/15 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-500/15 border-amber-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

function scoreBarColor(score: number) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

type ScoreFilter = 'all' | 'high' | 'medium' | 'low';

interface Filters {
  search: string;
  score: ScoreFilter;
  skill: string;
  stage: string;
}

const SCORE_OPTIONS: { id: ScoreFilter; label: string; range: string; color: string; bg: string; border: string }[] = [
  { id: 'all',    label: 'All Scores', range: '',      color: 'text-zinc-300',   bg: 'bg-white/8',          border: 'border-white/15' },
  { id: 'high',   label: 'High',       range: '75+',   color: 'text-emerald-400', bg: 'bg-emerald-500/15',  border: 'border-emerald-500/40' },
  { id: 'medium', label: 'Medium',     range: '50–74', color: 'text-amber-400',   bg: 'bg-amber-500/15',    border: 'border-amber-500/40' },
  { id: 'low',    label: 'Low',        range: '<50',   color: 'text-red-400',     bg: 'bg-red-500/15',      border: 'border-red-500/40' },
];

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onChange,
  allSkills,
  totalVisible,
  totalAll,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  allSkills: string[];
  totalVisible: number;
  totalAll: number;
}) {
  const [skillOpen, setSkillOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const skillRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (skillRef.current && !skillRef.current.contains(e.target as Node)) setSkillOpen(false);
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) setStageOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCount = [
    filters.search !== '',
    filters.score !== 'all',
    filters.skill !== '',
    filters.stage !== '',
  ].filter(Boolean).length;

  function clearAll() {
    onChange({ search: '', score: 'all', skill: '', stage: '' });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search name or email…"
            className="pl-9 h-9 bg-[#1e1e1e] border-white/10 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/40"
          />
          {filters.search && (
            <button onClick={() => onChange({ ...filters, search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Score filter chips */}
        <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-white/8 rounded-xl p-1">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange({ ...filters, score: opt.id })}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                filters.score === opt.id
                  ? cn(opt.bg, opt.border, opt.color, 'border')
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              {opt.label}
              {opt.range && <span className="text-[9px] opacity-70">{opt.range}</span>}
            </button>
          ))}
        </div>

        {/* Skill dropdown */}
        <div className="relative" ref={skillRef}>
          <button
            onClick={() => setSkillOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all h-9',
              filters.skill
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-400'
                : 'bg-[#1e1e1e] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            )}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            {filters.skill || 'Skill'}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {skillOpen && (
            <div className="absolute top-10 left-0 z-50 bg-[#222] border border-white/10 rounded-xl shadow-xl shadow-black/60 py-1 min-w-[180px] max-h-60 overflow-y-auto">
              <button
                onClick={() => { onChange({ ...filters, skill: '' }); setSkillOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 transition-colors"
              >
                All Skills
              </button>
              {allSkills.map((s) => (
                <button
                  key={s}
                  onClick={() => { onChange({ ...filters, skill: s }); setSkillOpen(false); }}
                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2',
                    filters.skill === s ? 'text-violet-400' : 'text-zinc-300'
                  )}
                >
                  {filters.skill === s && <Check className="w-3 h-3 flex-shrink-0" />}
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stage dropdown */}
        <div className="relative" ref={stageRef}>
          <button
            onClick={() => setStageOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all h-9',
              filters.stage
                ? cn(STAGES.find(s => s.id === filters.stage)?.bg, STAGES.find(s => s.id === filters.stage)?.border, STAGES.find(s => s.id === filters.stage)?.color)
                : 'bg-[#1e1e1e] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filters.stage ? STAGES.find(s => s.id === filters.stage)?.label : 'Stage'}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {stageOpen && (
            <div className="absolute top-10 left-0 z-50 bg-[#222] border border-white/10 rounded-xl shadow-xl shadow-black/60 py-1 min-w-[160px]">
              <button
                onClick={() => { onChange({ ...filters, stage: '' }); setStageOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 transition-colors"
              >
                All Stages
              </button>
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onChange({ ...filters, stage: s.id }); setStageOpen(false); }}
                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2', s.color)}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                  {s.label}
                  {filters.stage === s.id && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all h-9"
          >
            <X className="w-3 h-3" />
            Clear ({activeCount})
          </button>
        )}

        {/* Result count */}
        <span className="text-xs text-zinc-600 ml-auto">
          {totalVisible === totalAll
            ? `${totalAll} candidates`
            : <span><span className="text-white font-semibold">{totalVisible}</span> of {totalAll}</span>
          }
        </span>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.search && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white/6 border border-white/10 text-zinc-300">
              <Search className="w-2.5 h-2.5 text-zinc-500" />
              "{filters.search}"
              <button onClick={() => onChange({ ...filters, search: '' })} className="ml-1 text-zinc-600 hover:text-zinc-300"><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {filters.score !== 'all' && (() => {
            const opt = SCORE_OPTIONS.find(o => o.id === filters.score)!;
            return (
              <span className={cn('flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border', opt.bg, opt.border, opt.color)}>
                <Star className="w-2.5 h-2.5" />
                {opt.label} {opt.range}
                <button onClick={() => onChange({ ...filters, score: 'all' })} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
              </span>
            );
          })()}
          {filters.skill && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/40 text-violet-400">
              <BadgeCheck className="w-2.5 h-2.5" />
              {filters.skill}
              <button onClick={() => onChange({ ...filters, skill: '' })} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {filters.stage && (() => {
            const s = STAGES.find(st => st.id === filters.stage)!;
            return (
              <span className={cn('flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border', s.bg, s.border, s.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                {s.label} only
                <button onClick={() => onChange({ ...filters, stage: '' })} className="ml-1 opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Activity Log Types & Helpers ────────────────────────────────────────────

interface ActivityEntry {
  id: string;
  lead_id: string;
  lead_name: string;
  from_stage: string;
  to_stage: string;
  moved_by_name: string;
  moved_by_email: string;
  moved_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Activity Log Component ──────────────────────────────────────────────────

function ActivityLog({
  entries,
  loading,
  onRefresh,
}: {
  entries: ActivityEntry[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Activity Log</span>
          {entries.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30">
              {entries.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          title="Refresh"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Entries */}
      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-zinc-700">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs">Loading activity…</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-700">
          <History className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-xs text-zinc-600">No moves recorded yet.</p>
          <p className="text-[11px] text-zinc-700 mt-1">Drag a candidate to a new stage to start the log.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
          <AnimatePresence initial={false}>
            {entries.map((e) => {
              const fromStage = STAGES.find((s) => s.id === e.from_stage);
              const toStage   = STAGES.find((s) => s.id === e.to_stage);
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                >
                  {/* Actor avatar */}
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-violet-400">{initials(e.moved_by_name || e.moved_by_email)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-semibold text-white truncate">{e.moved_by_name || e.moved_by_email}</span>
                      <span className="text-zinc-600">moved</span>
                      <span className="font-semibold text-zinc-200 truncate">{e.lead_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {fromStage ? (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', fromStage.bg, fromStage.border, fromStage.color)}>
                          {fromStage.label}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border bg-white/5 border-white/10 text-zinc-400">{e.from_stage}</span>
                      )}
                      <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                      {toStage ? (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', toStage.bg, toStage.border, toStage.color)}>
                          {toStage.label}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border bg-white/5 border-white/10 text-zinc-400">{e.to_stage}</span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-default transition-colors"
                      title={new Date(e.moved_at).toLocaleString()}
                    >
                      {timeAgo(e.moved_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Candidate Detail Drawer ──────────────────────────────────────────────────

function CandidateDrawer({
  candidate,
  onClose,
  onMoveToStage,
}: {
  candidate: Candidate;
  onClose: () => void;
  onMoveToStage: (candidate: Candidate, stageId: string) => void;
}) {
  const currentStageIdx = STAGES.findIndex((s) => s.id === (candidate.pipeline_stage || 'screened'));
  const currentStage = STAGES[currentStageIdx] ?? STAGES[0];

  const skillScore = Math.min(candidate.skills.length * 7, 55);
  const expScore =
    candidate.experience >= 8 ? 35 :
    candidate.experience >= 5 ? 30 :
    candidate.experience >= 3 ? 22 :
    candidate.experience >= 1 ? 12 : 5;
  const baseScore = 10;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-[460px] max-w-full bg-[#141414] border-l border-white/10 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{candidate.name}</h2>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block', currentStage.bg, currentStage.border, currentStage.color)}>
                {currentStage.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* AI Score section */}
          <div className="p-5 border-b border-white/8">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">AI Score Breakdown</p>
            <div className="flex items-center gap-4 mb-4">
              <div className={cn('text-4xl font-black', scoreColor(candidate.score))}>
                {candidate.score}
              </div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${candidate.score}%` }}
                    transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', scoreBarColor(candidate.score))}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-zinc-600">0</span>
                  <span className={cn('text-[10px] font-semibold', scoreColor(candidate.score))}>{candidate.quality} Match</span>
                  <span className="text-[10px] text-zinc-600">100</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Skills', value: skillScore, max: 55, color: 'text-violet-400', bar: 'bg-violet-500' },
                { label: 'Experience', value: expScore, max: 35, color: 'text-blue-400', bar: 'bg-blue-500' },
                { label: 'Base', value: baseScore, max: 10, color: 'text-zinc-400', bar: 'bg-zinc-500' },
              ].map((item) => (
                <div key={item.label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                  <p className="text-[10px] text-zinc-500 mb-1">{item.label}</p>
                  <p className={cn('text-lg font-black', item.color)}>{item.value}<span className="text-[10px] text-zinc-600 font-normal">/{item.max}</span></p>
                  <div className="h-1 rounded-full bg-white/8 mt-2 overflow-hidden">
                    <div className={cn('h-full rounded-full', item.bar)} style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div className="p-5 border-b border-white/8">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                <a href={`mailto:${candidate.email}`} className="text-sm text-zinc-300 hover:text-white transition-colors truncate">
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                <span className="text-sm text-zinc-300">{candidate.experience}+ years experience</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                <span className="text-sm text-zinc-300">Added {new Date(candidate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="p-5 border-b border-white/8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Skills</p>
              <span className="text-[10px] text-zinc-600">{candidate.skills.length} detected</span>
            </div>
            {candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span key={skill} className="text-[11px] px-2 py-1 rounded-lg bg-white/6 text-zinc-300 border border-white/10 flex items-center gap-1">
                    <BadgeCheck className="w-2.5 h-2.5 text-violet-400" />
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">No skills detected</p>
            )}
          </div>

          {/* Pipeline stage journey */}
          <div className="p-5 border-b border-white/8">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Pipeline Stage</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STAGES.map((s, i) => {
                const isPast = i < currentStageIdx;
                const isCurrent = i === currentStageIdx;
                const Icon = STAGE_ICONS[s.id];
                return (
                  <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                    <div className={cn(
                      'flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 border transition-all',
                      isCurrent ? cn(s.activeBg, s.border) : isPast ? 'bg-white/4 border-white/10' : 'bg-transparent border-white/6 opacity-40'
                    )}>
                      <Icon className={cn('w-3.5 h-3.5', isCurrent ? s.color : isPast ? 'text-zinc-400' : 'text-zinc-700')} />
                      <span className={cn('text-[9px] font-semibold', isCurrent ? s.color : isPast ? 'text-zinc-500' : 'text-zinc-700')}>
                        {s.label}
                      </span>
                      {isPast && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                    </div>
                    {i < STAGES.length - 1 && (
                      <ArrowRight className={cn('w-3 h-3 flex-shrink-0', i < currentStageIdx ? 'text-zinc-500' : 'text-zinc-800')} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Move stage buttons */}
          <div className="p-5 border-b border-white/8">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Move to Stage</p>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.filter((s) => s.id !== candidate.pipeline_stage).map((s) => {
                const Icon = STAGE_ICONS[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => { onMoveToStage(candidate, s.id); onClose(); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                      s.bg, s.border
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', s.color)} />
                    <span className={cn('text-xs font-semibold', s.color)}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resume text */}
          {candidate.resume_text && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Resume Text</p>
              </div>
              <div className="bg-white/4 rounded-xl border border-white/8 p-3 max-h-48 overflow-y-auto">
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{candidate.resume_text}</p>
              </div>
            </div>
          )}

          {!candidate.resume_text && (
            <div className="p-5">
              <div className="flex flex-col items-center justify-center py-6 text-zinc-700 bg-white/3 rounded-xl border border-white/6">
                <ClipboardList className="w-6 h-6 mb-2 opacity-50" />
                <p className="text-xs">No resume text available</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/8 flex gap-2">
          <a
            href={`mailto:${candidate.email}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-600/30 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          {candidate.phone && (
            <a
              href={`tel:${candidate.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-zinc-400 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Candidate Card ────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  onDragStart,
  onMoveToStage,
  stageId,
  onOpen,
}: {
  candidate: Candidate;
  onDragStart: (e: React.DragEvent, candidate: Candidate) => void;
  onMoveToStage: (candidate: Candidate, stageId: string) => void;
  stageId: string;
  onOpen: (candidate: Candidate) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const otherStages = STAGES.filter((s) => s.id !== stageId);

  return (
    <div
      draggable
      onDragStart={(e) => {
        didDrag.current = true;
        onDragStart(e, candidate);
      }}
      onDragEnd={() => { setTimeout(() => { didDrag.current = false; }, 50); }}
      onClick={() => { if (!didDrag.current && !menuOpen) onOpen(candidate); }}
      className="group bg-[#1e1e1e] border border-white/8 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {candidate.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {candidate.name}
            </p>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              {candidate.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={cn('text-sm font-black px-2 py-0.5 rounded-lg border text-center', scoreBg(candidate.score), scoreColor(candidate.score))}>
            {candidate.score}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/8 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 bg-[#252525] border border-white/10 rounded-xl shadow-xl shadow-black/60 py-1 min-w-[160px]">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Move to</div>
                {otherStages.map((s) => (
                  <button
                    key={s.id}
                    onClick={(e) => { e.stopPropagation(); onMoveToStage(candidate, s.id); setMenuOpen(false); }}
                    className={cn('w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2', s.color)}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <GripVertical className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors cursor-grab" />
        </div>
      </div>

      {candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {candidate.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/8">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-zinc-600">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {candidate.experience}+ yrs
        </span>
        <span className={cn('flex items-center gap-1 font-medium', scoreColor(candidate.score))}>
          <Star className="w-3 h-3" />
          {candidate.quality}
        </span>
      </div>
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  candidates,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  onMoveToStage,
  onOpenCandidate,
}: {
  stage: typeof STAGES[0];
  candidates: Candidate[];
  onDragStart: (e: React.DragEvent, candidate: Candidate) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  onMoveToStage: (candidate: Candidate, stageId: string) => void;
  onOpenCandidate: (candidate: Candidate) => void;
}) {
  const Icon = STAGE_ICONS[stage.id];

  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      <div className={cn('rounded-xl border mb-3 p-3 bg-gradient-to-b', stage.border, stage.bg, stage.headerGradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stage.bg, 'border', stage.border)}>
              <Icon className={cn('w-4 h-4', stage.color)} />
            </div>
            <span className={cn('text-sm font-bold', stage.color)}>{stage.label}</span>
          </div>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', stage.bg, stage.border, stage.color)}>
            {candidates.length}
          </span>
        </div>
      </div>

      <div
        onDrop={(e) => onDrop(e, stage.id)}
        onDragOver={(e) => onDragOver(e, stage.id)}
        onDragLeave={onDragLeave}
        className={cn(
          'flex-1 min-h-[400px] rounded-xl border-2 border-dashed p-2 space-y-2 transition-all duration-200',
          isDragOver
            ? cn('border-opacity-100 bg-white/5', stage.border)
            : 'border-white/8 bg-transparent',
        )}
      >
        {candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            onDragStart={onDragStart}
            onMoveToStage={onMoveToStage}
            stageId={stage.id}
            onOpen={onOpenCandidate}
          />
        ))}
        {candidates.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-12 text-zinc-700">
            <User className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs text-center">Drop candidates here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Pipeline View ────────────────────────────────────────────────────────

export function CandidatePipeline() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: '', score: 'all', skill: '', stage: '' });
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const draggingCandidate = useRef<Candidate | null>(null);

  useEffect(() => { fetchCandidates(); fetchActivity(); }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/leads?pageSize=100');
      const data: Candidate[] = res.data.leads ?? res.data;
      setCandidates(data);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }

  const fetchActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      const res = await apiClient.get('/api/pipeline/activity?limit=50');
      setActivityEntries(res.data);
    } catch {
      // silently ignore — activity log is non-critical
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // All unique skills across all candidates (for the skill dropdown)
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [candidates]);

  // Apply filters
  const filteredCandidates = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return candidates.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (filters.score === 'high'   && c.score < 75)              return false;
      if (filters.score === 'medium' && (c.score < 50 || c.score >= 75)) return false;
      if (filters.score === 'low'    && c.score >= 50)             return false;
      if (filters.skill && !c.skills.some((s) => s === filters.skill)) return false;
      if (filters.stage && (c.pipeline_stage || 'screened') !== filters.stage) return false;
      return true;
    });
  }, [candidates, filters]);

  function getCandidatesForStage(stageId: string) {
    return filteredCandidates.filter((c) => (c.pipeline_stage || 'screened') === stageId);
  }

  function handleDragStart(e: React.DragEvent, candidate: Candidate) {
    draggingCandidate.current = candidate;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  }

  function handleDragLeave() { setDragOverStage(null); }

  async function moveCandidate(candidate: Candidate, targetStage: string) {
    if (candidate.pipeline_stage === targetStage) return;
    const prevStage = candidate.pipeline_stage;
    setCandidates((prev) => prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: targetStage } : c));
    setSelectedCandidate((prev) => prev?.id === candidate.id ? { ...prev, pipeline_stage: targetStage } : prev);
    try {
      await apiClient.patch(`/api/leads/${candidate.id}/pipeline`, { stage: targetStage });
      toast.success(`${candidate.name} moved to ${STAGES.find((s) => s.id === targetStage)?.label ?? targetStage}`);
      fetchActivity();
    } catch {
      setCandidates((prev) => prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: prevStage } : c));
      setSelectedCandidate((prev) => prev?.id === candidate.id ? { ...prev, pipeline_stage: prevStage } : prev);
      toast.error('Failed to update stage');
    }
  }

  async function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStage(null);
    const candidate = draggingCandidate.current;
    if (!candidate) return;
    draggingCandidate.current = null;
    await moveCandidate(candidate, stageId);
  }

  // Stats always reflect unfiltered totals
  const totalHired    = candidates.filter((c) => (c.pipeline_stage || 'screened') === 'hired').length;
  const totalCandidates = candidates.length;
  const avgScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length) : 0;
  const inProgress = candidates.filter((c) => !['screened', 'hired'].includes(c.pipeline_stage || 'screened')).length;

  const isFiltering = filteredCandidates.length !== candidates.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Candidate Pipeline</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Drag candidates through hiring stages · Click any card for details</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActivity((v) => !v)}
              className={cn(
                'flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border transition-all',
                showActivity
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-400'
                  : 'bg-white/5 border-white/8 text-zinc-500 hover:text-zinc-300 hover:border-white/15'
              )}
            >
              <History className="w-3.5 h-3.5" />
              Activity Log
              {activityEntries.length > 0 && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                  showActivity ? 'bg-violet-500/30 text-violet-300' : 'bg-white/10 text-zinc-400'
                )}>
                  {activityEntries.length}
                </span>
              )}
              {showActivity ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
              <GripVertical className="w-3.5 h-3.5" />
              Drag to move · Click to view
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Candidates', value: totalCandidates, icon: Users,        color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'In Progress',      value: inProgress,      icon: ChevronRight, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Avg AI Score',     value: avgScore,        icon: Flame,        color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Hired',            value: totalHired,      icon: Check,        color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={cn('border', stat.bg, 'bg-[#1a1a1a]')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                      <Icon className={cn('w-4 h-4', stat.color)} />
                    </div>
                  </div>
                  <p className={cn('text-3xl font-black', stat.color)}>{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            allSkills={allSkills}
            totalVisible={filteredCandidates.length}
            totalAll={candidates.length}
          />
        </div>

        {/* Empty state when all filtered out */}
        {isFiltering && filteredCandidates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 bg-[#1a1a1a] border border-white/6 rounded-xl">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-zinc-500">No candidates match your filters</p>
            <button
              onClick={() => setFilters({ search: '', score: 'all', skill: '', stage: '' })}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Kanban board */}
        {filteredCandidates.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  candidates={getCandidatesForStage(stage.id)}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  isDragOver={dragOverStage === stage.id}
                  onMoveToStage={moveCandidate}
                  onOpenCandidate={setSelectedCandidate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity log panel */}
        <AnimatePresence>
          {showActivity && (
            <motion.div
              key="activity-log"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <ActivityLog
                entries={activityEntries}
                loading={activityLoading}
                onRefresh={fetchActivity}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateDrawer
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onMoveToStage={moveCandidate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
