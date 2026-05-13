import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Search, Send, Trash2, RefreshCw,
  CheckCircle2, Clock, Eye, XCircle, IndianRupee, Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  title: string;
  company_id: string | null;
  company_name: string | null;
  recruiter_id: string | null;
  status: string;
  amount: number;
  currency: string;
  notes: string;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    color: 'text-zinc-400 bg-zinc-800',        icon: <Edit2 className="w-3 h-3" /> },
  sent:     { label: 'Sent',     color: 'text-blue-400 bg-blue-500/10',     icon: <Send className="w-3 h-3" /> },
  viewed:   { label: 'Viewed',   color: 'text-amber-400 bg-amber-500/10',   icon: <Eye className="w-3 h-3" /> },
  accepted: { label: 'Accepted', color: 'text-emerald-400 bg-emerald-500/10', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10',       icon: <XCircle className="w-3 h-3" /> },
};

const EMPTY = { title: 'New Proposal', company_id: '', recruiter_id: '', amount: 0, currency: 'INR', notes: '' };

export function ProposalSystem() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        apiClient.get('/api/proposals'),
        apiClient.get('/api/companies'),
      ]);
      setProposals(pRes.data.data ?? []);
      setCompanies(cRes.data.data ?? []);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = proposals.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit = (p: Proposal) => {
    setEditing(p);
    setForm({ title: p.title, company_id: p.company_id ?? '', recruiter_id: p.recruiter_id ?? '',
              amount: p.amount, currency: p.currency, notes: p.notes });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, company_id: form.company_id || null, recruiter_id: form.recruiter_id || null };
      if (editing) {
        await apiClient.patch(`/api/proposals/${editing.id}`, payload);
        toast.success('Proposal updated');
      } else {
        await apiClient.post('/api/proposals', payload);
        toast.success('Proposal created');
      }
      setShowModal(false);
      fetchAll();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await apiClient.post(`/api/proposals/${id}/send`);
      toast.success('Proposal marked as sent!');
      fetchAll();
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete proposal "${title}"?`)) return;
    try {
      await apiClient.delete(`/api/proposals/${id}`);
      toast.success('Proposal deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const totalValue = proposals.reduce((a, p) => a + p.amount, 0);
  const acceptedValue = proposals.filter(p => p.status === 'accepted').reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Proposal System</h2>
          <p className="text-zinc-400 text-sm mt-1">{proposals.length} proposals tracked</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />New Proposal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Proposals', value: proposals.length },
          { label: 'Pipeline Value', value: `₹${(totalValue / 1000).toFixed(0)}K` },
          { label: 'Accepted Value', value: `₹${(acceptedValue / 1000).toFixed(0)}K` },
          { label: 'Win Rate', value: proposals.length ? `${Math.round(proposals.filter(p => p.status === 'accepted').length / proposals.length * 100)}%` : '0%' },
        ].map(s => (
          <Card key={s.label} className="bg-[#111] border-white/6">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-xs mb-1">{s.label}</p>
              <p className="text-white text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search proposals..."
          className="pl-9 bg-[#111] border-white/10 text-white" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No proposals. Create your first partnership proposal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.draft;
            return (
              <Card key={p.id} className="bg-[#111] border-white/6 hover:border-white/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{p.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs shrink-0 ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {Number(p.amount).toLocaleString()} {p.currency}
                        </span>
                        {p.company_name && <span>{p.company_name}</span>}
                        {p.sent_at && <span>Sent {new Date(p.sent_at).toLocaleDateString()}</span>}
                        {p.accepted_at && <span className="text-emerald-400">Accepted {new Date(p.accepted_at).toLocaleDateString()}</span>}
                      </div>
                      {p.notes && <p className="text-zinc-500 text-xs mt-1 truncate">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === 'draft' && (
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleSend(p.id)} disabled={sending === p.id}>
                          {sending === p.id
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : <><Send className="w-3 h-3 mr-1" />Send</>}
                        </Button>
                      )}
                      <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
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

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Proposal' : 'New Proposal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-zinc-300 text-sm">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-sm">Company</Label>
                <Select value={form.company_id} onValueChange={v => setForm(f => ({ ...f, company_id: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="">No company</SelectItem>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Amount ({form.currency})</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
