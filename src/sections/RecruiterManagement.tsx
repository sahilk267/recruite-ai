import { useState, useEffect } from 'react';
import { 
  Handshake, 
  Mail, 
  MessageCircle, 
  Send,
  RefreshCw,
  Check,
  Building2,
  Phone,
  Globe,
  Zap,
  Settings,
  Target,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { recruiterService } from '@/services';
import type { Recruiter } from '@/types';
import { toast } from 'sonner';
import { OutreachDialog } from '@/components/OutreachDialog';

export function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Outreach Modal State
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null);
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const response = await recruiterService.getAllRecruiters();
      if (response.success) {
        setRecruiters(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch recruiters:', error);
      toast.error('Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecruiters = recruiters.filter(r => {
    const matchesSearch = 
      r.recruiter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openOutreach = (recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter);
    setIsOutreachOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-600/20 text-emerald-400';
      case 'contacted': return 'bg-cyan-600/20 text-cyan-400';
      case 'interested': return 'bg-violet-600/20 text-violet-400';
      case 'new': return 'bg-zinc-600/20 text-zinc-400';
      default: return 'bg-zinc-600/20 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recruiter Management</h2>
          <p className="text-zinc-400">Manage and track recruiter outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/10" onClick={fetchRecruiters}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading && 'animate-spin'}`} />
            Refresh
          </Button>
          <Button size="sm" className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Recruiter
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total</p>
                <p className="text-2xl font-bold">{recruiters.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Add more stats card here */}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-white/6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search name, company, or email..." 
            className="pl-10 bg-black/20 border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select 
            className="bg-black/20 border border-white/10 rounded-md py-1.5 px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {/* Recruiters Table/List */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading recruiters...
          </div>
        ) : filteredRecruiters.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-zinc-500 bg-[#1a1a1a] rounded-xl border border-dashed border-white/10">
            No recruiters found
          </div>
        ) : (
          filteredRecruiters.map((recruiter) => (
            <div
              key={recruiter.id}
              className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] transition-colors border border-white/6 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold">
                  {recruiter.recruiter_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{recruiter.recruiter_name}</h3>
                    <Badge className={getStatusColor(recruiter.status)}>{recruiter.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {recruiter.company_name}
                    </span>
                    <span className="text-zinc-700">•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {recruiter.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden lg:flex flex-col items-end">
                  <p className="text-xs text-zinc-500">Outreach Count</p>
                  <p className="font-semibold">{recruiter.outreach_count}</p>
                </div>
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-xs text-zinc-500">Source</p>
                  <Badge variant="outline" className="capitalize text-[10px] py-0">{recruiter.source}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-400 hover:text-white"
                    onClick={() => openOutreach(recruiter)}
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-400 hover:text-white"
                    onClick={() => openOutreach(recruiter)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-zinc-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                      <DropdownMenuItem className="text-zinc-300">Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-zinc-300">View History</DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-400">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <OutreachDialog 
        recruiter={selectedRecruiter} 
        isOpen={isOutreachOpen} 
        onClose={() => setIsOutreachOpen(false)} 
        onSent={fetchRecruiters}
      />
    </div>
  );
}
