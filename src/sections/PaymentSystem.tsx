import { useState, useEffect } from 'react';
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
  FileText,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { paymentService } from '@/services';
import { toast } from 'sonner';

interface Payment {
  id: string;
  recruiterName?: string;
  company?: string;
  amount: number;
  type?: 'pay_per_lead' | 'subscription' | 'wallet';
  status?: 'pending' | 'invoiced' | 'paid' | 'overdue';
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState<string | null>(null);

  const [options, setOptions] = useState<PaymentOption[]>([
    { id: 'payPerLead', name: 'Pay-per-Lead', description: 'Charge for each qualified lead', enabled: true, icon: Users },
    { id: 'subscription', name: 'Subscription', description: 'Monthly/Yearly subscription plans', enabled: true, icon: Calendar },
    { id: 'wallet', name: 'Wallet System', description: 'Prepaid wallet for credits', enabled: true, icon: Wallet },
    { id: 'autoInvoice', name: 'Auto Invoice', description: 'Automatically generate invoices', enabled: true, icon: FileText },
    { id: 'paymentReminder', name: 'Payment Reminder', description: 'Auto-send payment reminders', enabled: true, icon: Bell },
  ]);

  // Fetch payments from API
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getAllPayments({ page: 1, pageSize: 20 });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const recordPayment = async (paymentId: string) => {
    setIsRecording(paymentId);
    try {
      await paymentService.recordPayment(paymentId);
      
      // Update payment status
      setPayments(payments.map(p =>
        p.id === paymentId
          ? { ...p, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }
          : p
      ));
      
      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsRecording(null);
    }
  };

  const toggleOption = (id: string) => {
    setOptions(options.map(o => 
      o.id === id ? { ...o, enabled: !o.enabled } : o
    ));
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      'pending': 'bg-zinc-600/20 text-zinc-400',
      'invoiced': 'bg-cyan-600/20 text-cyan-400',
      'paid': 'bg-emerald-600/20 text-emerald-400',
      'overdue': 'bg-red-600/20 text-red-400',
    };
    return styles[status || 'pending'] || styles.pending;
  };

  const getTypeBadge = (type?: string) => {
    const styles: Record<string, string> = {
      'pay_per_lead': 'bg-violet-600/20 text-violet-400',
      'subscription': 'bg-amber-600/20 text-amber-400',
      'wallet': 'bg-cyan-600/20 text-cyan-400',
    };
    return styles[type || 'pay_per_lead'] || styles.pay_per_lead;
  };

  const stats = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment System</h1>
        <Button 
          onClick={fetchPayments}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Total Revenue</p>
            <p className="text-2xl font-bold text-violet-400">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Pending</p>
            <p className="text-2xl font-bold text-amber-400">₹{(stats.pending / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Paid</p>
            <p className="text-2xl font-bold text-emerald-400">₹{(stats.paid / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Overdue</p>
            <p className="text-2xl font-bold text-red-400">₹{(stats.overdue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-[#1a1a1a] border-white/6 lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
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

        {/* Payment Options */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg">Payment Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map(option => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm">{option.name}</span>
                  </div>
                  <button
                    onClick={() => toggleOption(option.id)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      option.enabled ? 'bg-violet-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        option.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-left text-zinc-400">ID</th>
                  <th className="px-4 py-2 text-left text-zinc-400">Amount</th>
                  <th className="px-4 py-2 text-left text-zinc-400">Type</th>
                  <th className="px-4 py-2 text-left text-zinc-400">Status</th>
                  <th className="px-4 py-2 text-right text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-white/6 hover:bg-white/5">
                    <td className="px-4 py-3 text-xs text-zinc-400">{payment.id.substring(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={getTypeBadge(payment.type)}>
                        {payment.type?.replace('_', ' ') || 'pay_per_lead'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadge(payment.status)}>
                        {payment.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => recordPayment(payment.id)}
                          disabled={isRecording === payment.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          {isRecording === payment.id ? (
                            <>
                              <Loader className="w-3 h-3 mr-1 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Record
                            </>
                          )}
                        </Button>
                      )}
                      {payment.status === 'paid' && (
                        <Badge className="bg-emerald-600/20 text-emerald-400">Paid</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
