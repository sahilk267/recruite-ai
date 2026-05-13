import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Send, Trash2, Users, CheckCircle2,
  XCircle, Clock, RefreshCw, Eye, Filter, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  persona_id: string | null;
  persona_name: string | null;
  filter_stage: string | null;
  filter_score_min: number;
  filter_score_max: number;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Persona {
  id: string;
  name: string;
  email: string;
  role: string;
  tone: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'text-zinc-400 bg-zinc-800',     icon: <Clock className="w-3 h-3" /> },
  scheduled: { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/10',   icon: <Clock className="w-3 h-3" /> },
  running:   { label: 'Running',   color: 'text-amber-400 bg-amber-500/10', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  completed: { label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10', icon: <CheckCircle2 className="w-3 h-3" /> },
};

const STAGES = ['screened', 'contacted', 'interviewing', 'offer', 'hired'];

const EMPTY_FORM = {
  name: '', subject: '', body: '', persona_id: '',
  filter_stage: '', filter_score_min: 0, filter_score_max: 100,
};

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        apiClient.get('/api/email-campaigns'),
        apiClient.get('/api/personas'),
      ]);
      setCampaigns(cRes.data.data ?? []);
      setPersonas(pRes.data.data ?? []);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, subject: form.subject, body: form.body,
        persona_id: form.persona_id || null,
        filter_stage: form.filter_stage || null,
        filter_score_min: Number(form.filter_score_min),
        filter_score_max: Number(form.filter_score_max),
      };
      await apiClient.post('/api/email-campaigns', payload);
      toast.success('Campaign created');
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      fetchAll();
    } catch {
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      const res = await apiClient.post(`/api/email-campaigns/${id}/send`);
      toast.success(`Campaign sent to ${res.data.sent_count} recipients`);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Send failed');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/email-campaigns/${id}`);
      toast.success('Campaign deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const totalSent = campaigns.reduce((a, c) => a + c.sent_count, 0);
  const totalRecipients = campaigns.reduce((a, c) => a + c.total_recipients, 0);
  const completed = campaigns.filter(c => c.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Campaigns</h2>
          <p className="text-zinc-400 text-sm mt-1">Bulk outreach campaigns with AI personas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, icon: Mail, color: 'text-violet-400' },
          { label: 'Total Recipients', value: totalRecipients.toLocaleString(), icon: Users, color: 'text-blue-400' },
          { label: 'Emails Sent', value: totalSent.toLocaleString(), icon: Send, color: 'text-emerald-400' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-cyan-400' },
        ].map(s => (
          <Card key={s.label} className="bg-[#111] border-white/6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-zinc-400 text-xs">{s.label}</p>
                  <p className="text-white text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No campaigns yet. Create your first email campaign.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            const pct = c.total_recipients > 0 ? Math.round(c.sent_count / c.total_recipients * 100) : 0;
            return (
              <Card key={c.id} className="bg-[#111] border-white/6 hover:border-white/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{c.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm truncate">{c.subject}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.total_recipients} recipients</span>
                        {c.persona_name && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />via {c.persona_name}</span>}
                        {c.filter_stage && <span className="flex items-center gap-1"><Filter className="w-3 h-3" />Stage: {c.filter_stage}</span>}
                        <span>Score {c.filter_score_min}–{c.filter_score_max}</span>
                      </div>
                      {c.status !== 'draft' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                            <span>{c.sent_count} sent</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-white/10" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          onClick={() => handleSend(c.id)} disabled={sending === c.id}>
                          {sending === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                          Send
                        </Button>
                      )}
                      <button onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-zinc-300 text-sm">Campaign Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Q3 Recruiter Outreach" />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Subject Line *</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Exciting opportunities for you..." />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Email Body *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={5}
                placeholder="Hi {{name}},&#10;&#10;We have exciting opportunities matching your profile..." />
              <p className="text-zinc-500 text-xs mt-1">Use {'{{name}}'}, {'{{email}}'}, {'{{score}}'} as variables</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-sm">Sender Persona</Label>
                <Select value={form.persona_id} onValueChange={v => setForm(f => ({ ...f, persona_id: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue placeholder="Any persona" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="">Any persona</SelectItem>
                    {personas.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Filter by Stage</Label>
                <Select value={form.filter_stage} onValueChange={v => setForm(f => ({ ...f, filter_stage: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="">All stages</SelectItem>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Min Score</Label>
                <Input type="number" min={0} max={100} value={form.filter_score_min}
                  onChange={e => setForm(f => ({ ...f, filter_score_min: Number(e.target.value) }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Max Score</Label>
                <Input type="number" min={0} max={100} value={form.filter_score_max}
                  onChange={e => setForm(f => ({ ...f, filter_score_max: Number(e.target.value) }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
