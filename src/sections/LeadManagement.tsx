import { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, Star, ShieldCheck, Clock,
  Briefcase, Search, Filter, Download, ExternalLink,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: number;
  score: number;
  quality: string;
  pipeline_stage: string;
  status: string;
  created_at: string;
}

const QUALITY_COLOR: Record<string, string> = {
  High:   'text-emerald-400 bg-emerald-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Low:    'text-red-400 bg-red-500/10',
};

const STAGE_COLOR: Record<string, string> = {
  screened:     'text-blue-400',
  contacted:    'text-violet-400',
  interviewing: 'text-amber-400',
  offer:        'text-cyan-400',
  hired:        'text-emerald-400',
};

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.q = search;
      if (stageFilter !== 'all') params.stage = stageFilter;
      const res = await apiClient.get('/api/leads', { params });
      setLeads(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalPages = Math.ceil(total / pageSize);

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Management</h2>
          <p className="text-zinc-400 text-sm mt-1">{total} candidates in the system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchLeads}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-white/10">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, skill..."
            className="pl-9 bg-[#111] border-white/10 text-white" />
        </div>
        <Select value={stageFilter} onValueChange={v => { setStageFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48 bg-[#111] border-white/10 text-white">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="screened">Screened</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No candidates found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {leads.map(lead => (
              <Card key={lead.id} className="bg-[#111] border-white/6 hover:border-violet-500/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <span className="text-violet-300 text-sm font-semibold">
                        {lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-medium">{lead.name}</span>
                        <span className={`text-xs font-medium ${scoreColor(lead.score)}`}>
                          {lead.score}/100
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${QUALITY_COLOR[lead.quality] ?? 'text-zinc-400 bg-zinc-800'}`}>
                          {lead.quality}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.experience > 0 && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{lead.experience}y exp</span>}
                        <span className={`flex items-center gap-1 ${STAGE_COLOR[lead.pipeline_stage] ?? 'text-zinc-400'}`}>
                          <Clock className="w-3 h-3" />
                          {lead.pipeline_stage.charAt(0).toUpperCase() + lead.pipeline_stage.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="hidden md:flex flex-wrap gap-1 max-w-xs justify-end">
                      {(lead.skills ?? []).slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300">{s}</span>
                      ))}
                      {(lead.skills ?? []).length > 3 && (
                        <span className="text-xs text-zinc-500">+{lead.skills.length - 3}</span>
                      )}
                    </div>

                    {/* Date */}
                    <span className="text-zinc-600 text-xs shrink-0 hidden lg:block">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-zinc-500 text-sm">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/10" disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-zinc-400 text-sm px-2 self-center">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="border-white/10" disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
