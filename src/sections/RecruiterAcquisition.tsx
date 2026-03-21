import { useState } from 'react';
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
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface Recruiter {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp?: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  leadsSent: number;
  dealsClosed: number;
  lastContact: string;
}

interface AutomationControl {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

export function RecruiterAcquisition() {
  const [recruiters] = useState<Recruiter[]>([
    { id: '1', name: 'Rajesh Kumar', company: 'TCS', email: 'rajesh@tcs.com', whatsapp: '+91 98765 43210', industry: 'IT Services', status: 'active', leadsSent: 45, dealsClosed: 12, lastContact: '2 hours ago' },
    { id: '2', name: 'Priya Sharma', company: 'Infosys', email: 'priya@infosys.com', whatsapp: '+91 98765 43211', industry: 'IT Services', status: 'active', leadsSent: 38, dealsClosed: 9, lastContact: '5 hours ago' },
    { id: '3', name: 'Amit Patel', company: 'Wipro', email: 'amit@wipro.com', industry: 'IT Services', status: 'pending', leadsSent: 12, dealsClosed: 2, lastContact: '1 day ago' },
    { id: '4', name: 'Sneha Gupta', company: 'Google India', email: 'sneha@google.com', whatsapp: '+91 98765 43212', industry: 'Technology', status: 'active', leadsSent: 28, dealsClosed: 7, lastContact: '3 hours ago' },
    { id: '5', name: 'Vikram Rao', company: 'Amazon', email: 'vikram@amazon.com', industry: 'Technology', status: 'active', leadsSent: 52, dealsClosed: 15, lastContact: '1 hour ago' },
  ]);

  const [controls, setControls] = useState<AutomationControl[]>([
    { id: 'autoEmail', label: 'Auto Email Outreach', description: 'Automatically send emails to recruiters', enabled: true, icon: Mail },
    { id: 'autoWhatsApp', label: 'Auto WhatsApp Outreach', description: 'Send WhatsApp messages automatically', enabled: true, icon: MessageCircle },
    { id: 'autoFollowUp', label: 'Auto Follow-up', description: 'Schedule and send follow-up messages', enabled: true, icon: RefreshCw },
    { id: 'autoChatReply', label: 'AI Chat Reply', description: 'Automatically respond to recruiter queries', enabled: true, icon: Zap },
    { id: 'autoProposal', label: 'Auto Proposal Send', description: 'Send proposals automatically', enabled: false, icon: Send },
    { id: 'autoDealClose', label: 'Auto Deal Close', description: 'Automatically close deals', enabled: false, icon: Target },
  ]);

  const [isScraping, setIsScraping] = useState(false);

  const toggleControl = (id: string) => {
    setControls(controls.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const scrapeRecruiters = () => {
    setIsScraping(true);
    setTimeout(() => setIsScraping(false), 2000);
  };

  const enabledCount = controls.filter(c => c.enabled).length;
  const automationLevel = Math.round((enabledCount / controls.length) * 100);

  const stats = {
    total: recruiters.length,
    active: recruiters.filter(r => r.status === 'active').length,
    totalLeads: recruiters.reduce((sum, r) => sum + r.leadsSent, 0),
    totalDeals: recruiters.reduce((sum, r) => sum + r.dealsClosed, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Recruiters</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
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
                <p className="text-zinc-400 text-sm">Leads Sent</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalLeads}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Deals Closed</p>
                <p className="text-2xl font-bold text-amber-400">{stats.totalDeals}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Controls */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-400" />
                Control Panel
              </div>
              <Badge className={automationLevel >= 80 ? 'bg-emerald-600/20 text-emerald-400' : automationLevel >= 50 ? 'bg-amber-600/20 text-amber-400' : 'bg-zinc-600/20 text-zinc-400'}>
                {automationLevel}% Auto
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">
              Enable more options for higher automation. Current level: {enabledCount}/{controls.length}
            </p>
            {controls.map((control) => {
              const Icon = control.icon;
              return (
                <div key={control.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${control.enabled ? 'bg-violet-600/20' : 'bg-zinc-800'}`}>
                      <Icon className={`w-4 h-4 ${control.enabled ? 'text-violet-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{control.label}</p>
                      <p className="text-xs text-zinc-500">{control.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={control.enabled} 
                    onCheckedChange={() => toggleControl(control.id)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recruiter Scraping */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Recruiter Scraping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-black/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">LinkedIn Recruiter Search</p>
                  <p className="text-sm text-zinc-500">Scrape recruiters from LinkedIn</p>
                </div>
                <Button 
                  onClick={scrapeRecruiters}
                  disabled={isScraping}
                  size="sm"
                  className="gradient-primary"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScraping && 'animate-spin'}`} />
                  {isScraping ? 'Scraping...' : 'Scrape'}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Last scrape</span>
                  <span>2 hours ago</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">New recruiters found</span>
                  <span className="text-emerald-400">+23</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-black/30">
              <p className="font-medium mb-3">Extraction Settings</p>
              <div className="space-y-2">
                {[
                  { label: 'Extract Email', enabled: true },
                  { label: 'Extract WhatsApp', enabled: true },
                  { label: 'Company Profiling', enabled: true },
                  { label: 'Industry Detection', enabled: false },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{setting.label}</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer ${setting.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${setting.enabled ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruiters List */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-400" />
            Recruiters
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/10">
              <Mail className="w-4 h-4 mr-2" />
              Email All
            </Button>
            <Button variant="outline" size="sm" className="border-white/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recruiters.map((recruiter) => (
              <div
                key={recruiter.id}
                className="flex items-center justify-between p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="font-semibold text-sm">{recruiter.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{recruiter.name}</p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Building2 className="w-3 h-3" />
                      {recruiter.company}
                      <span className="text-zinc-600">•</span>
                      {recruiter.industry}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {recruiter.email}
                      </span>
                      {recruiter.whatsapp && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {recruiter.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-lg font-bold text-cyan-400">{recruiter.leadsSent}</p>
                        <p className="text-xs text-zinc-500">Leads</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-400">{recruiter.dealsClosed}</p>
                        <p className="text-xs text-zinc-500">Deals</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={recruiter.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'}>
                    {recruiter.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
                <p className="font-medium">Recruiter Acquisition Automation</p>
                <p className="text-sm text-zinc-500">Scraping, outreach, and follow-up automated</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              {automationLevel}% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
