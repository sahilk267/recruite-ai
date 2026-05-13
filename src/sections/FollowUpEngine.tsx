import { useState, useEffect, useCallback } from 'react';
import {
  Repeat, Mail, MessageCircle, Plus, Trash2,
  RefreshCw, Toggle, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface SequenceStep {
  id: string;
  day: number;
  channel: string;
  subject: string;
  message: string;
  order_index: number;
}

interface Sequence {
  id: string;
  name: string;
  sequence_type: string;
  enabled: boolean;
  description: string;
  created_at: string;
  steps: SequenceStep[];
}

const TYPE_CONFIG = {
  recruiter:  { label: 'Recruiter',  color: 'text-blue-400 bg-blue-500/10' },
  candidate:  { label: 'Candidate',  color: 'text-violet-400 bg-violet-500/10' },
  payment:    { label: 'Payment',    color: 'text-amber-400 bg-amber-500/10' },
  deal:       { label: 'Deal',       color: 'text-emerald-400 bg-emerald-500/10' },
};

const EMPTY_SEQ = { name: '', sequence_type: 'recruiter', enabled: true, description: '' };
const EMPTY_STEP = { day: 0, channel: 'email', subject: '', message: '', order_index: 0 };

export function FollowUpEngine() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSeqModal, setShowSeqModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState<string | null>(null); // sequence id
  const [seqForm, setSeqForm] = useState({ ...EMPTY_SEQ });
  const [stepForm, setStepForm] = useState({ ...EMPTY_STEP });
  const [saving, setSaving] = useState(false);

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/followup/sequences');
      setSequences(res.data.data ?? []);
    } catch {
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSequences(); }, [fetchSequences]);

  const handleToggle = async (id: string, seq: Sequence) => {
    try {
      await apiClient.patch(`/api/followup/sequences/${id}`, { ...seq, enabled: !seq.enabled });
      setSequences(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleCreateSeq = async () => {
    if (!seqForm.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/api/followup/sequences', seqForm);
      toast.success('Sequence created');
      setShowSeqModal(false);
      setSeqForm({ ...EMPTY_SEQ });
      fetchSequences();
    } catch {
      toast.error('Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeq = async (id: string, name: string) => {
    if (!confirm(`Delete sequence "${name}"? All steps will be removed.`)) return;
    try {
      await apiClient.delete(`/api/followup/sequences/${id}`);
      toast.success('Sequence deleted');
      fetchSequences();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAddStep = async () => {
    if (!showStepModal) return;
    if (!stepForm.message.trim()) { toast.error('Message is required'); return; }
    setSaving(true);
    try {
      await apiClient.post(`/api/followup/sequences/${showStepModal}/steps`, stepForm);
      toast.success('Step added');
      setShowStepModal(null);
      setStepForm({ ...EMPTY_STEP });
      fetchSequences();
    } catch {
      toast.error('Add step failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async (seqId: string, stepId: string) => {
    try {
      await apiClient.delete(`/api/followup/sequences/${seqId}/steps/${stepId}`);
      toast.success('Step removed');
      fetchSequences();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Follow-Up Engine</h2>
          <p className="text-zinc-400 text-sm mt-1">Automated email & WhatsApp follow-up sequences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchSequences}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowSeqModal(true)}>
            <Plus className="w-4 h-4 mr-2" />New Sequence
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs mb-1">Total Sequences</p>
            <p className="text-white text-2xl font-bold">{sequences.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs mb-1">Active Sequences</p>
            <p className="text-white text-2xl font-bold">{sequences.filter(s => s.enabled).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs mb-1">Total Steps</p>
            <p className="text-white text-2xl font-bold">{sequences.reduce((a, s) => a + s.steps.length, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sequences */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No sequences yet. Create your first automated follow-up sequence.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map(seq => {
            const typeCfg = TYPE_CONFIG[seq.sequence_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.recruiter;
            const isExpanded = expanded === seq.id;
            return (
              <Card key={seq.id} className="bg-[#111] border-white/6 hover:border-white/10 transition-all">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch checked={seq.enabled} onCheckedChange={() => handleToggle(seq.id, seq)}
                        className="data-[state=checked]:bg-violet-600" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold truncate">{seq.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
                          <Badge variant="outline" className="border-white/10 text-zinc-400 text-xs">{seq.steps.length} steps</Badge>
                        </div>
                        {seq.description && <p className="text-zinc-500 text-xs truncate mt-0.5">{seq.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="border-white/10 h-7 text-xs"
                        onClick={() => { setShowStepModal(seq.id); setStepForm({ ...EMPTY_STEP, order_index: seq.steps.length }); }}>
                        <Plus className="w-3 h-3 mr-1" />Step
                      </Button>
                      <button onClick={() => handleDeleteSeq(seq.id, seq.name)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : seq.id)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  {isExpanded && seq.steps.length > 0 && (
                    <div className="border-t border-white/6 px-4 pb-4 pt-3 space-y-2">
                      {seq.steps.map(step => (
                        <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-white/5">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            {step.channel === 'email'
                              ? <Mail className="w-4 h-4 text-violet-400" />
                              : <MessageCircle className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-white text-sm font-medium">Day {step.day}</span>
                              <Badge variant="outline" className="border-white/10 text-zinc-400 text-xs capitalize">{step.channel}</Badge>
                              {step.subject && <span className="text-zinc-400 text-xs truncate">{step.subject}</span>}
                            </div>
                            <p className="text-zinc-500 text-xs line-clamp-2">{step.message}</p>
                          </div>
                          <button onClick={() => handleDeleteStep(seq.id, step.id)}
                            className="p-1 text-zinc-600 hover:text-red-400 rounded transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && seq.steps.length === 0 && (
                    <div className="border-t border-white/6 px-4 py-4 text-zinc-500 text-sm text-center">
                      No steps yet. Click "+ Step" to add the first action.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Sequence Modal */}
      <Dialog open={showSeqModal} onOpenChange={setShowSeqModal}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>New Follow-Up Sequence</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-zinc-300 text-sm">Sequence Name *</Label>
              <Input value={seqForm.name} onChange={e => setSeqForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Recruiter 7-Day Warm-Up" />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Type</Label>
              <Select value={seqForm.sequence_type} onValueChange={v => setSeqForm(f => ({ ...f, sequence_type: v }))}>
                <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {Object.entries(TYPE_CONFIG).map(([v, cfg]) => <SelectItem key={v} value={v}>{cfg.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Description</Label>
              <Textarea value={seqForm.description} onChange={e => setSeqForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowSeqModal(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreateSeq} disabled={saving}>
                {saving ? 'Creating...' : 'Create Sequence'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Step Modal */}
      <Dialog open={!!showStepModal} onOpenChange={() => setShowStepModal(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Add Follow-Up Step</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-sm">Day</Label>
                <Input type="number" min={0} value={stepForm.day}
                  onChange={e => setStepForm(f => ({ ...f, day: Number(e.target.value) }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
                <p className="text-zinc-600 text-xs mt-1">Days after trigger</p>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Channel</Label>
                <Select value={stepForm.channel} onValueChange={v => setStepForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Subject (email only)</Label>
              <Input value={stepForm.subject} onChange={e => setStepForm(f => ({ ...f, subject: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Quick follow-up..." />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Message *</Label>
              <Textarea value={stepForm.message} onChange={e => setStepForm(f => ({ ...f, message: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={4}
                placeholder={'Hi {{name}},\n\nJust following up on...'} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowStepModal(null)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleAddStep} disabled={saving}>
                {saving ? 'Adding...' : 'Add Step'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
