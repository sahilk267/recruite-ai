import { useState, useEffect, useCallback } from 'react';
import {
  Zap, ArrowRight, CheckCircle2, Users, TrendingUp,
  RefreshCw, BarChart3, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface ConversionData {
  funnel: { stage: string; count: number }[];
  conversion_rate: number;
  total_leads: number;
  total_hired: number;
  weekly_trend: { week: string; leads: number; conversions: number }[];
  ai_powered: boolean;
}

const STAGE_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500',
];

export function ConversionDashboard() {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/analytics/conversion');
      setData(res.data);
    } catch {
      toast.error('Failed to load conversion data');
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

  const maxCount = Math.max(...(data?.funnel ?? []).map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Conversion Dashboard</h2>
          <p className="text-zinc-400 text-sm mt-1">Lead-to-hire funnel analytics from live data</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 text-zinc-400" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Total Leads</p>
                <p className="text-white text-2xl font-bold">{data?.total_leads ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Total Hired</p>
                <p className="text-white text-2xl font-bold">{data?.total_hired ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Conversion Rate</p>
                <p className="text-white text-2xl font-bold">{data?.conversion_rate ?? 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="bg-[#111] border-white/6">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Recruitment Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.funnel ?? []).length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No pipeline data yet</p>
          ) : (
            <div className="space-y-3">
              {data!.funnel.map((stage, i) => {
                const pct = Math.round(stage.count / maxCount * 100);
                return (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-28 text-right shrink-0">
                      <span className="text-zinc-300 text-sm font-medium">{stage.stage}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-6 bg-white/5 flex-1"
                          style={{ '--progress-color': STAGE_COLORS[i] } as React.CSSProperties} />
                        <span className="text-white text-sm font-semibold w-6 text-right">{stage.count}</span>
                      </div>
                    </div>
                    {i < (data!.funnel.length - 1) && (
                      <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111] border-white/6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Weekly Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.weekly_trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="leads" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Conversion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.weekly_trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
