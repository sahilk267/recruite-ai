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
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { toast } from 'sonner';

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
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    headerGradient: 'from-violet-600/20 to-violet-600/5',
  },
  {
    id: 'interviewing',
    label: 'Interviewing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    headerGradient: 'from-amber-600/20 to-amber-600/5',
  },
  {
    id: 'offer',
    label: 'Offer',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    headerGradient: 'from-orange-600/20 to-orange-600/5',
  },
  {
    id: 'hired',
    label: 'Hired',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    headerGradient: 'from-emerald-600/20 to-emerald-600/5',
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

function CandidateCard({
  candidate,
  onDragStart,
  onMoveToStage,
  stageId,
}: {
  candidate: Candidate;
  onDragStart: (e: React.DragEvent, candidate: Candidate) => void;
  onMoveToStage: (candidate: Candidate, stageId: string) => void;
  stageId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      onDragStart={(e) => onDragStart(e, candidate)}
      className="group bg-[#1e1e1e] border border-white/8 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
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
              onClick={() => setMenuOpen((v) => !v)}
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
                    onClick={() => { onMoveToStage(candidate, s.id); setMenuOpen(false); }}
                    className={cn('w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2', s.color)}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <GripVertical className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
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

function KanbanColumn({
  stage,
  candidates,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  onMoveToStage,
}: {
  stage: typeof STAGES[0];
  candidates: Candidate[];
  onDragStart: (e: React.DragEvent, candidate: Candidate) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
  onMoveToStage: (candidate: Candidate, stageId: string) => void;
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

export function CandidatePipeline() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
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

    setCandidates((prev) =>
      prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: targetStage } : c)
    );

    try {
      await apiClient.patch(`/api/leads/${candidate.id}/pipeline`, { stage: targetStage });
      const stageMeta = STAGES.find((s) => s.id === targetStage);
      toast.success(`${candidate.name} moved to ${stageMeta?.label ?? targetStage}`);
    } catch {
      setCandidates((prev) =>
        prev.map((c) => c.id === candidate.id ? { ...c, pipeline_stage: candidate.pipeline_stage } : c)
      );
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Candidate Pipeline</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Drag candidates through hiring stages</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
          <GripVertical className="w-3.5 h-3.5" />
          Drag cards between columns to move candidates
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: totalCandidates, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'In Progress', value: inProgress, icon: ChevronRight, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Avg AI Score', value: avgScore, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
