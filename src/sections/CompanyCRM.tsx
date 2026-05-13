import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, ExternalLink,
  Phone, Mail, MapPin, Tag, ChevronRight, Globe, Users,
  LayoutGrid, List, RefreshCw, Linkedin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface Company {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  linkedin_url: string;
  website: string;
  industry: string;
  company_size: string;
  location: string;
  pipeline_stage: string;
  status: string;
  notes: string;
  tags: string[];
  created_at: string;
}

const STAGES = [
  { value: 'prospecting',         label: 'Prospecting',         color: 'bg-zinc-500' },
  { value: 'contacted',           label: 'Contacted',           color: 'bg-blue-500' },
  { value: 'permission_granted',  label: 'Permission Granted',  color: 'bg-violet-500' },
  { value: 'active_partner',      label: 'Active Partner',      color: 'bg-emerald-500' },
  { value: 'inactive',            label: 'Inactive',            color: 'bg-red-500' },
];

const INDUSTRIES = ['IT Services', 'SaaS', 'Healthcare', 'Construction', 'Staffing & Recruitment',
  'Finance', 'Education', 'Manufacturing', 'Retail', 'Logistics', 'Other'];

const stageColor = (stage: string) => STAGES.find(s => s.value === stage)?.color ?? 'bg-zinc-600';
const stageLabel = (stage: string) => STAGES.find(s => s.value === stage)?.label ?? stage;

const EMPTY: Partial<Company> = {
  company_name: '', contact_person: '', email: '', phone: '',
  linkedin_url: '', website: '', industry: '', company_size: '',
  location: '', pipeline_stage: 'prospecting', status: 'active', notes: '', tags: [],
};

export function CompanyCRM() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Partial<Company>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.q = search;
      if (stageFilter !== 'all') params.stage = stageFilter;
      if (industryFilter !== 'all') params.industry = industryFilter;
      const res = await apiClient.get('/api/companies', { params });
      setCompanies(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, industryFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (c: Company) => { setEditing(c); setForm({ ...c }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.company_name?.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/api/companies/${editing.id}`, form);
        toast.success('Company updated');
      } else {
        await apiClient.post('/api/companies', form);
        toast.success('Company created');
      }
      setShowModal(false);
      fetchCompanies();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/api/companies/${id}`);
      toast.success('Company deleted');
      fetchCompanies();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStageChange = async (id: string, stage: string) => {
    try {
      await apiClient.patch(`/api/companies/${id}/stage`, { stage });
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, pipeline_stage: stage } : c));
      toast.success('Stage updated');
    } catch {
      toast.error('Stage update failed');
    }
  };

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.value] = companies.filter(c => c.pipeline_stage === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Company CRM</h2>
          <p className="text-zinc-400 text-sm mt-1">{total} companies tracked across {STAGES.length} pipeline stages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchCompanies}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />Add Company
          </Button>
        </div>
      </div>

      {/* Stage Summary */}
      <div className="grid grid-cols-5 gap-3">
        {STAGES.map(s => (
          <button key={s.value} onClick={() => setStageFilter(stageFilter === s.value ? 'all' : s.value)}
            className={`rounded-xl p-3 border text-left transition-all ${stageFilter === s.value
              ? 'border-violet-500 bg-violet-500/10' : 'border-white/6 bg-[#111] hover:border-white/20'}`}>
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="text-white font-semibold text-xl">{stageCounts[s.value] ?? 0}</p>
            <p className="text-zinc-400 text-xs mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, contact, email..."
            className="pl-9 bg-[#111] border-white/10 text-white" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48 bg-[#111] border-white/10 text-white">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-48 bg-[#111] border-white/10 text-white">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-[#111] border border-white/10 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-violet-600' : 'text-zinc-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-violet-600' : 'text-zinc-400'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Company Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No companies found. Add your first company.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {companies.map(c => (
            <Card key={c.id} className="bg-[#111] border-white/6 hover:border-violet-500/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{c.company_name}</h3>
                    <p className="text-zinc-400 text-sm">{c.contact_person || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.company_name)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  {c.email && <div className="flex items-center gap-2 text-zinc-400"><Mail className="w-3.5 h-3.5" /><span className="truncate">{c.email}</span></div>}
                  {c.phone && <div className="flex items-center gap-2 text-zinc-400"><Phone className="w-3.5 h-3.5" />{c.phone}</div>}
                  {c.location && <div className="flex items-center gap-2 text-zinc-400"><MapPin className="w-3.5 h-3.5" />{c.location}</div>}
                  {c.industry && <div className="flex items-center gap-2 text-zinc-400"><Building2 className="w-3.5 h-3.5" />{c.industry} · {c.company_size}</div>}
                </div>

                <div className="flex items-center justify-between">
                  <Select value={c.pipeline_stage} onValueChange={v => handleStageChange(c.id, v)}>
                    <SelectTrigger className="h-7 text-xs bg-transparent border-white/10 w-44">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${stageColor(c.pipeline_stage)}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {STAGES.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors"><Linkedin className="w-3.5 h-3.5" /></a>}
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"><Globe className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>

                {(c.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(c.tags ?? []).map(t => <Badge key={t} variant="outline" className="text-xs border-white/10 text-zinc-400">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Company' : 'Add Company'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-zinc-300 text-sm">Company Name *</Label>
                <Input value={form.company_name ?? ''} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="TechSphere India" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Contact Person</Label>
                <Input value={form.contact_person ?? ''} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Email</Label>
                <Input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" type="email" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Phone</Label>
                <Input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Location</Label>
                <Input value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Industry</Label>
                <Select value={form.industry ?? ''} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Company Size</Label>
                <Select value={form.company_size ?? ''} onValueChange={v => setForm(f => ({ ...f, company_size: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {['1-10', '10-50', '50-200', '200-500', '500+'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Pipeline Stage</Label>
                <Select value={form.pipeline_stage ?? 'prospecting'} onValueChange={v => setForm(f => ({ ...f, pipeline_stage: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">LinkedIn URL</Label>
                <Input value={form.linkedin_url ?? ''} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="https://linkedin.com/company/..." />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Website</Label>
                <Input value={form.website ?? ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Label className="text-zinc-300 text-sm">Notes</Label>
                <Textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={3} />
              </div>
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
