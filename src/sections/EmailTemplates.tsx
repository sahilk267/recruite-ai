import { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, Search, Edit2, Trash2, Copy, Save, X, RefreshCw } from 'lucide-react';
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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  variables: string[];
  created_at: string;
}

const EMPTY: Partial<EmailTemplate> = {
  name: '', subject: '', body: '', template_type: 'email', variables: [],
};

const TYPE_COLORS: Record<string, string> = {
  email:     'text-blue-400 bg-blue-500/10',
  whatsapp:  'text-emerald-400 bg-emerald-500/10',
  linkedin:  'text-sky-400 bg-sky-500/10',
};

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<Partial<EmailTemplate>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/templates');
      setTemplates(res.data.data ?? res.data ?? []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit   = (t: EmailTemplate) => { setEditing(t); setForm({ ...t }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.body?.trim()) { toast.error('Name and body are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/api/templates/${editing.id}`, form);
        toast.success('Template updated');
      } else {
        await apiClient.post('/api/templates', form);
        toast.success('Template created');
      }
      setShowModal(false);
      fetchTemplates();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await apiClient.delete(`/api/templates/${id}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleCopy = (t: EmailTemplate) => {
    navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Templates</h2>
          <p className="text-zinc-400 text-sm mt-1">{templates.length} templates — reusable outreach scripts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchTemplates}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />New Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
          className="pl-9 bg-[#111] border-white/10 text-white" />
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? 'No templates match your search.' : 'No templates yet. Create your first one.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className="bg-[#111] border-white/6 hover:border-violet-500/20 transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{t.name}</h3>
                    <p className="text-zinc-400 text-sm truncate mt-0.5">{t.subject || '(no subject)'}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ml-2 border-0 ${TYPE_COLORS[t.template_type] ?? 'text-zinc-400 bg-zinc-800'}`}>
                    {t.template_type}
                  </Badge>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3 mb-4">
                  {t.body}
                </p>
                {(t.variables ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.variables.map(v => (
                      <span key={v} className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 pt-2 border-t border-white/6">
                  <button onClick={() => setPreview(t)} className="flex-1 text-xs text-zinc-400 hover:text-white py-1 transition-colors">Preview</button>
                  <button onClick={() => handleCopy(t)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(t)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-zinc-300 text-sm">Template Name *</Label>
                <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Classic Intro Email" />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Subject</Label>
                <Input value={form.subject ?? ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white" placeholder="Exciting opportunity for you..." />
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Type</Label>
                <Select value={form.template_type ?? 'email'} onValueChange={v => setForm(f => ({ ...f, template_type: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-zinc-300 text-sm">Body *</Label>
                <Textarea value={form.body ?? ''} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none font-mono text-xs" rows={10}
                  placeholder={'Hi {{name}},\n\nI came across your profile and wanted to reach out...'} />
                <p className="text-zinc-600 text-xs mt-1">Use {'{{variable}}'} for personalization placeholders</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />{editing ? 'Update' : 'Create'}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {preview?.subject && (
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-zinc-400 text-xs font-medium mb-1">SUBJECT</p>
                <p className="text-white text-sm">{preview.subject}</p>
              </div>
            )}
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <p className="text-zinc-400 text-xs font-medium mb-2">BODY</p>
              <pre className="text-zinc-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">{preview?.body}</pre>
            </div>
            <Button className="w-full border-white/10" variant="outline" onClick={() => { preview && handleCopy(preview); }}>
              <Copy className="w-4 h-4 mr-2" />Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
