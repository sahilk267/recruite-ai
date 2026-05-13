import { useState, useEffect } from 'react';
import {
  Settings, Shield, CreditCard, Users, Crown, Zap, Check, Loader2,
  RefreshCw, AlertCircle, ChevronRight, Building2, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ai_calls_used: number;
  ai_calls_limit: number;
  ai_calls_remaining: number;
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface UsageEntry {
  endpoint: string;
  tokens: number;
  at: string;
}

const PLAN_CONFIG = {
  free:       { label: 'Free',       color: 'text-zinc-400',  bg: 'bg-zinc-500/15',  border: 'border-zinc-500/30',  limit: 50,   price: '$0/mo' },
  pro:        { label: 'Pro',        color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30', limit: 1000,  price: '$49/mo' },
  enterprise: { label: 'Enterprise', color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  limit: -1,   price: 'Custom' },
};

const ROLE_COLORS: Record<string, string> = {
  admin:          'text-amber-400 bg-amber-500/15 border-amber-500/30',
  recruiter:      'text-violet-400 bg-violet-500/15 border-violet-500/30',
  hiring_manager: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  candidate:      'text-zinc-400 bg-zinc-500/15 border-zinc-500/30',
};

type Tab = 'org' | 'subscription' | 'users' | 'security';

export function SettingsPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('org');
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [usage, setUsage] = useState<{ ai_calls_used: number; ai_calls_limit: number; ai_calls_remaining: number; recent_usage: UsageEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [orgRes, subRes] = await Promise.all([
        apiClient.get('/api/org'),
        apiClient.get('/api/subscription'),
      ]);
      setOrg(orgRes.data);
      setUsage(subRes.data);

      if (isAdmin) {
        const uRes = await apiClient.get('/api/org/users');
        setUsers(uRes.data);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function upgradePlan() {
    setUpgrading(true);
    try {
      await apiClient.post('/api/subscription/upgrade');
      toast.success('Upgraded to Pro plan!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  }

  async function saveRole(userId: string, role: string) {
    try {
      await apiClient.patch(`/api/org/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      setEditRoleId(null);
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to update role');
    }
  }

  const planCfg = PLAN_CONFIG[(org?.plan as keyof typeof PLAN_CONFIG) ?? 'free'];
  const usagePct = usage && usage.ai_calls_limit > 0
    ? Math.min(100, (usage.ai_calls_used / usage.ai_calls_limit) * 100)
    : 0;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'org', label: 'Organisation', icon: Building2 },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Team & Roles', icon: Users }] : []),
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-400" />
            Settings
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">Manage your organisation, plan, and team</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-violet-500/15 border border-violet-500/30 text-violet-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {tab === t.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <>
              {/* ── Org Tab ────────────────────────────────────────────── */}
              {tab === 'org' && org && (
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 space-y-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Organisation Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Name', value: org.name },
                        { label: 'Slug', value: org.slug },
                        { label: 'Plan', value: planCfg.label },
                        { label: 'Org ID', value: org.id.slice(0, 8) + '…' },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                          <p className="text-[10px] text-zinc-600 mb-0.5">{item.label}</p>
                          <p className="text-sm font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Usage quick view */}
                  {usage && (
                    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">AI Usage This Month</p>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-black text-white">{usage.ai_calls_used}</span>
                        <span className="text-sm text-zinc-500">
                          / {usage.ai_calls_limit < 0 ? '∞' : usage.ai_calls_limit} calls
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-violet-500')}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1.5">
                        {usage.ai_calls_remaining < 0 ? 'Unlimited' : `${usage.ai_calls_remaining} calls remaining`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Subscription Tab ───────────────────────────────────── */}
              {tab === 'subscription' && (
                <div className="space-y-4">
                  {/* Plan cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(PLAN_CONFIG) as [string, typeof PLAN_CONFIG.free][]).map(([key, cfg]) => {
                      const isCurrent = org?.plan === key;
                      return (
                        <div key={key} className={cn(
                          'bg-[#1a1a1a] border rounded-2xl p-4 relative transition-all',
                          isCurrent ? `${cfg.border} shadow-lg` : 'border-white/8'
                        )}>
                          {isCurrent && (
                            <span className={cn('absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.border, cfg.color)}>
                              Current
                            </span>
                          )}
                          <Crown className={cn('w-5 h-5 mb-2', cfg.color)} />
                          <p className={cn('text-base font-bold', cfg.color)}>{cfg.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{cfg.price}</p>
                          <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-violet-400" />
                              {cfg.limit < 0 ? 'Unlimited' : `${cfg.limit}`} AI calls/mo
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-400" />
                              All core features
                            </div>
                            {key !== 'free' && (
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-400" />
                                Priority support
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {org?.plan === 'free' && (
                    <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-violet-300">Upgrade to Pro</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Get 1,000 AI calls/month and priority support</p>
                      </div>
                      <button
                        onClick={upgradePlan}
                        disabled={upgrading || !isAdmin}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                          isAdmin && !upgrading
                            ? 'bg-violet-600 hover:bg-violet-500 text-white'
                            : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                        )}
                      >
                        {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                        {upgrading ? 'Upgrading…' : 'Upgrade (Demo)'}
                      </button>
                    </div>
                  )}

                  {/* Recent AI usage log */}
                  {usage?.recent_usage && usage.recent_usage.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent AI Calls</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {usage.recent_usage.map((u, i) => (
                          <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                            <span className="text-zinc-400 font-mono">{u.endpoint}</span>
                            <span className="text-zinc-600">{u.at ? new Date(u.at).toLocaleString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Team & Roles Tab ───────────────────────────────────── */}
              {tab === 'users' && isAdmin && (
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/8">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Team Members ({users.length})</p>
                    </div>
                    <div className="divide-y divide-white/5">
                      {users.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-violet-400">
                              {u.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>

                          {editRoleId === u.id ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={editRoleValue}
                                onChange={(e) => setEditRoleValue(e.target.value)}
                                className="text-xs bg-[#141414] border border-white/10 rounded-lg px-2 py-1 text-white outline-none"
                              >
                                {['admin', 'recruiter', 'hiring_manager', 'candidate'].map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button onClick={() => saveRole(u.id, editRoleValue)}
                                className="text-xs px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                                Save
                              </button>
                              <button onClick={() => setEditRoleId(null)}
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', ROLE_COLORS[u.role] ?? ROLE_COLORS.candidate)}>
                                {u.role}
                              </span>
                              {u.id !== user?.id && (
                                <button
                                  onClick={() => { setEditRoleId(u.id); setEditRoleValue(u.role); }}
                                  className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Role permissions matrix */}
                  <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Role Permissions</p>
                    <div className="space-y-2">
                      {[
                        { role: 'admin', perms: 'Full access to everything' },
                        { role: 'recruiter', perms: 'Read/write candidates & jobs, manage pipeline, schedule interviews' },
                        { role: 'hiring_manager', perms: 'Read-only access to candidates, jobs, pipeline, and interviews' },
                        { role: 'candidate', perms: 'No platform access (external)' },
                      ].map((r) => (
                        <div key={r.role} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/3">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5', ROLE_COLORS[r.role] ?? ROLE_COLORS.candidate)}>
                            {r.role}
                          </span>
                          <p className="text-xs text-zinc-400">{r.perms}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Security Tab ───────────────────────────────────────── */}
              {tab === 'security' && (
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Security Status</p>
                    {[
                      { label: 'JWT Authentication', status: true, detail: 'HS256 · 7-day expiry' },
                      { label: 'Password Hashing', status: true, detail: 'sha256_crypt via passlib' },
                      { label: 'CORS Policy', status: true, detail: 'Origin restricted via CORSMiddleware' },
                      { label: 'Role-Based Access Control', status: true, detail: 'admin / recruiter / hiring_manager / candidate' },
                      { label: 'AI Quota Enforcement', status: true, detail: 'Per-org limit with 429 on exhaustion' },
                      { label: 'File Upload Validation', status: true, detail: 'Type + size checks on resume upload' },
                      { label: 'Input Sanitization', status: true, detail: 'Pydantic validation on all request bodies' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          item.status ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-red-500/20 border border-red-500/40'
                        )}>
                          {item.status
                            ? <Check className="w-3 h-3 text-emerald-400" />
                            : <AlertCircle className="w-3 h-3 text-red-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">{item.label}</p>
                          <p className="text-[10px] text-zinc-600">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">Production Note</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Change <code className="text-amber-300">SECRET_KEY</code> env var before deploying. The demo key is public.
                        Email delivery is mocked (console log) — integrate Resend/SendGrid for production sends.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
