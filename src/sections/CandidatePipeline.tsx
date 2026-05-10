import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const draggingCandidate = useRef<Candidate | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

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

  function getCandidatesForStage(stageId: string) {
    return candidates.filter((c) => (c.pipeline_stage || 'screened') === stageId);
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

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function moveCandidate(candidate: Candidate, targetStage: string) {
    if (candidate.pipeline_stage === targetStage) return;

    const prevStage = candidate.pipeline_stage;
    setCandidates((prev) =>
      prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: targetStage } : c)
    );
    // Keep drawer in sync
    setSelectedCandidate((prev) => prev?.id === candidate.id ? { ...prev, pipeline_stage: targetStage } : prev);

    try {
      await apiClient.patch(`/api/leads/${candidate.id}/pipeline`, { stage: targetStage });
      const stageMeta = STAGES.find((s) => s.id === targetStage);
      toast.success(`${candidate.name} moved to ${stageMeta?.label ?? targetStage}`);
    } catch {
      setCandidates((prev) =>
        prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: prevStage } : c)
      );
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

  const totalHired = getCandidatesForStage('hired').length;
  const totalCandidates = candidates.length;
  const avgScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
    : 0;
  const inProgress = candidates.filter((c) => !['screened', 'hired'].includes(c.pipeline_stage || 'screened')).length;

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Candidate Pipeline</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Drag candidates through hiring stages · Click any card for details</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
            <GripVertical className="w-3.5 h-3.5" />
            Drag to move · Click to view
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Candidates', value: totalCandidates, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'In Progress', value: inProgress, icon: ChevronRight, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Avg AI Score', value: avgScore, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Hired', value: totalHired, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
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
