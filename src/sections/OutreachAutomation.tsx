import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Wand2, Send, Trash2, Edit3, CheckCircle, Clock,
  Star, Layers, RefreshCw, Users, Filter, ChevronDown,
  ChevronUp, Save, Eye, Zap, BarChart3, Settings,
  ArrowUpRight, Archive, Copy, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import apiClient from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierTemplate {
  id: string;
  tier: 'high' | 'medium' | 'low';
  label: string;
  subject: string;
  body: string;
  tone: string;
}

interface OutreachDraft {
  id: string;
  lead_id: string;
  tier: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'archived';
  lead_name: string;
  lead_email: string;
  lead_score: number;
  lead_skills_snapshot: string[];
  recruiter_name: string;
  recruiter_company: string;
  sent_at: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  score: number;
  quality: string;
  skills: string[];
  experience: number;
}

type Tab = 'generate' | 'drafts' | 'templates';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  high:   { label: 'High Match',   min: 75, color: 'emerald', badge: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
  medium: { label: 'Medium Match', min: 50, color: 'amber',   badge: 'bg-amber-600/20 text-amber-400 border-amber-500/30' },
  low:    { label: 'Low Match',    min: 0,  color: 'red',     badge: 'bg-red-600/20 text-red-400 border-red-500/30' },
};

function scoreTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OutreachAutomation() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generate tab state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [filterTier, setFilterTier] = useState<string>('all');
  const [recruiters, setRecruiters] = useState<{ id: string; recruiter_name: string; company_name: string }[]>([]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Drafts tab state
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<{ id: string; subject: string; body: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSending, setIsSending] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Templates tab state
  const [tierTemplates, setTierTemplates] = useState<TierTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TierTemplate | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const res = await apiClient.get('/api/leads', { params: { pageSize: 50 } });
      setLeads(res.data.data || []);
    } catch { toast.error('Failed to load leads'); }
    finally { setIsLoadingLeads(false); }
  }, []);

  const fetchDrafts = useCallback(async () => {
    setIsLoadingDrafts(true);
    try {
      const res = await apiClient.get('/api/outreach/drafts');
      setDrafts(res.data.data || []);
    } catch { toast.error('Failed to load drafts'); }
    finally { setIsLoadingDrafts(false); }
  }, []);

  const fetchTierTemplates = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/outreach/tier-templates');
      setTierTemplates(res.data.data || []);
    } catch { toast.error('Failed to load tier templates'); }
  }, []);

  const fetchRecruiters = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/recruiters', { params: { pageSize: 20 } });
      setRecruiters(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchRecruiters();
    fetchTierTemplates();
  }, [fetchLeads, fetchRecruiters, fetchTierTemplates]);

  useEffect(() => {
    if (activeTab === 'drafts') fetchDrafts();
  }, [activeTab, fetchDrafts]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const generateDrafts = async () => {
    if (selectedLeadIds.size === 0) { toast.error('Select at least one candidate'); return; }
    setIsGenerating(true);
    try {
      const res = await apiClient.post('/api/outreach/auto-draft', {
        lead_ids: Array.from(selectedLeadIds),
        recruiter_id: selectedRecruiterId || null,
      });
      toast.success(`Generated ${res.data.generated} email drafts`);
      setSelectedLeadIds(new Set());
      setActiveTab('drafts');
      fetchDrafts();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate drafts');
    } finally { setIsGenerating(false); }
  };

  const sendDraft = async (draftId: string) => {
    setIsSending(draftId);
    try {
      await apiClient.post(`/api/outreach/drafts/${draftId}/send`);
      setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: 'sent', sent_at: new Date().toISOString() } : d));
      toast.success('Email marked as sent');
    } catch { toast.error('Failed to send email'); }
    finally { setIsSending(null); }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await apiClient.delete(`/api/outreach/drafts/${draftId}`);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success('Draft deleted');
    } catch { toast.error('Failed to delete draft'); }
  };

  const sendAllDrafts = async () => {
    const pendingCount = drafts.filter(d => d.status === 'draft').length;
    if (!pendingCount) {
      toast.error('No pending drafts to send');
      return;
    }
    setIsSendingAll(true);
    try {
      const res = await apiClient.post('/api/outreach/drafts/send-all');
      const sentAt = res.data.sent_at || new Date().toISOString();
      setDrafts(prev => prev.map(d => d.status === 'draft' ? { ...d, status: 'sent', sent_at: sentAt } : d));
      toast.success(`Sent ${res.data.sent_count || pendingCount} drafts`);
    } catch {
      toast.error('Failed to send all drafts');
    } finally {
      setIsSendingAll(false);
    }
  };

  const saveDraftEdit = async () => {
    if (!editingDraft) return;
    try {
      await apiClient.patch(`/api/outreach/drafts/${editingDraft.id}`, {
        subject: editingDraft.subject,
        body: editingDraft.body,
      });
      setDrafts(prev => prev.map(d => d.id === editingDraft.id ? { ...d, subject: editingDraft.subject, body: editingDraft.body } : d));
      setEditingDraft(null);
      toast.success('Draft updated');
    } catch { toast.error('Failed to update draft'); }
  };

  const saveTierTemplate = async () => {
    if (!editingTemplate) return;
    setIsSavingTemplate(true);
    try {
      await apiClient.patch(`/api/outreach/tier-templates/${editingTemplate.tier}`, {
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        tone: editingTemplate.tone,
      });
      setTierTemplates(prev => prev.map(t => t.tier === editingTemplate.tier ? editingTemplate : t));
      setEditingTemplate(null);
      toast.success('Tier template saved');
    } catch { toast.error('Failed to save template'); }
    finally { setIsSavingTemplate(false); }
  };

  // ─── Computed ───────────────────────────────────────────────────────────────

  const filteredLeads = leads.filter(l => {
    if (filterTier === 'all') return true;
    return scoreTier(l.score) === filterTier;
  });

  const filteredDrafts = drafts.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const draftStats = {
    total: drafts.length,
    draft: drafts.filter(d => d.status === 'draft').length,
    sent: drafts.filter(d => d.status === 'sent').length,
  };

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedLeadIds(prev => { const next = new Set(prev); filteredLeads.forEach(l => next.delete(l.id)); return next; });
    } else {
      setSelectedLeadIds(prev => { const next = new Set(prev); filteredLeads.forEach(l => next.add(l.id)); return next; });
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Automated Outreach</h2>
            <p className="text-sm text-zinc-500">AI-drafted personalized emails by candidate score tier</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-4">
          {[
            { label: 'Drafts', val: draftStats.draft, color: 'text-violet-400' },
            { label: 'Sent', val: draftStats.sent, color: 'text-emerald-400' },
            { label: 'Total', val: draftStats.total, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl w-fit">
        {([
          { id: 'generate' as Tab, label: 'Generate Drafts', icon: Wand2 },
          { id: 'drafts'   as Tab, label: 'Draft Queue',     icon: Mail, count: draftStats.draft },
          { id: 'templates' as Tab, label: 'Tier Templates',  icon: Settings },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB: GENERATE ────────────────────────────────────────────────── */}
        {activeTab === 'generate' && (
          <motion.div key="gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Candidate Selection */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-400" />
                      Select Candidates ({selectedLeadIds.size} selected)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Tier filter */}
                      <div className="flex gap-1">
                        {['all', 'high', 'medium', 'low'].map(t => (
                          <button
                            key={t}
                            onClick={() => setFilterTier(t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                              filterTier === t
                                ? t === 'high' ? 'bg-emerald-600 text-white'
                                  : t === 'medium' ? 'bg-amber-600 text-white'
                                  : t === 'low' ? 'bg-red-600 text-white'
                                  : 'bg-violet-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {t === 'all' ? 'All' : TIER_CONFIG[t as keyof typeof TIER_CONFIG].label}
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={fetchLeads} disabled={isLoadingLeads}
                        className="text-zinc-500 hover:text-white h-7 px-2">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeads ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Select All header */}
                  <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                    <span className="text-xs text-zinc-500">Select all visible ({filteredLeads.length})</span>
                  </div>

                  {isLoadingLeads ? (
                    <div className="py-12 text-center text-zinc-500 text-sm flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading candidates...
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-sm">No candidates found</div>
                  ) : (
                    <div className="divide-y divide-white/4 max-h-[480px] overflow-y-auto">
                      {filteredLeads.map(lead => {
                        const tier = scoreTier(lead.score);
                        const cfg = TIER_CONFIG[tier];
                        const isSelected = selectedLeadIds.has(lead.id);
                        return (
                          <div
                            key={lead.id}
                            onClick={() => {
                              setSelectedLeadIds(prev => {
                                const next = new Set(prev);
                                isSelected ? next.delete(lead.id) : next.add(lead.id);
                                return next;
                              });
                            }}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                              isSelected ? 'bg-violet-600/8' : 'hover:bg-white/3'
                            }`}
                          >
                            <input type="checkbox" checked={isSelected} readOnly
                              className="w-4 h-4 rounded accent-violet-500 pointer-events-none flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">{lead.name}</p>
                                <Badge className={`text-xs border ${cfg.badge}`}>{cfg.label}</Badge>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {lead.email} · {lead.experience}y exp · {lead.skills?.slice(0, 3).join(', ')}
                              </p>
                            </div>
                            <div className={`text-lg font-bold flex-shrink-0 ${
                              tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {lead.score}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generation Options */}
            <div className="space-y-4">
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-400" />
                    Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recruiter Target */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-medium">Target Recruiter (optional)</label>
                    <select
                      value={selectedRecruiterId}
                      onChange={e => setSelectedRecruiterId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none text-white"
                    >
                      <option value="">— No specific recruiter —</option>
                      {recruiters.map(r => (
                        <option key={r.id} value={r.id}>{r.recruiter_name} ({r.company_name})</option>
                      ))}
                    </select>
                  </div>

                  {/* Tier preview */}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 font-medium">Email tone by tier</label>
                    {(['high', 'medium', 'low'] as const).map(t => {
                      const cfg = TIER_CONFIG[t];
                      const count = filteredLeads.filter(l => scoreTier(l.score) === t && selectedLeadIds.has(l.id)).length;
                      return (
                        <div key={t} className={`flex items-center justify-between p-2.5 rounded-lg border ${cfg.badge}`}>
                          <div>
                            <p className="text-xs font-medium">{cfg.label}</p>
                            <p className="text-[10px] opacity-70">
                              {t === 'high' ? 'Urgent & enthusiastic' : t === 'medium' ? 'Professional & informative' : 'Brief & exploratory'}
                            </p>
                          </div>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={generateDrafts}
                    disabled={isGenerating || selectedLeadIds.size === 0}
                    className="w-full gradient-primary hover:opacity-90 text-sm"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" /> Generate {selectedLeadIds.size > 0 ? selectedLeadIds.size : ''} Drafts</>
                    )}
                  </Button>

                  <p className="text-[10px] text-zinc-600 text-center">
                    Each draft is personalized with the candidate's name, skills, experience, and score tier
                  </p>
                </CardContent>
              </Card>

              {/* How it works */}
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-medium text-zinc-400">How it works</p>
                  {[
                    { icon: Star, text: 'Score determines email tone and urgency' },
                    { icon: Wand2, text: 'AI fills in name, skills & experience' },
                    { icon: Edit3, text: 'Review and edit before sending' },
                    { icon: Send, text: 'Mark as sent when delivered' },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-500">
                        <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        {step.text}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ── TAB: DRAFTS ──────────────────────────────────────────────────── */}
        {activeTab === 'drafts' && (
          <motion.div key="drafts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-4">

            {/* Filters + refresh */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-1">
                {['all', 'draft', 'sent'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      filterStatus === s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}>
                    {s === 'all' ? `All (${draftStats.total})` : s === 'draft' ? `Pending (${draftStats.draft})` : `Sent (${draftStats.sent})`}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={fetchDrafts} disabled={isLoadingDrafts}
                className="text-zinc-500 hover:text-white h-7 px-2 gap-1.5 text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrafts ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={sendAllDrafts}
                disabled={isSendingAll || draftStats.draft === 0}
                className="text-xs gradient-primary hover:opacity-90 h-7 px-3 gap-1.5"
              >
                {isSendingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send All
              </Button>
            </div>

            {isLoadingDrafts ? (
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardContent className="py-16 text-center text-zinc-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading drafts...</p>
                </CardContent>
              </Card>
            ) : filteredDrafts.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardContent className="py-16 text-center">
                  <Mail className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                  <p className="text-zinc-400 text-sm">No {filterStatus !== 'all' ? filterStatus : ''} drafts yet</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {filterStatus === 'all' ? 'Go to "Generate Drafts" to auto-create personalized emails' : 'Change the filter to see other drafts'}
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('generate')}
                    className="mt-4 gradient-primary hover:opacity-90 text-xs">
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Generate Drafts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDrafts.map((draft, idx) => {
                  const tier = draft.tier as keyof typeof TIER_CONFIG;
                  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.low;
                  const isExpanded = expandedDraft === draft.id;
                  const isEditing = editingDraft?.id === draft.id;

                  return (
                    <motion.div key={draft.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}>
                      <Card className={`bg-[#1a1a1a] border-white/6 transition-all ${
                        draft.status === 'sent' ? 'opacity-70' : ''
                      }`}>
                        <CardContent className="p-4">
                          {/* Header row */}
                          <div className="flex items-start gap-3">
                            {/* Tier color bar */}
                            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                              tier === 'high' ? 'bg-emerald-500' : tier === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{draft.lead_name}</p>
                                  <Badge className={`text-xs border ${cfg.badge}`}>{cfg.label}</Badge>
                                  {draft.status === 'sent' ? (
                                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Sent
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-zinc-700/50 text-zinc-400 text-xs">
                                      <Clock className="w-3 h-3 mr-1" /> Draft
                                    </Badge>
                                  )}
                                </div>
                                <div className={`text-base font-bold flex-shrink-0 ${
                                  tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  Score {draft.lead_score}
                                </div>
                              </div>

                              <p className="text-xs text-zinc-500 mt-0.5">
                                To: {draft.lead_email}
                                {draft.recruiter_company && ` · Via ${draft.recruiter_company}`}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1 font-medium truncate">Subject: {draft.subject}</p>

                              {/* Skills */}
                              {draft.lead_skills_snapshot?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {draft.lead_skills_snapshot.slice(0, 4).map((s, i) => (
                                    <Badge key={i} className="bg-zinc-800 text-zinc-400 text-[10px]">{s}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expand / edit / actions */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                            <button onClick={() => setExpandedDraft(isExpanded ? null : draft.id)}
                              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              {isExpanded ? 'Hide email' : 'Preview email'}
                            </button>

                            <div className="flex-1" />

                            {draft.status === 'draft' && (
                              <>
                                <Button size="sm" variant="ghost"
                                  onClick={() => setEditingDraft(isEditing ? null : { id: draft.id, subject: draft.subject, body: draft.body })}
                                  className="text-xs text-zinc-400 hover:text-white h-7 px-2 gap-1">
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <Button size="sm"
                                  onClick={() => sendDraft(draft.id)}
                                  disabled={isSending === draft.id}
                                  className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 h-7 px-3 gap-1">
                                  {isSending === draft.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                  Send
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost"
                              onClick={() => deleteDraft(draft.id)}
                              className="text-xs text-zinc-600 hover:text-red-400 h-7 px-2">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Expanded preview / inline edit */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
                                        <input
                                          value={editingDraft!.subject}
                                          onChange={e => setEditingDraft(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                                          className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Body</label>
                                        <textarea
                                          value={editingDraft!.body}
                                          onChange={e => setEditingDraft(prev => prev ? { ...prev, body: e.target.value } : prev)}
                                          rows={8}
                                          className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none resize-none font-mono"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={saveDraftEdit}
                                          className="text-xs gradient-primary hover:opacity-90 h-7 px-3 gap-1">
                                          <Save className="w-3.5 h-3.5" /> Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingDraft(null)}
                                          className="text-xs text-zinc-400 h-7 px-3">Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/6 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                      {draft.body}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: TEMPLATES ───────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-4">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {tierTemplates.map(tpl => {
                const cfg = TIER_CONFIG[tpl.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.low;
                const isEditing = editingTemplate?.tier === tpl.tier;

                return (
                  <Card key={tpl.tier} className={`bg-[#1a1a1a] border-white/6 transition-all ${
                    isEditing ? 'ring-1 ring-violet-500/40' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            tpl.tier === 'high' ? 'bg-emerald-400' : tpl.tier === 'medium' ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          {cfg.label}
                        </CardTitle>
                        <Badge className={`text-xs border ${cfg.badge}`}>
                          {tpl.tier === 'high' ? '75+ pts' : tpl.tier === 'medium' ? '50–74 pts' : '<50 pts'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isEditing ? (
                        <>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Subject line</label>
                            <input
                              value={editingTemplate!.subject}
                              onChange={e => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs focus:border-violet-500/50 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Email body</label>
                            <p className="text-[10px] text-zinc-600 mb-1">
                              Variables: {'{{candidate_name}}'} {'{{skills}}'} {'{{experience}}'} {'{{score}}'} {'{{recruiter_name}}'} {'{{company}}'}
                            </p>
                            <textarea
                              value={editingTemplate!.body}
                              onChange={e => setEditingTemplate(prev => prev ? { ...prev, body: e.target.value } : prev)}
                              rows={9}
                              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs focus:border-violet-500/50 outline-none resize-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Tone</label>
                            <select
                              value={editingTemplate!.tone}
                              onChange={e => setEditingTemplate(prev => prev ? { ...prev, tone: e.target.value } : prev)}
                              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs focus:border-violet-500/50 outline-none text-white"
                            >
                              <option value="urgent">Urgent & Enthusiastic</option>
                              <option value="professional">Professional & Informative</option>
                              <option value="exploratory">Brief & Exploratory</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveTierTemplate} disabled={isSavingTemplate}
                              className="flex-1 text-xs gradient-primary hover:opacity-90 h-8 gap-1">
                              {isSavingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save Template
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)}
                              className="text-xs text-zinc-400 h-8 px-3">Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-lg bg-black/30 border border-white/6">
                            <p className="text-[10px] text-zinc-500 mb-0.5">Subject</p>
                            <p className="text-xs font-medium truncate">{tpl.subject}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/30 border border-white/6">
                            <p className="text-[10px] text-zinc-500 mb-1">Preview</p>
                            <p className="text-xs text-zinc-400 font-mono line-clamp-4 leading-relaxed">{tpl.body}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-zinc-800 text-zinc-400 text-[10px] capitalize">{tpl.tone}</Badge>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(tpl)}
                              className="text-xs text-zinc-400 hover:text-white h-7 px-2 gap-1">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-[#1a1a1a] border-white/6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Template Variables</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Use these placeholders in subject and body — they'll be replaced automatically when generating drafts:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['{{candidate_name}}', '{{skills}}', '{{experience}}', '{{score}}', '{{quality}}', '{{recruiter_name}}', '{{company}}'].map(v => (
                        <code key={v} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-violet-300">{v}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
