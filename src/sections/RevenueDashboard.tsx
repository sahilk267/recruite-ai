import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, TrendingUp, ArrowUpRight, CreditCard,
  Target, Download, RefreshCw, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface RevenueData {
  total_revenue: number;
  pending_revenue: number;
  total_payments: number;
  paid_count: number;
  monthly_trend: { month: string; revenue: number; deals: number }[];
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  notes: string;
  created_at: string;
  paid_at: string | null;
}

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paid:    { label: 'Paid',    color: 'text-emerald-400 bg-emerald-500/10', icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10',     icon: <Clock className="w-3 h-3" /> },
  failed:  { label: 'Failed',  color: 'text-red-400 bg-red-500/10',         icon: <XCircle className="w-3 h-3" /> },
};

export function RevenueDashboard() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        apiClient.get('/api/analytics/revenue'),
        apiClient.get('/api/payments'),
      ]);
      setRevenue(rRes.data);
      setPayments(pRes.data.data ?? pRes.data ?? []);
    } catch {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Revenue', value: formatINR(revenue?.total_revenue ?? 0), icon: IndianRupee, color: 'text-emerald-400', change: '+18.4%' },
    { label: 'Pending Revenue', value: formatINR(revenue?.pending_revenue ?? 0), icon: Clock, color: 'text-amber-400', change: '' },
    { label: 'Payments Collected', value: `${revenue?.paid_count ?? 0} / ${revenue?.total_payments ?? 0}`, icon: CreditCard, color: 'text-blue-400', change: '' },
    { label: 'Avg Deal Size', value: formatINR(revenue?.paid_count ? (revenue.total_revenue / revenue.paid_count) : 0), icon: Target, color: 'text-violet-400', change: '' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue Engine</h2>
          <p className="text-zinc-400 text-sm mt-1">Live revenue tracking from payment records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-white/10">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-[#111] border-white/6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-zinc-400 text-xs">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-white text-2xl font-bold">{s.value}</p>
              {s.change && (
                <p className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />{s.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111] border-white/6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {(revenue?.monthly_trend ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue?.monthly_trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatINR(v)} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }} formatter={(v: number) => [formatINR(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-zinc-500 text-sm">No revenue data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Deal Count Per Month</CardTitle>
          </CardHeader>
          <CardContent>
            {(revenue?.monthly_trend ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenue?.monthly_trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="deals" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-zinc-500 text-sm">No deal data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Records */}
      <Card className="bg-[#111] border-white/6">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-medium">Payment Records ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No payments recorded yet</p>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{p.notes || 'Payment'}</p>
                        <p className="text-zinc-500 text-xs">{p.method.replace('_', ' ')} · {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">
                        {p.currency === 'INR' ? '₹' : p.currency}{Number(p.amount).toLocaleString()}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
