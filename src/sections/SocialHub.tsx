import { useState, useEffect, useCallback } from 'react';
import {
  Share2, Plus, Trash2, Copy, RefreshCw, Sparkles,
  CheckCircle2, Clock, Edit2, Globe, Linkedin,
  Twitter, Facebook, Instagram, ExternalLink, Link2, LinkIcon, AlertCircle, Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  tone: string;
  status: string;
  related_job_id: string | null;
  scheduled_at: string | null;
  created_at: string;
}

interface LinkedInStatus {
  connected: boolean;
  person_urn: string | null;
  company_id: string | null;
  company_page: string | null;
}

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',   icon: Linkedin,  color: 'text-blue-400',  bg: 'bg-blue-500/10',  charLimit: 3000 },
  { id: 'twitter',   label: 'Twitter/X',  icon: Twitter,   color: 'text-sky-400',   bg: 'bg-sky-500/10',   charLimit: 280 },
  { id: 'facebook',  label: 'Facebook',   icon: Facebook,  color: 'text-blue-500',  bg: 'bg-blue-600/10',  charLimit: 63206 },
  { id: 'instagram', label: 'Instagram',  icon: Instagram, color: 'text-pink-400',  bg: 'bg-pink-500/10',  charLimit: 2200 },
];

const TONES = ['professional', 'friendly', 'urgent', 'exciting', 'informative'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'text-zinc-400 bg-zinc-800' },
  scheduled: { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/10' },
  published: { label: 'Published', color: 'text-emerald-400 bg-emerald-500/10' },
};

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  const cfg = PLATFORMS.find(p => p.id === platform);
  if (!cfg) return <Globe className={className} />;
  return <cfg.icon className={className} />;
};

export function SocialHub() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [form, setForm] = useState({ platform: 'linkedin', tone: 'professional', topic: '', hashtag_count: 5 });
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [liStatus, setLiStatus] = useState<LinkedInStatus | null>(null);
  const [liConnecting, setLiConnecting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (platformFilter !== 'all') params.platform = platformFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiClient.get('/api/social/posts', { params });
      setPosts(res.data.data ?? []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [platformFilter, statusFilter]);

  const fetchLinkedInStatus = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/linkedin/status');
      setLiStatus(res.data);
    } catch {
      // LinkedIn not configured — silent
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchLinkedInStatus();
  }, [fetchPosts, fetchLinkedInStatus]);

  // Poll for LinkedIn connection after OAuth window opens
  useEffect(() => {
    if (!liConnecting) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get('/api/linkedin/status');
        if (res.data.connected) {
          setLiStatus(res.data);
          setLiConnecting(false);
          toast.success('LinkedIn connected successfully!');
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [liConnecting]);

  const handleConnectLinkedIn = async () => {
    try {
      const res = await apiClient.get('/api/linkedin/auth-url');
      const authUrl = res.data.auth_url;
      // Open OAuth in a popup
      const popup = window.open(authUrl, 'linkedin_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes');
      if (!popup) {
        // Fallback: open in new tab
        window.open(authUrl, '_blank');
      }
      setLiConnecting(true);
      toast.info('Complete LinkedIn authorization in the popup window...');
    } catch {
      toast.error('Failed to start LinkedIn OAuth');
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      await apiClient.post('/api/linkedin/disconnect');
      setLiStatus(s => s ? { ...s, connected: false, person_urn: null } : null);
      toast.success('LinkedIn disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) { toast.error('Enter a topic for the post'); return; }
    setGenerating(true);
    try {
      const res = await apiClient.post('/api/social/generate', form);
      toast.success(`Post generated ${res.data.ai_powered ? '(AI-powered)' : '(template)'}! Saved as draft.`);
      setShowGenerate(false);
      setForm({ platform: 'linkedin', tone: 'professional', topic: '', hashtag_count: 5 });
      fetchPosts();
    } catch {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await apiClient.delete(`/api/social/posts/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handlePublishLinkedIn = async (post: SocialPost) => {
    if (!liStatus?.connected) {
      toast.error('Connect LinkedIn first');
      return;
    }
    setPublishing(post.id);
    try {
      const res = await apiClient.post(`/api/social/posts/${post.id}/publish-linkedin`);
      toast.success('Published to LinkedIn!');
      if (res.data.linkedin_url) {
        window.open(res.data.linkedin_url, '_blank');
      }
      fetchPosts();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'LinkedIn publish failed';
      toast.error(msg);
    } finally {
      setPublishing(null);
    }
  };

  const handleMarkPublished = async (id: string) => {
    try {
      await apiClient.patch(`/api/social/posts/${id}`, { status: 'published' });
      toast.success('Marked as published!');
      fetchPosts();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleCopy = (content: string, hashtags: string[]) => {
    const full = `${content}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(full);
    toast.success('Copied to clipboard!');
  };

  const handleSaveEdit = async () => {
    if (!editPost) return;
    try {
      await apiClient.patch(`/api/social/posts/${editPost.id}`, { content: editContent });
      toast.success('Post updated');
      setEditPost(null);
      fetchPosts();
    } catch {
      toast.error('Update failed');
    }
  };

  const counts = { draft: 0, scheduled: 0, published: 0 };
  posts.forEach(p => { if (p.status in counts) counts[p.status as keyof typeof counts]++; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Social Media Hub</h2>
          <p className="text-zinc-400 text-sm mt-1">AI-generated posts · LinkedIn, Twitter, Facebook & Instagram</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchPosts}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowGenerate(true)}>
            <Sparkles className="w-4 h-4 mr-2" />Generate Post
          </Button>
        </div>
      </div>

      {/* LinkedIn Connection Banner */}
      <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
        liStatus?.connected
          ? 'border-blue-500/30 bg-blue-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            liStatus?.connected ? 'bg-blue-600' : 'bg-zinc-700'
          }`}>
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {liStatus?.connected ? 'LinkedIn Connected' : 'LinkedIn Not Connected'}
            </p>
            <p className="text-zinc-400 text-xs">
              {liStatus?.connected
                ? `Company page ready · ${liStatus.company_id ? `ID ${liStatus.company_id}` : 'Personal profile'}`
                : 'Connect to publish posts directly to your LinkedIn company page'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {liStatus?.connected ? (
            <>
              {liStatus.company_page && (
                <a href={liStatus.company_page} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />View Page
                  </Button>
                </a>
              )}
              <Button variant="outline" size="sm" className="border-white/10 text-zinc-400 text-xs"
                onClick={handleDisconnectLinkedIn}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"
              onClick={handleConnectLinkedIn} disabled={liConnecting}>
              {liConnecting
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Waiting...</>
                : <><Link2 className="w-3.5 h-3.5 mr-1.5" />Connect LinkedIn</>}
            </Button>
          )}
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-4 gap-3">
        {PLATFORMS.map(p => {
          const count = posts.filter(post => post.platform === p.id).length;
          return (
            <button key={p.id} onClick={() => setPlatformFilter(platformFilter === p.id ? 'all' : p.id)}
              className={`rounded-xl p-3 border text-left transition-all ${platformFilter === p.id
                ? 'border-violet-500 bg-violet-500/10' : 'border-white/6 bg-[#111] hover:border-white/20'}`}>
              <p.icon className={`w-5 h-5 mb-2 ${p.color}`} />
              <p className="text-white font-bold text-lg">{count}</p>
              <p className="text-zinc-400 text-xs">{p.label}</p>
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        {Object.entries(counts).map(([s, count]) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${statusFilter === s
              ? 'border-violet-500 bg-violet-500/10 text-violet-300'
              : 'border-white/10 text-zinc-400 hover:border-white/20'}`}>
            {s === 'published' && <CheckCircle2 className="w-3 h-3" />}
            {s === 'scheduled' && <Clock className="w-3 h-3" />}
            {s === 'draft' && <Edit2 className="w-3 h-3" />}
            {count} {s}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No posts yet. Generate your first AI social post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map(post => {
            const plat = PLATFORMS.find(p => p.id === post.platform);
            const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
            const isPublishing = publishing === post.id;
            return (
              <Card key={post.id} className="bg-[#111] border-white/6 hover:border-white/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {plat && <plat.icon className={`w-4 h-4 ${plat.color}`} />}
                      <span className="text-zinc-300 text-sm font-medium">{plat?.label ?? post.platform}</span>
                      <Badge className={`text-xs ${statusCfg.color} border-0`}>{statusCfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopy(post.content, post.hashtags)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Copy">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditPost(post); setEditContent(post.content); }}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-zinc-200 text-sm leading-relaxed line-clamp-4 mb-3">{post.content}</p>

                  {(post.hashtags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-blue-400 text-xs">{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/6">
                    <span className="text-zinc-500 text-xs">{post.tone} · {new Date(post.created_at).toLocaleDateString()}</span>
                    {post.status === 'draft' && (
                      <div className="flex items-center gap-2">
                        {/* LinkedIn direct publish */}
                        {post.platform === 'linkedin' && (
                          <Button size="sm"
                            className={`h-6 text-xs px-2 ${liStatus?.connected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 cursor-not-allowed'}`}
                            onClick={() => handlePublishLinkedIn(post)}
                            disabled={!liStatus?.connected || isPublishing}
                            title={liStatus?.connected ? 'Publish to LinkedIn' : 'Connect LinkedIn first'}>
                            {isPublishing
                              ? <RefreshCw className="w-3 h-3 animate-spin" />
                              : <><Linkedin className="w-3 h-3 mr-1" />Publish</>}
                          </Button>
                        )}
                        {/* Manual mark published for non-LinkedIn */}
                        {post.platform !== 'linkedin' && (
                          <Button size="sm" className="h-6 text-xs bg-emerald-600 hover:bg-emerald-700 px-2"
                            onClick={() => handleMarkPublished(post.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />Mark Published
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              AI Post Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-sm">Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Tone</Label>
                <Select value={form.tone} onValueChange={v => setForm(f => ({ ...f, tone: v }))}>
                  <SelectTrigger className="mt-1 bg-[#1a1a1a] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {TONES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Topic / Talking Point</Label>
              <Textarea value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white resize-none" rows={3}
                placeholder="We placed 50 candidates this month across the Gulf region..." />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Number of Hashtags</Label>
              <Input type="number" min={1} max={30} value={form.hashtag_count}
                onChange={e => setForm(f => ({ ...f, hashtag_count: Number(e.target.value) }))}
                className="mt-1 bg-[#1a1a1a] border-white/10 text-white" />
            </div>
            {form.platform === 'linkedin' && !liStatus?.connected && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs">LinkedIn is not connected. Post will be saved as a draft — connect LinkedIn to publish directly.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/10" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleGenerate} disabled={generating}>
                {generating
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              className="bg-[#1a1a1a] border-white/10 text-white resize-none" rows={8} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-white/10" onClick={() => setEditPost(null)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
