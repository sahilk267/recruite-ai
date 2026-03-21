import { useState } from 'react';
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
  Settings
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

const revenueData = [
  { name: 'Jan', revenue: 420000, leads: 320 },
  { name: 'Feb', revenue: 580000, leads: 450 },
  { name: 'Mar', revenue: 750000, leads: 580 },
  { name: 'Apr', revenue: 920000, leads: 720 },
  { name: 'May', revenue: 1100000, leads: 890 },
  { name: 'Jun', revenue: 1350000, leads: 1100 },
  { name: 'Jul', revenue: 1580000, leads: 1320 },
];

const conversionData = [
  { name: 'Leads', value: 3420 },
  { name: 'Qualified', value: 1850 },
  { name: 'Sent', value: 980 },
  { name: 'Closed', value: 420 },
];

const sourceData = [
  { name: 'LinkedIn', value: 35, color: '#7c3aed' },
  { name: 'Indeed', value: 28, color: '#06b6d4' },
  { name: 'Naukri', value: 22, color: '#10b981' },
  { name: 'Referral', value: 15, color: '#f59e0b' },
];

export function CRMDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalJobs: 12847,
    totalLeads: 8432,
    totalRecruiters: 156,
    totalDeals: 420,
    totalRevenue: 1580000,
    conversionRate: 34.2,
  };

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

          {/* Source Distribution & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Source Distribution */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-lg">Lead Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
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
                <div className="flex flex-wrap gap-2 mt-4">
                  {sourceData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-zinc-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 bg-[#1a1a1a] border-white/6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Calendar className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/30">
                        <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-zinc-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Deal Value', value: '₹50,800', change: '+12%', positive: true },
                  { label: 'Lead Response Time', value: '2.3 hrs', change: '-15%', positive: true },
                  { label: 'Recruiter Retention', value: '87%', change: '+5%', positive: true },
                  { label: 'Cost per Lead', value: '₹450', change: '-8%', positive: true },
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-lg bg-black/30">
                    <p className="text-sm text-zinc-500">{metric.label}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${metric.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{metric.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-lg">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-black/30">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <div className="flex-1">
                      <p className="text-sm">System automated lead distribution to TCS</p>
                      <p className="text-xs text-zinc-500">{i + 1} hours ago</p>
                    </div>
                    <Badge className="bg-violet-600/20 text-violet-400">Auto</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">API Keys</CardTitle>
              <Button className="gradient-primary">
                <Key className="w-4 h-4 mr-2" />
                Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map((api) => (
                  <div key={api.id} className="flex items-center justify-between p-4 rounded-lg bg-black/30">
                    <div>
                      <p className="font-medium">{api.name}</p>
                      <p className="text-sm text-zinc-500 font-mono">{api.key}</p>
                      <p className="text-xs text-zinc-600">Last used: {api.lastUsed}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-600/20 text-emerald-400">{api.status}</Badge>
                      <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
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
