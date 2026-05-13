import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Briefcase, 
  Users, 
  Handshake,
  Target,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Key,
  Settings,
  Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
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
import apiClient from '@/services/api';
import { toast } from 'sonner';

// Mock data for charts (will be enhanced with real data later)
const revenueData = [
  { name: 'Jan', revenue: 420000, leads: 320 },
  { name: 'Feb', revenue: 580000, leads: 450 },
  { name: 'Mar', revenue: 750000, leads: 580 },
  { name: 'Apr', revenue: 920000, leads: 720 },
  { name: 'May', revenue: 1100000, leads: 890 },
  { name: 'Jun', revenue: 1350000, leads: 1100 },
  { name: 'Jul', revenue: 1580000, leads: 1320 },
];

const sourceData = [
  { name: 'LinkedIn', value: 35, color: '#7c3aed' },
  { name: 'Indeed', value: 28, color: '#06b6d4' },
  { name: 'Naukri', value: 22, color: '#10b981' },
  { name: 'Referral', value: 15, color: '#f59e0b' },
];

export function CRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalLeads: 0,
    totalRecruiters: 0,
    totalDeals: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [conversionData, setConversionData] = useState([
    { name: 'Leads', value: 0 },
    { name: 'Qualified', value: 0 },
    { name: 'Sent', value: 0 },
    { name: 'Closed', value: 0 },
  ]);

  const recentActivity = [
    { id: 1, type: 'lead', message: 'New lead captured: Rahul Sharma', time: '2 min ago', icon: Users },
    { id: 2, type: 'deal', message: 'Deal closed: TCS - ₹45,000', time: '15 min ago', icon: Target },
    { id: 3, type: 'payment', message: 'Payment received: Infosys - ₹32,000', time: '1 hour ago', icon: CreditCard },
    { id: 4, type: 'job', message: 'New job posted: Senior React Dev', time: '2 hours ago', icon: Briefcase },
    { id: 5, type: 'recruiter', message: 'New recruiter: Google India', time: '3 hours ago', icon: Handshake },
  ];

  const apiKeys = [
    { id: 1, name: 'Production API', key: 'pk_live_...x7y9z', status: 'active', lastUsed: '2 min ago' },
    { id: 2, name: 'Test API', key: 'pk_test_...a1b2c', status: 'active', lastUsed: '1 hour ago' },
    { id: 3, name: 'Webhook Secret', key: 'whsec_...d3e4f', status: 'active', lastUsed: '5 min ago' },
  ];

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch all statistics in parallel
        const [jobsRes, leadsRes, recruitersRes, dealsRes, paymentsRes] = await Promise.allSettled([
          jobService.getAllJobs({ page: 1, pageSize: 1 }),
          leadService.getAllLeads({ page: 1, pageSize: 1 }),
          recruiterService.getAllRecruiters({ page: 1, pageSize: 1 }),
          dealService.getAllDeals({ page: 1, pageSize: 1 }),
          paymentService.getAllPayments({ page: 1, pageSize: 1 }),
        ]);

        // Extract totals from responses
        const totalJobs = jobsRes.status === 'fulfilled' ? jobsRes.value.total || 0 : 0;
        const totalLeads = leadsRes.status === 'fulfilled' ? leadsRes.value.total || 0 : 0;
        const totalRecruiters = recruitersRes.status === 'fulfilled' ? recruitersRes.value.total || 0 : 0;
        const totalDeals = dealsRes.status === 'fulfilled' ? dealsRes.value.total || 0 : 0;
        const totalPayments = paymentsRes.status === 'fulfilled' ? paymentsRes.value.total || 0 : 0;

        // Calculate stats
        const totalRevenue = totalPayments * 10000; // Estimated from count
        const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;

        setStats({
          totalJobs,
          totalLeads,
          totalRecruiters,
          totalDeals,
          totalRevenue,
          conversionRate: parseFloat(conversionRate as string),
        });

        // Update conversion funnel data
        setConversionData([
          { name: 'Leads', value: totalLeads },
          { name: 'Qualified', value: Math.floor(totalLeads * 0.54) },
          { name: 'Sent', value: Math.floor(totalLeads * 0.29) },
          { name: 'Closed', value: totalDeals },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Jobs</p>
            <p className="text-xl font-bold">{stats.totalJobs.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Leads</p>
            <p className="text-xl font-bold text-violet-400">{stats.totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Recruiters</p>
            <p className="text-xl font-bold text-cyan-400">{stats.totalRecruiters}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Deals</p>
            <p className="text-xl font-bold text-emerald-400">{stats.totalDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Revenue</p>
            <p className="text-xl font-bold text-amber-400">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Conversion</p>
            <p className="text-xl font-bold text-rose-400">{stats.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-white/6 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <Calendar className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Revenue & Leads</CardTitle>
                <Badge className="bg-emerald-600/20 text-emerald-400">+23%</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `₹${v/100000}L`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-lg">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                      <XAxis type="number" stroke="#666" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                      <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Source Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-[#1a1a1a] border-white/6 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Lead Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {sourceData.map(source => (
                    <div key={source.name} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{source.name}</span>
                      <span className="font-semibold">{source.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1a1a1a] border-white/6 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-white/6 last:border-0">
                      <Icon className="w-4 h-4 text-violet-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.message}</p>
                        <p className="text-xs text-zinc-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Deal Value</span>
                      <span className="font-semibold">₹{(stats.totalRevenue / Math.max(stats.totalDeals, 1)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Leads/Recruiter</span>
                      <span className="font-semibold">{(stats.totalLeads / Math.max(stats.totalRecruiters, 1)).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="text-sm text-zinc-400 flex justify-between">
                    <span>{activity.message}</span>
                    <span className="text-zinc-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>API Keys</CardTitle>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white text-sm">
                + Generate Key
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-sm font-semibold">{apiKey.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">{apiKey.key}</p>
                      <p className="text-xs text-zinc-600 mt-1">Last used: {apiKey.lastUsed}</p>
                    </div>
                    <Badge className={apiKey.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}>
                      {apiKey.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
