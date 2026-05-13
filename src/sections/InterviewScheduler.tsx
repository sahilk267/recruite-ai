import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Mail, Video, Plus, Loader2, CheckCircle2,
  XCircle, Sparkles, Edit2, Trash2, RefreshCw, Check, AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface Interview {
  id: string;
  lead_id: string;
  job_id?: string;
  interviewer_name: string;
  interviewer_email: string;
  scheduled_at: string | null;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  meeting_link: string;
  ai_suggested: boolean;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  score: number;
  pipeline_stage: string;
}

interface AISuggestion {
  label: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer_tip: string;
}

const STATUS_CONFIG = {
  scheduled:  { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   icon: Calendar },
  confirmed:  { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle2 },
  cancelled:  { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    icon: XCircle },
  completed:  { color: 'text-zinc-400',   bg: 'bg-zinc-500/15',   border: 'border-zinc-500/30',   icon: Check },
};

function fmtDate(iso: string | null) {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function InterviewScheduler() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiOverallTip, setAiOverallTip] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [form, setForm] = useState({
    lead_id: '',
    interviewer_name: '',
    interviewer_email: '',
    scheduled_at: '',
    duration_minutes: 45,
    notes: '',
    meeting_link: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ivRes, candRes, statRes] = await Promise.all([
        apiClient.get('/api/interviews'),
        apiClient.get('/api/leads?pageSize=100'),
        apiClient.get('/api/interviews/stats'),
      ]);
      setInterviews(ivRes.data || []);
      setCandidates(candRes.data?.data || []);
      setStats(statRes.data);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }

  async function suggestSlots() {
    if (!form.lead_id) { toast.error('Select a candidate first'); return; }
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await apiClient.post(`/api/interviews/ai-suggest?lead_id=${form.lead_id}`);
      setAiSuggestions(res.data.slots || []);
      setAiOverallTip(res.data.overall_tip || '');
      toast.success('AI suggested 3 interview slots');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Could not generate suggestions');
    } finally {
      setAiLoading(false);
    }
  }

  function applySlot(slot: AISuggestion) {
    const local = new Date(slot.scheduled_at);
    const yyyy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const dd = String(local.getDate()).padStart(2, '0');
    const hh = String(local.getHours()).padStart(2, '0');
    const min = String(local.getMinutes()).padStart(2, '0');
    setForm((f) => ({ ...f, scheduled_at: `${yyyy}-${mm}-${dd}T${hh}:${min}`, duration_minutes: slot.duration_minutes }));
    toast.success(`Applied: ${slot.label}`);
  }

  async function saveInterview() {
    if (!form.lead_id) { toast.error('Select a candidate'); return; }
    setSaving(true);
    try {
      await apiClient.post('/api/interviews', {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      });
      toast.success('Interview scheduled!');
      setShowForm(false);
      setForm({ lead_id: '', interviewer_name: '', interviewer_email: '', scheduled_at: '', duration_minutes: 45, notes: '', meeting_link: '' });
      setAiSuggestions([]);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to schedule interview');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiClient.patch(`/api/interviews/${id}`, { status });
      setInterviews((prev) => prev.map((iv) => iv.id === id ? { ...iv, status: status as any } : iv));
      setStats((s) => ({ ...s }));
      toast.success(`Marked as ${status}`);
      fetchAll();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function deleteInterview(id: string) {
    try {
      await apiClient.delete(`/api/interviews/${id}`);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      toast.success('Interview removed');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const filtered = filterStatus ? interviews.filter((iv) => iv.status === filterStatus) : interviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Interview Scheduler
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">Schedule interviews with AI-suggested time slots</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: '', label: 'Total', value: stats.total, color: 'text-white' },
          { key: 'scheduled', label: 'Scheduled', value: stats.scheduled, color: 'text-blue-400' },
          { key: 'confirmed', label: 'Confirmed', value: stats.confirmed, color: 'text-emerald-400' },
          { key: 'completed', label: 'Completed', value: stats.completed, color: 'text-zinc-400' },
          { key: 'cancelled', label: 'Cancelled', value: stats.cancelled, color: 'text-red-400' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={cn(
              'bg-[#1a1a1a] border rounded-xl p-3 text-center transition-all',
              filterStatus === s.key ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/8 hover:border-white/15'
            )}
          >
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Interview list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading interviews…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1a1a1a] border border-white/8 rounded-2xl text-center">
          <Calendar className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm font-medium">No interviews {filterStatus ? `with status "${filterStatus}"` : 'scheduled yet'}</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Schedule your first interview →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((iv) => {
            const cfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.scheduled;
            const Icon = cfg.icon;
            const cand = candidates.find((c) => c.id === iv.lead_id);
            return (
              <motion.div
                key={iv.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 flex flex-wrap items-center gap-4"
              >
                {/* Status icon */}
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg, `border ${cfg.border}`)}>
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                </div>

                {/* Candidate + interviewer */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{cand?.name ?? iv.lead_id}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border', cfg.bg, cfg.border, cfg.color)}>
                      {iv.status}
                    </span>
                    {iv.ai_suggested && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(iv.scheduled_at)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{iv.duration_minutes} min</span>
                    {iv.interviewer_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{iv.interviewer_name}</span>}
                    {iv.meeting_link && (
                      <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                        <Video className="w-3 h-3" />Join
                      </a>
                    )}
                  </div>
                  {iv.notes && <p className="mt-1 text-[11px] text-zinc-600 italic">{iv.notes}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {iv.status === 'scheduled' && (
                    <button onClick={() => updateStatus(iv.id, 'confirmed')}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                      Confirm
                    </button>
                  )}
                  {iv.status === 'confirmed' && (
                    <button onClick={() => updateStatus(iv.id, 'completed')}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-500/15 border border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/25 transition-colors">
                      Done
                    </button>
                  )}
                  {(iv.status === 'scheduled' || iv.status === 'confirmed') && (
                    <button onClick={() => updateStatus(iv.id, 'cancelled')}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                      Cancel
                    </button>
                  )}
                  <button onClick={() => deleteInterview(iv.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-5 border-b border-white/8 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Schedule Interview
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none">×</button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Candidate select */}
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Candidate *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                      <select
                        value={form.lead_id}
                        onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
                        className="w-full pl-9 pr-8 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/40 appearance-none"
                      >
                        <option value="">Select a candidate…</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} — score {c.score}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* AI Suggest button */}
                  <button
                    onClick={suggestSlots}
                    disabled={!form.lead_id || aiLoading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                      form.lead_id && !aiLoading
                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20'
                        : 'border-white/8 text-zinc-600 cursor-not-allowed'
                    )}
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {aiLoading ? 'Generating slots…' : 'AI Suggest Time Slots'}
                  </button>

                  {/* AI suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-2">
                      {aiOverallTip && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {aiOverallTip}
                        </div>
                      )}
                      {aiSuggestions.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => applySlot(slot)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl bg-violet-500/8 border border-violet-500/20 text-left hover:bg-violet-500/15 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-violet-300">{slot.label} — {slot.duration_minutes} min</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{fmtDate(slot.scheduled_at)}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5 italic">{slot.interviewer_tip}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Date/time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={form.scheduled_at}
                        onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Duration (min)</label>
                      <input
                        type="number"
                        value={form.duration_minutes}
                        onChange={(e) => setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 45 }))}
                        min={15} max={180} step={15}
                        className="w-full px-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/40"
                      />
                    </div>
                  </div>

                  {/* Interviewer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Interviewer Name</label>
                      <input
                        value={form.interviewer_name}
                        onChange={(e) => setForm((f) => ({ ...f, interviewer_name: e.target.value }))}
                        placeholder="John Smith"
                        className="w-full px-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Interviewer Email</label>
                      <input
                        type="email"
                        value={form.interviewer_email}
                        onChange={(e) => setForm((f) => ({ ...f, interviewer_email: e.target.value }))}
                        placeholder="john@company.com"
                        className="w-full px-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40"
                      />
                    </div>
                  </div>

                  {/* Meeting link */}
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Meeting Link</label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                      <input
                        value={form.meeting_link}
                        onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))}
                        placeholder="https://meet.google.com/..."
                        className="w-full pl-9 pr-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Any notes or instructions..."
                      rows={2}
                      className="w-full px-3 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 resize-none"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-white/8 flex gap-2">
                  <button
                    onClick={saveInterview}
                    disabled={saving || !form.lead_id}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      !saving && form.lead_id
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    )}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Schedule Interview'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
