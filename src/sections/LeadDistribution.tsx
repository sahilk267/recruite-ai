import { useState } from 'react';
import { 
  Share2, 
  Route, 
  Target,
  Check,
  User,
  Building2,
  Zap,
  ArrowRight,
  Star,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Recruiter {
  id: string;
  name: string;
  company: string;
  priority: number;
  matchScore: number;
  leadsReceived: number;
  conversionRate: number;
  industries: string[];
  active: boolean;
}

interface Lead {
  id: string;
  name: string;
  skills: string[];
  experience: number;
  location: string;
  status: 'pending' | 'routed' | 'sent';
  assignedTo?: string;
}

export function LeadDistribution() {
  const [recruiters] = useState<Recruiter[]>([
    { id: '1', name: 'Rajesh Kumar', company: 'TCS', priority: 1, matchScore: 95, leadsReceived: 45, conversionRate: 28, industries: ['IT', 'Software'], active: true },
    { id: '2', name: 'Priya Sharma', company: 'Infosys', priority: 2, matchScore: 88, leadsReceived: 38, conversionRate: 24, industries: ['IT', 'Consulting'], active: true },
    { id: '3', name: 'Amit Patel', company: 'Wipro', priority: 3, matchScore: 82, leadsReceived: 32, conversionRate: 19, industries: ['IT', 'BPO'], active: true },
    { id: '4', name: 'Sneha Gupta', company: 'Google India', priority: 1, matchScore: 98, leadsReceived: 28, conversionRate: 35, industries: ['Technology', 'AI'], active: true },
    { id: '5', name: 'Vikram Rao', company: 'Amazon', priority: 2, matchScore: 92, leadsReceived: 52, conversionRate: 31, industries: ['Technology', 'E-commerce'], active: true },
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    { id: '1', name: 'Rahul Sharma', skills: ['React', 'Node.js'], experience: 4, location: 'Bangalore', status: 'routed', assignedTo: 'TCS' },
    { id: '2', name: 'Priya Patel', skills: ['Python', 'Django'], experience: 2, location: 'Hyderabad', status: 'sent', assignedTo: 'Infosys' },
    { id: '3', name: 'Amit Kumar', skills: ['Java', 'Spring'], experience: 6, location: 'Chennai', status: 'pending' },
    { id: '4', name: 'Neha Reddy', skills: ['Data Science', 'ML'], experience: 3, location: 'Bangalore', status: 'routed', assignedTo: 'Google India' },
  ]);

  const [routingRules, setRoutingRules] = useState({
    skillMatch: true,
    locationMatch: true,
    priorityRecruiter: true,
    duplicatePrevention: true,
    smartMatching: true,
  });

  const routeLead = (leadId: string) => {
    const bestMatch = recruiters
      .filter(r => r.active)
      .sort((a, b) => b.matchScore - a.matchScore)[0];

    if (bestMatch) {
      setLeads(leads.map(l => 
        l.id === leadId 
          ? { ...l, status: 'routed', assignedTo: bestMatch.company }
          : l
      ));
    }
  };

  const stats = {
    totalLeads: leads.length,
    routed: leads.filter(l => l.status === 'routed').length,
    sent: leads.filter(l => l.status === 'sent').length,
    duplicates: 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Routed</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.routed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Route className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Sent</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.sent}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Duplicates</p>
                <p className="text-2xl font-bold text-amber-400">{stats.duplicates}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Visualization */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-violet-400" />
            Lead Routing Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-8">
            {/* Lead Input */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center">
                <User className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-sm font-medium mt-2">Lead</p>
              <p className="text-xs text-zinc-500">New Lead</p>
            </div>

            <ArrowRight className="w-8 h-8 text-zinc-600" />

            {/* Routing Logic */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-lg bg-cyan-600/20 border-2 border-cyan-500/30 flex items-center justify-center">
                <Settings className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-sm font-medium mt-2">Smart Match</p>
              <p className="text-xs text-zinc-500">AI Algorithm</p>
            </div>

            <ArrowRight className="w-8 h-8 text-zinc-600" />

            {/* Recruiters */}
            <div className="flex gap-2">
              {recruiters.slice(0, 3).map((recruiter) => (
                <div key={recruiter.id} className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    recruiter.priority === 1 ? 'bg-emerald-600/20 border-2 border-emerald-500/30' : 'bg-zinc-800'
                  }`}>
                    <Building2 className={`w-6 h-6 ${recruiter.priority === 1 ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  </div>
                  <p className="text-xs font-medium mt-1">{recruiter.company}</p>
                  <p className="text-xs text-zinc-500">{recruiter.matchScore}%</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Routing Rules */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Routing Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'skillMatch', label: 'Skill Matching', desc: 'Match leads based on required skills' },
              { id: 'locationMatch', label: 'Location Matching', desc: 'Consider location preferences' },
              { id: 'priorityRecruiter', label: 'Priority Recruiters', desc: 'Give priority to high-performing recruiters' },
              { id: 'duplicatePrevention', label: 'Duplicate Prevention', desc: 'Prevent sending same lead multiple times' },
              { id: 'smartMatching', label: 'Smart Matching', desc: 'Use AI for optimal matching' },
            ].map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div>
                  <p className="font-medium text-sm">{rule.label}</p>
                  <p className="text-xs text-zinc-500">{rule.desc}</p>
                </div>
                <div 
                  onClick={() => setRoutingRules({ ...routingRules, [rule.id]: !routingRules[rule.id as keyof typeof routingRules] })}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    routingRules[rule.id as keyof typeof routingRules] ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    routingRules[rule.id as keyof typeof routingRules] ? 'translate-x-4' : ''
                  }`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recruiter Priority List */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Recruiter Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recruiters.sort((a, b) => a.priority - b.priority).map((recruiter) => (
              <div key={recruiter.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    recruiter.priority === 1 ? 'bg-emerald-600/20' : 
                    recruiter.priority === 2 ? 'bg-cyan-600/20' : 'bg-zinc-800'
                  }`}>
                    <span className={`text-sm font-bold ${
                      recruiter.priority === 1 ? 'text-emerald-400' : 
                      recruiter.priority === 2 ? 'text-cyan-400' : 'text-zinc-500'
                    }`}>
                      {recruiter.priority}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{recruiter.name}</p>
                    <p className="text-xs text-zinc-500">{recruiter.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">Match Score</p>
                      <p className={`text-sm font-bold ${recruiter.matchScore >= 90 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {recruiter.matchScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Leads</p>
                      <p className="text-sm font-bold">{recruiter.leadsReceived}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Conv.</p>
                      <p className="text-sm font-bold text-amber-400">{recruiter.conversionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Leads */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Pending Leads
          </CardTitle>
          <Button className="gradient-primary">
            <Zap className="w-4 h-4 mr-2" />
            Auto-Route All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leads.filter(l => l.status === 'pending').map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="font-semibold text-sm">{lead.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span>{lead.experience} years</span>
                      <span>•</span>
                      <span>{lead.location}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {lead.skills.map((skill, i) => (
                        <Badge key={i} className="bg-violet-600/20 text-violet-400 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={() => routeLead(lead.id)} size="sm" className="gradient-primary">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Route
                </Button>
              </div>
            ))}
            {leads.filter(l => l.status === 'pending').length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All leads have been routed!</p>
              </div>
            )}
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
                <p className="font-medium">Lead Distribution Automation</p>
                <p className="text-sm text-zinc-500">Auto routing, priority matching, duplicate prevention</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              100% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
