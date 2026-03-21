import { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Handshake, 
  TrendingUp,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function ConversionDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Conversion Dashboard</h2>
          <p className="text-zinc-400">Automated Lead-to-Deal tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" className="gradient-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto-Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs font-medium uppercase mb-1">Total Leads</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">1,284</p>
              <span className="text-emerald-400 text-xs flex items-center mb-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </span>
            </div>
            <Progress value={75} className="h-1 mt-3 bg-white/5" indicatorClassName="bg-violet-500" />
          </CardContent>
        </Card>
        {/* Similar cards for Matched, Proposals, Deals */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#1a1a1a] border-white/6 overflow-hidden">
          <CardHeader className="border-b border-white/6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live Conversion Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                      JS
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">John Smith matched with Google</p>
                      <p className="text-[10px] text-zinc-500">2 minutes ago • Score: 92/100</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <Badge className="bg-emerald-600/20 text-emerald-400 text-[10px] py-0 px-1">Matched</Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-3 bg-black/20 text-center border-t border-white/6">
            <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-white">View Full Stream</Button>
          </div>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Leads Captured</span>
                <span className="text-white">100% (1,284)</span>
              </div>
              <Progress value={100} className="h-2 bg-white/5" indicatorClassName="bg-violet-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Leads Matched</span>
                <span className="text-white">65% (835)</span>
              </div>
              <Progress value={65} className="h-2 bg-white/5" indicatorClassName="bg-cyan-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Proposals Sent</span>
                <span className="text-white">42% (539)</span>
              </div>
              <Progress value={42} className="h-2 bg-white/5" indicatorClassName="bg-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Deals Closed</span>
                <span className="text-white">18% (231)</span>
              </div>
              <Progress value={18} className="h-2 bg-white/5" indicatorClassName="bg-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
