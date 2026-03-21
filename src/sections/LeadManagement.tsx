import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Star, 
  MoreVertical, 
  ShieldCheck, 
  Clock, 
  Briefcase,
  Search,
  Filter,
  Download,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function LeadManagement() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const leads = [
    { id: '1', name: 'Amit Sharma', role: 'Senior React Developer', score: 92, status: 'Qualified', verified: true, date: '2 hours ago' },
    { id: '2', name: 'Priya Patel', role: 'Full Stack Engineer', score: 85, status: 'New', verified: false, date: '5 hours ago' },
    { id: '3', name: 'Rahul Verma', role: 'UI/UX Designer', score: 78, status: 'Contacted', verified: true, date: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Management</h2>
          <p className="text-zinc-400">Track and verify incoming candidates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="gradient-primary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-xl border border-white/6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search by name, skills, or role..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-white"
          />
        </div>
        <div className="h-6 w-[1px] bg-white/10" />
        <Button variant="ghost" size="sm" className="text-zinc-400">All Sources</Button>
        <Button variant="ghost" size="sm" className="text-zinc-400">High Score Only</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="bg-[#1a1a1a] border-white/6 hover:border-violet-500/30 transition-all overflow-hidden group">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                      {lead.name.charAt(0)}
                    </div>
                    {lead.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                        <ShieldCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {lead.name}
                      <Badge variant="outline" className="text-[9px] py-0 border-white/10 font-medium text-zinc-400">
                        {lead.id === '1' ? 'Direct' : 'Consultancy'}
                      </Badge>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{lead.role}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lead.date}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        5+ Years
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">AI Score</p>
                    <div className={`text-lg font-black ${lead.score > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {lead.score}
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/5 hidden md:block" />
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-[10px] px-2 ${
                      lead.status === 'Qualified' ? 'bg-emerald-600/20 text-emerald-400' : 
                      lead.status === 'New' ? 'bg-blue-600/20 text-blue-400' : 
                      'bg-zinc-600/20 text-zinc-400'
                    }`}>
                      {lead.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-2 bg-white/2 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-4">
                  <Button variant="link" className="text-[10px] h-auto p-0 text-zinc-400 hover:text-violet-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Send Email
                  </Button>
                  <Button variant="link" className="text-[10px] h-auto p-0 text-zinc-400 hover:text-emerald-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </Button>
                </div>
                <Button variant="link" className="text-[10px] h-auto p-0 text-zinc-500 italic flex items-center gap-1">
                  View Detail <ExternalLink className="w-2.5 h-2.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
