import { useState } from 'react';
import { 
  Briefcase, 
  MessageSquare, 
  Calculator, 
  FileText,
  Check,
  TrendingUp,
  Target,
  Brain,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface Deal {
  id: string;
  recruiterName: string;
  company: string;
  leadName: string;
  value: number;
  status: 'reply' | 'intent_detected' | 'price_calculated' | 'proposal_sent' | 'accepted' | 'closed';
  stage: number;
  aiHandled: boolean;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

export function DealAutomation() {
  const [automationLevel, setAutomationLevel] = useState<'basic' | 'semi' | 'full'>('full');
  
  const [deals] = useState<Deal[]>([
    { id: '1', recruiterName: 'Rajesh Kumar', company: 'TCS', leadName: 'Rahul Sharma', value: 45000, status: 'closed', stage: 6, aiHandled: true },
    { id: '2', recruiterName: 'Priya Sharma', company: 'Infosys', leadName: 'Priya Patel', value: 38000, status: 'proposal_sent', stage: 4, aiHandled: true },
    { id: '3', recruiterName: 'Amit Patel', company: 'Wipro', leadName: 'Amit Kumar', value: 52000, status: 'price_calculated', stage: 3, aiHandled: true },
    { id: '4', recruiterName: 'Sneha Gupta', company: 'Google India', leadName: 'Neha Reddy', value: 75000, status: 'intent_detected', stage: 2, aiHandled: false },
  ]);

  const [aiCapabilities, setAiCapabilities] = useState<AICapability[]>([
    { id: 'negotiation', name: 'AI Negotiation', description: 'Automatically negotiate prices', enabled: true, icon: MessageSquare },
    { id: 'objection', name: 'Objection Handling', description: 'Handle common objections', enabled: true, icon: Shield },
    { id: 'pricing', name: 'Pricing Logic', description: 'Dynamic pricing based on market', enabled: true, icon: Calculator },
    { id: 'proposal', name: 'Auto Proposal', description: 'Generate and send proposals', enabled: true, icon: FileText },
  ]);

  const flowSteps = [
    { id: 'reply', label: 'Reply', icon: MessageSquare, description: 'Recruiter responds' },
    { id: 'intent_detected', label: 'AI Detect', icon: Brain, description: 'Detect intent & needs' },
    { id: 'price_calculated', label: 'Price', icon: Calculator, description: 'Calculate optimal price' },
    { id: 'proposal_sent', label: 'Proposal', icon: FileText, description: 'Send proposal' },
    { id: 'accepted', label: 'Accept', icon: Check, description: 'Recruiter accepts' },
    { id: 'closed', label: 'Closed', icon: Target, description: 'Deal closed!' },
  ];

  const toggleCapability = (id: string) => {
    setAiCapabilities(aiCapabilities.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reply: 'bg-zinc-600',
      intent_detected: 'bg-violet-600',
      price_calculated: 'bg-cyan-600',
      proposal_sent: 'bg-amber-600',
      accepted: 'bg-emerald-600',
      closed: 'bg-emerald-600',
    };
    return colors[status] || 'bg-zinc-600';
  };

  const stats = {
    totalDeals: 156,
    closedDeals: 89,
    aiHandled: 78,
    revenue: 4520000,
    avgDealValue: 50800,
  };

  const automationLevels = {
    basic: { label: 'Basic', desc: 'Manual deal closing', automation: 30 },
    semi: { label: 'Semi-Auto', desc: 'AI assist mode', automation: 60 },
    full: { label: 'Full Auto', desc: 'AI negotiator', automation: 85 },
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Total Deals</p>
            <p className="text-xl font-bold">{stats.totalDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Closed</p>
            <p className="text-xl font-bold text-emerald-400">{stats.closedDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">AI Handled</p>
            <p className="text-xl font-bold text-violet-400">{stats.aiHandled}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Revenue</p>
            <p className="text-xl font-bold text-cyan-400">₹{(stats.revenue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Avg Deal</p>
            <p className="text-xl font-bold text-amber-400">₹{(stats.avgDealValue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Level Selector */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Automation Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(automationLevels) as Array<keyof typeof automationLevels>).map((level) => (
              <button
                key={level}
                onClick={() => setAutomationLevel(level)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  automationLevel === level 
                    ? 'border-violet-500/50 bg-violet-600/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{automationLevels[level].label}</span>
                  {automationLevel === level && <Check className="w-4 h-4 text-violet-400" />}
                </div>
                <p className="text-sm text-zinc-500">{automationLevels[level].desc}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Automation</span>
                    <span>{automationLevels[level].automation}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-600 rounded-full transition-all"
                      style={{ width: `${automationLevels[level].automation}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deal Flow Visualization */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Deal Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      index < 4 ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${index < 4 ? 'text-violet-400' : 'text-zinc-500'}`} />
                    </div>
                    <p className="text-sm font-medium mt-2">{step.label}</p>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="flex flex-col items-center mx-2">
                      <div className="w-8 h-0.5 bg-zinc-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities & Active Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Capabilities */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              AI Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cap.enabled ? 'bg-emerald-600/20' : 'bg-zinc-800'}`}>
                      <Icon className={`w-5 h-5 ${cap.enabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cap.name}</p>
                      <p className="text-xs text-zinc-500">{cap.description}</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => toggleCapability(cap.id)}
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${cap.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${cap.enabled ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Active Deals */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deals.map((deal) => (
              <div key={deal.id} className="p-3 rounded-lg bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{deal.recruiterName}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-sm text-zinc-400">{deal.company}</span>
                  </div>
                  <Badge className={deal.aiHandled ? 'bg-violet-600/20 text-violet-400' : 'bg-zinc-600/20 text-zinc-400'}>
                    {deal.aiHandled ? 'AI' : 'Manual'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Lead: {deal.leadName}</p>
                    <p className="text-sm text-cyan-400">₹{deal.value.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Stage {deal.stage}/6</p>
                    <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full ${getStatusColor(deal.status)}`}
                        style={{ width: `${(deal.stage / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Automation Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Deal Automation</p>
                <p className="text-sm text-zinc-500">AI negotiation, pricing, and closing</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              70-90% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
