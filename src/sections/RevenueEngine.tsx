import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target,
  Handshake,
  CreditCard,
  IndianRupee,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const revenueData = [
  { name: 'Week 1', traffic: 1200, leads: 180, revenue: 45000 },
  { name: 'Week 2', traffic: 1800, leads: 270, revenue: 78000 },
  { name: 'Week 3', traffic: 2400, leads: 360, revenue: 112000 },
  { name: 'Week 4', traffic: 3200, leads: 480, revenue: 156000 },
  { name: 'Week 5', traffic: 4100, leads: 615, revenue: 198000 },
  { name: 'Week 6', traffic: 5200, leads: 780, revenue: 245000 },
];

const flowSteps = [
  { name: 'Traffic', value: 5200, icon: Users, color: '#7c3aed', desc: 'Website visitors' },
  { name: 'Leads', value: 780, icon: Users, color: '#06b6d4', desc: 'Captured leads' },
  { name: 'Score', value: 650, icon: Target, color: '#10b981', desc: 'Qualified leads' },
  { name: 'Recruiter', value: 420, icon: Handshake, color: '#f59e0b', desc: 'Sent to recruiters' },
  { name: 'Payment', value: 312, icon: CreditCard, color: '#ef4444', desc: 'Paid conversions' },
  { name: 'Profit', value: 245000, icon: IndianRupee, color: '#8b5cf6', desc: 'Revenue (₹)' },
];

export function RevenueEngine() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const conversionRates = [
    { from: 'Traffic', to: 'Leads', rate: 15 },
    { from: 'Leads', to: 'Score', rate: 83 },
    { from: 'Score', to: 'Recruiter', rate: 65 },
    { from: 'Recruiter', to: 'Payment', rate: 74 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold flex items-center justify-center gap-3"
        >
          <TrendingUp className="w-8 h-8 text-emerald-400" />
          Revenue Engine
        </motion.h2>
        <p className="text-zinc-500 mt-2">Traffic → Leads → Score → Recruiter → Payment → Profit</p>
      </div>

      {/* Flow Visualization */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              const isHovered = hoveredStep === index;
              
              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center"
                >
                  <div 
                    className="relative"
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div 
                      className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: `${step.color}20`,
                        border: `2px solid ${isHovered ? step.color : `${step.color}40`}`,
                        boxShadow: isHovered ? `0 0 30px ${step.color}40` : 'none'
                      }}
                    >
                      <Icon className="w-8 h-8 mb-2" style={{ color: step.color }} />
                      <p className="text-xs font-medium text-zinc-400">{step.name}</p>
                      <p className="text-lg font-bold" style={{ color: step.color }}>
                        {step.name === 'Profit' ? `₹${(step.value / 1000).toFixed(0)}K` : step.value.toLocaleString()}
                      </p>
                    </div>
                    
                    {isHovered && (
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-zinc-800 px-3 py-1 rounded-lg text-xs whitespace-nowrap z-10">
                        {step.desc}
                      </div>
                    )}
                  </div>
                  
                  {index < flowSteps.length - 1 && (
                    <div className="flex flex-col items-center mx-2">
                      <ArrowRight className="w-6 h-6 text-zinc-600" />
                      {index < conversionRates.length && (
                        <span className="text-xs text-emerald-400 mt-1">
                          {conversionRates[index].rate}%
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Revenue Growth
            </CardTitle>
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
                  <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#7c3aed" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Traffic & Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Bar dataKey="traffic" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Avg. Deal Value</p>
            <p className="text-2xl font-bold text-emerald-400">₹50,800</p>
            <p className="text-xs text-emerald-400 mt-1">+12% vs last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Cost per Lead</p>
            <p className="text-2xl font-bold text-cyan-400">₹450</p>
            <p className="text-xs text-emerald-400 mt-1">-8% vs last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Lead to Deal</p>
            <p className="text-2xl font-bold text-amber-400">12.3%</p>
            <p className="text-xs text-emerald-400 mt-1">+2.1% vs last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Monthly Revenue</p>
            <p className="text-2xl font-bold text-violet-400">₹15.8L</p>
            <p className="text-xs text-emerald-400 mt-1">+23% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Formula */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Revenue Formula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg bg-black/30 text-center">
            <p className="text-lg">
              <span className="text-violet-400">Traffic</span>
              <span className="text-zinc-500 mx-2">×</span>
              <span className="text-cyan-400">Conversion Rate</span>
              <span className="text-zinc-500 mx-2">×</span>
              <span className="text-emerald-400">Avg Deal Value</span>
              <span className="text-zinc-500 mx-2">=</span>
              <span className="text-amber-400 font-bold">Revenue</span>
            </p>
            <p className="text-zinc-500 mt-4">
              5,200 visitors × 15% × 12.3% × ₹50,800 = <span className="text-emerald-400 font-bold">₹4.9L/week</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
