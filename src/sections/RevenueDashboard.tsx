import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  CreditCard,
  Target,
  BarChart3,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function RevenueDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue Engine</h2>
          <p className="text-zinc-400">Track earnings, payments, and ROI</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-20 h-20" />
          </div>
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs font-medium uppercase">Total Revenue (MRR)</p>
            <p className="text-3xl font-bold text-white mt-1">₹12,45,000</p>
            <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-20 h-20" />
          </div>
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs font-medium uppercase">Pending Payments</p>
            <p className="text-3xl font-bold text-white mt-1">₹3,12,000</p>
            <div className="flex items-center gap-2 mt-2 text-zinc-500 text-xs">
              <Calendar className="w-3 h-3" />
              <span>Next payout in 4 days</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-20 h-20" />
          </div>
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs font-medium uppercase">Target Met</p>
            <p className="text-3xl font-bold text-white mt-1">84%</p>
            <div className="flex items-center gap-2 mt-2 text-violet-400 text-xs">
              <span>₹2,55,000 more to goal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Payment History</CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] h-7">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Google Placement Fee</p>
                      <p className="text-xs text-zinc-500">Mar 20, 2026 • Deal #D824</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">₹75,000</p>
                    <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Recruiter Subscriptions</span>
                  <span className="text-white">₹5,40,000</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Pay-per-Lead</span>
                  <span className="text-white">₹4,15,000</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-400">Success Placement Fees</span>
                  <span className="text-white">₹2,90,000</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-medium text-white">Projected MRR (Next Month)</span>
              </div>
              <span className="text-lg font-bold text-violet-400">₹14,20,000</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
