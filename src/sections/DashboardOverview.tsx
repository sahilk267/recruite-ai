import { useEffect, useState, useRef } from 'react';
import { 
  Briefcase, 
  Users, 
  IndianRupee, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, useInView } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  delay: number;
}

function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[^0-9]*$/)?.[0] || '';
    const isDecimal = value.includes('.');
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = numericValue * easeOut;
      
      if (isDecimal) {
        setDisplayValue(`${prefix}${currentValue.toFixed(1)}${suffix}`);
      } else {
        setDisplayValue(`${prefix}${Math.floor(currentValue).toLocaleString()}${suffix}`);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue}</span>;
}

function StatCard({ title, value, change, icon: Icon, color, delay }: StatCardProps) {
  const isPositive = change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-[#1a1a1a] border-white/6 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm">{title}</p>
              <h3 className="text-2xl font-bold mt-2 text-white">
                <AnimatedCounter value={value} />
              </h3>
              <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(change)}%</span>
                <span className="text-zinc-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const revenueData = [
  { name: 'Jan', value: 420000 },
  { name: 'Feb', value: 580000 },
  { name: 'Mar', value: 750000 },
  { name: 'Apr', value: 920000 },
  { name: 'May', value: 1100000 },
  { name: 'Jun', value: 1350000 },
  { name: 'Jul', value: 1580000 },
];

const leadsData = [
  { name: 'Direct', value: 450 },
  { name: 'Social', value: 320 },
  { name: 'Referral', value: 280 },
  { name: 'Organic', value: 190 },
];

const dealStatusData = [
  { name: 'Won', value: 65, color: '#10b981' },
  { name: 'In Progress', value: 25, color: '#f59e0b' },
  { name: 'Lost', value: 10, color: '#ef4444' },
];

const automationModules = [
  { name: 'Scraping', automation: 100, color: '#10b981' },
  { name: 'Posting', automation: 95, color: '#10b981' },
  { name: 'Lead Scoring', automation: 100, color: '#10b981' },
  { name: 'Follow-up', automation: 100, color: '#10b981' },
  { name: 'Deal Close', automation: 85, color: '#f59e0b' },
  { name: 'Payment', automation: 90, color: '#10b981' },
];

export function DashboardOverview() {
  const chartRef = useRef(null);
  const isChartInView = useInView(chartRef, { once: true });
  const [stats, setStats] = useState<{
    total_jobs: number;
    total_leads: number;
    total_revenue: number;
    total_recruiters: number;
    avg_score: number;
    high_quality_leads: number;
    active_jobs: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { default: apiClient } = await import('@/services/api');
        const res = await apiClient.get('/api/stats');
        setStats(res.data);
      } catch {
        // fallback to static if backend unavailable
      }
    };
    fetchStats();
  }, []);

  const formatRevenue = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats ? stats.total_jobs.toLocaleString() : '—'}
          change={12}
          icon={Briefcase}
          color="bg-violet-600"
          delay={0}
        />
        <StatCard
          title="Active Leads"
          value={stats ? stats.total_leads.toLocaleString() : '—'}
          change={8}
          icon={Users}
          color="bg-cyan-600"
          delay={1}
        />
        <StatCard
          title="Revenue"
          value={stats ? formatRevenue(stats.total_revenue) : '—'}
          change={23}
          icon={IndianRupee}
          color="bg-emerald-600"
          delay={2}
        />
        <StatCard
          title="Recruiters"
          value={stats ? stats.total_recruiters.toLocaleString() : '—'}
          change={5}
          icon={TrendingUp}
          color="bg-amber-600"
          delay={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={chartRef}>
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isChartInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Revenue Trend
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Last 7 months</span>
                <Badge className="bg-emerald-600/20 text-emerald-400">+23%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `₹${v/100000}L`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      dot={{ fill: '#7c3aed', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deal Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isChartInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Deal Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dealStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dealStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {dealStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-zinc-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Automation Levels & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isChartInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Automation Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationModules.map((module, index) => (
                <div key={module.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{module.name}</span>
                    <span className="text-zinc-400">{module.automation}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isChartInView ? { width: `${module.automation}%` } : {}}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: module.color }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-300">Total Automation</span>
                  <span className="text-lg font-bold text-emerald-400">~92%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leads by Source */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isChartInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Leads by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition-colors">
                Run Scraper
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors">
                Process Jobs
              </button>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">
                Send Leads
              </button>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium transition-colors">
                Generate Report
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

