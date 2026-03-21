import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MessageSquare, 
  Calculator, 
  FileText,
  Check,
  TrendingUp,
  Target,
  Brain,
  Shield,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dealService } from '@/services';
import { toast } from 'sonner';

interface Deal {
  id: string;
  recruiterName?: string;
  company?: string;
  leadName?: string;
  value: number;
  status?: string;
  stage?: number;
  aiHandled?: boolean;
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingDeal, setIsClosingDeal] = useState<string | null>(null);
  
  const [aiCapabilities, setAiCapabilities] = useState<AICapability[]>([
    { id: 'negotiation', name: 'AI Negotiation', description: 'Automatically negotiate prices', enabled: true, icon: MessageSquare },
    { id: 'objection', name: 'Objection Handling', description: 'Handle common objections', enabled: true, icon: Shield },
    { id: 'pricing', name: 'Pricing Logic', description: 'Dynamic pricing based on market', enabled: true, icon: Calculator },
    { id: 'proposal', name: 'Auto Proposal', description: 'Generate and send proposals', enabled: true, icon: FileText },
  ]);

  const flowSteps = [
    { id: 'negotiating', label: 'Negotiating', icon: MessageSquare, description: 'In negotiation' },
    { id: 'proposal', label: 'Proposal', icon: FileText, description: 'Send proposal' },
    { id: 'discussion', label: 'Discussion', icon: Brain, description: 'Discuss terms' },
    { id: 'final', label: 'Final', icon: Check, description: 'Final review' },
    { id: 'closed', label: 'Closed', icon: Target, description: 'Deal closed!' },
  ];

  // Fetch deals from API
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const response = await dealService.getAllDeals({ page: 1, pageSize: 20 });
      setDeals(response.data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const closeDeal = async (dealId: string) => {
    setIsClosingDeal(dealId);
    try {
      await dealService.closeDeal(dealId);
      
      // Update deals list
      setDeals(deals.map(deal =>
        deal.id === dealId
          ? { ...deal, stage: 5, status: 'closed' }
          : deal
      ));
      
      toast.success('Deal closed successfully!');
    } catch (error) {
      console.error('Error closing deal:', error);
      toast.error('Failed to close deal');
    } finally {
      setIsClosingDeal(null);
    }
  };

  const toggleCapability = (id: string) => {
    setAiCapabilities(aiCapabilities.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'negotiating': 'bg-violet-600',
      'proposal': 'bg-cyan-600',
      'discussion': 'bg-amber-600',
      'final': 'bg-emerald-600',
      'closed': 'bg-emerald-700',
    };
    return colors[status || 'negotiating'] || 'bg-zinc-600';
  };

  const stats = {
    totalDeals: deals.length,
    activeDeals: deals.filter(d => d.stage !== 5).length,
    closedDeals: deals.filter(d => d.stage === 5 || d.status === 'closed').length,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
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
        <h1 className="text-3xl font-bold">Deal Automation</h1>
        <Button 
          onClick={fetchDeals}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Total Deals</p>
            <p className="text-2xl font-bold">{stats.totalDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Active</p>
            <p className="text-2xl font-bold text-violet-400">{stats.activeDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Closed</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.closedDeals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-xs">Total Value</p>
            <p className="text-2xl font-bold text-amber-400">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Table */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle>Active Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-left text-zinc-400">Deal #</th>
                  <th className="px-4 py-2 text-left text-zinc-400">Value</th>
                  <th className="px-4 py-2 text-left text-zinc-400">Stage</th>
                  <th className="px-4 py-2 text-left text-zinc-400">AI Handled</th>
                  <th className="px-4 py-2 text-right text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => (
                  <tr key={deal.id} className="border-b border-white/6 hover:bg-white/5">
                    <td className="px-4 py-3">{deal.id.substring(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold">₹{deal.value.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${getStatusColor(deal.status || `stage-${deal.stage}`)}`}>
                        Stage {deal.stage || 1}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {deal.aiHandled ? (
                        <Badge className="bg-violet-600/20 text-violet-400">Yes</Badge>
                      ) : (
                        <Badge className="bg-zinc-600/20 text-zinc-400">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deal.stage !== 5 && deal.status !== 'closed' && (
                        <Button
                          size="sm"
                          onClick={() => closeDeal(deal.id)}
                          disabled={isClosingDeal === deal.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          {isClosingDeal === deal.id ? (
                            <>
                              <Loader className="w-3 h-3 mr-1 animate-spin" />
                              Closing...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Close
                            </>
                          )}
                        </Button>
                      )}
                      {(deal.stage === 5 || deal.status === 'closed') && (
                        <Badge className="bg-emerald-600/20 text-emerald-400">Closed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle>AI Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiCapabilities.map(capability => {
              const Icon = capability.icon;
              return (
                <div
                  key={capability.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${capability.enabled ? 'text-violet-400' : 'text-zinc-500'}`} />
                    <div>
                      <p className="text-sm font-semibold">{capability.name}</p>
                      <p className="text-xs text-zinc-500">{capability.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCapability(capability.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      capability.enabled ? 'bg-violet-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        capability.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deal Flow Visualization */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle>Deal Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2 min-w-max">
                    <div className="w-12 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center border border-violet-600/50">
                      <Icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <p className="text-xs font-semibold text-center">{step.label}</p>
                    <p className="text-xs text-zinc-500 text-center">{step.description}</p>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-white/10 min-w-[20px]" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
