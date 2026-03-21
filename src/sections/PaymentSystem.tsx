import { useState } from 'react';
import { 
  CreditCard, 
  Wallet, 
  Receipt,
  Check,
  IndianRupee,
  Zap,
  ArrowRight,
  Unlock,
  Bell,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface Payment {
  id: string;
  recruiterName: string;
  company: string;
  amount: number;
  type: 'pay_per_lead' | 'subscription' | 'wallet';
  status: 'pending' | 'invoiced' | 'paid' | 'overdue';
  invoiceDate?: string;
  paidDate?: string;
  leadCount?: number;
}

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

const revenueData = [
  { name: 'Week 1', revenue: 45000 },
  { name: 'Week 2', revenue: 78000 },
  { name: 'Week 3', revenue: 112000 },
  { name: 'Week 4', revenue: 156000 },
];

export function PaymentSystem() {
  const [payments] = useState<Payment[]>([
    { id: '1', recruiterName: 'Rajesh Kumar', company: 'TCS', amount: 45000, type: 'pay_per_lead', status: 'paid', invoiceDate: '2024-01-15', paidDate: '2024-01-16', leadCount: 15 },
    { id: '2', recruiterName: 'Priya Sharma', company: 'Infosys', amount: 32000, type: 'pay_per_lead', status: 'invoiced', invoiceDate: '2024-01-18', leadCount: 10 },
    { id: '3', recruiterName: 'Amit Patel', company: 'Wipro', amount: 28000, type: 'subscription', status: 'pending' },
    { id: '4', recruiterName: 'Sneha Gupta', company: 'Google India', amount: 75000, type: 'pay_per_lead', status: 'overdue', invoiceDate: '2024-01-10', leadCount: 25 },
    { id: '5', recruiterName: 'Vikram Rao', company: 'Amazon', amount: 52000, type: 'wallet', status: 'paid', paidDate: '2024-01-17' },
  ]);

  const [options, setOptions] = useState<PaymentOption[]>([
    { id: 'payPerLead', name: 'Pay-per-Lead', description: 'Charge for each qualified lead', enabled: true, icon: Users },
    { id: 'subscription', name: 'Subscription', description: 'Monthly/Yearly subscription plans', enabled: true, icon: Calendar },
    { id: 'wallet', name: 'Wallet System', description: 'Prepaid wallet for credits', enabled: true, icon: Wallet },
    { id: 'autoInvoice', name: 'Auto Invoice', description: 'Automatically generate invoices', enabled: true, icon: FileText },
    { id: 'paymentReminder', name: 'Payment Reminder', description: 'Auto-send payment reminders', enabled: true, icon: Bell },
  ]);

  const toggleOption = (id: string) => {
    setOptions(options.map(o => 
      o.id === id ? { ...o, enabled: !o.enabled } : o
    ));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-zinc-600/20 text-zinc-400',
      invoiced: 'bg-cyan-600/20 text-cyan-400',
      paid: 'bg-emerald-600/20 text-emerald-400',
      overdue: 'bg-red-600/20 text-red-400',
    };
    return styles[status as keyof typeof styles];
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      pay_per_lead: 'bg-violet-600/20 text-violet-400',
      subscription: 'bg-amber-600/20 text-amber-400',
      wallet: 'bg-cyan-600/20 text-cyan-400',
    };
    return styles[type as keyof typeof styles];
  };

  const stats = {
    totalRevenue: 452000,
    pending: 89000,
    paid: 342000,
    overdue: 21000,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-amber-400">₹{(stats.pending / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Paid</p>
                <p className="text-2xl font-bold text-cyan-400">₹{(stats.paid / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-red-400">₹{(stats.overdue / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Flow */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-violet-400" />
            Payment Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {[
              { label: 'Lead Ready', icon: Users, desc: 'Lead qualified' },
              { label: 'Invoice', icon: FileText, desc: 'Auto generated' },
              { label: 'Payment Link', icon: CreditCard, desc: 'Sent to recruiter' },
              { label: 'Confirm', icon: Check, desc: 'Payment received' },
              { label: 'Unlock', icon: Unlock, desc: 'Lead unlocked' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      index <= 2 ? 'bg-violet-600/20 border-2 border-violet-500/30' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${index <= 2 ? 'text-violet-400' : 'text-zinc-500'}`} />
                    </div>
                    <p className="text-sm font-medium mt-2">{step.label}</p>
                    <p className="text-xs text-zinc-500">{step.desc}</p>
                  </div>
                  {index < 4 && (
                    <ArrowRight className="w-6 h-6 text-zinc-600 mx-4 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Options & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Options */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Payment Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${option.enabled ? 'bg-cyan-600/20' : 'bg-zinc-800'}`}>
                      <Icon className={`w-5 h-5 ${option.enabled ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{option.name}</p>
                      <p className="text-xs text-zinc-500">{option.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={option.enabled} 
                    onCheckedChange={() => toggleOption(option.id)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="p-3 rounded-lg bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{payment.recruiterName}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-sm text-zinc-400">{payment.company}</span>
                  </div>
                  <Badge className={getStatusBadge(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeBadge(payment.type)}>
                      {payment.type.replace('_', ' ')}
                    </Badge>
                    {payment.leadCount && (
                      <span className="text-xs text-zinc-500">{payment.leadCount} leads</span>
                    )}
                  </div>
                  <p className="font-bold text-cyan-400">₹{payment.amount.toLocaleString()}</p>
                </div>
                {payment.invoiceDate && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Invoiced: {payment.invoiceDate}
                    {payment.paidDate && ` • Paid: ${payment.paidDate}`}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `₹${v/1000}K`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Wallet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-black/30">
              <p className="text-sm text-zinc-500">Total Wallet Balance</p>
              <p className="text-2xl font-bold text-emerald-400">₹1,25,000</p>
              <p className="text-xs text-zinc-500 mt-1">Across all recruiters</p>
            </div>
            <div className="p-4 rounded-lg bg-black/30">
              <p className="text-sm text-zinc-500">Active Wallets</p>
              <p className="text-2xl font-bold text-cyan-400">23</p>
              <p className="text-xs text-zinc-500 mt-1">Recruiters with balance</p>
            </div>
            <div className="p-4 rounded-lg bg-black/30">
              <p className="text-sm text-zinc-500">Avg. Wallet Size</p>
              <p className="text-2xl font-bold text-amber-400">₹5,435</p>
              <p className="text-xs text-zinc-500 mt-1">Per recruiter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Payment Automation</p>
                <p className="text-sm text-zinc-500">Invoicing, reminders, and processing automated</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              90% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
