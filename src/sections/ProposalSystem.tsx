import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Proposal } from '@/types';
import { toast } from 'sonner';

export function ProposalSystem() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Mocking for now
      const mockProposals: Proposal[] = [
        {
          id: 'P1',
          recruiter_id: 'R1',
          status: 'viewed',
          amount: 50000,
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          viewed_at: new Date(Date.now() - 43200000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'P2',
          recruiter_id: 'R2',
          status: 'accepted',
          amount: 75000,
          sent_at: new Date(Date.now() - 172800000).toISOString(),
          viewed_at: new Date(Date.now() - 151200000).toISOString(),
          accepted_at: new Date(Date.now() - 129600000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setProposals(mockProposals);
    } catch (error) {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-600/20 text-emerald-400';
      case 'rejected': return 'bg-rose-600/20 text-rose-400';
      case 'viewed': return 'bg-cyan-600/20 text-cyan-400';
      case 'sent': return 'bg-violet-600/20 text-violet-400';
      default: return 'bg-zinc-600/20 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Proposal System</h2>
          <p className="text-zinc-400">Generate and track talent partnership proposals</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Active Proposals</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Conversion Rate</p>
              <p className="text-2xl font-bold">24%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Viewed Rate</p>
              <p className="text-2xl font-bold">68%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search by proposal ID or recruiter..." 
              className="pl-10 bg-black/20 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div 
                key={proposal.id}
                className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/6 hover:bg-black/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Proposal #{proposal.id}</span>
                      <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span>Sent {new Date(proposal.sent_at!).toLocaleDateString()}</span>
                      {proposal.viewed_at && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Viewed {new Date(proposal.viewed_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">
                      ₹{proposal.amount?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium uppercase">Value</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
