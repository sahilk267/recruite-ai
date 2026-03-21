import { useState } from 'react';
import { 
  Repeat, 
  Mail, 
  MessageCircle, 
  Calendar,
  Check,
  Send,
  User,
  Briefcase,
  CreditCard,
  Settings,
  Zap,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FollowUpSequence {
  id: string;
  day: number;
  type: 'email' | 'whatsapp';
  subject: string;
  message: string;
  status: 'sent' | 'pending' | 'scheduled';
}

interface FollowUpType {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  sequences: FollowUpSequence[];
}

export function FollowUpEngine() {
  const [followUpTypes, setFollowUpTypes] = useState<FollowUpType[]>([
    {
      id: 'recruiter',
      name: 'Recruiter Follow-up',
      icon: Briefcase,
      enabled: true,
      sequences: [
        { id: 'r1', day: 0, type: 'email', subject: 'Introduction & Collaboration', message: 'Hi, I came across your profile...', status: 'sent' },
        { id: 'r2', day: 2, type: 'email', subject: 'Quick Reminder', message: 'Just following up on my previous email...', status: 'scheduled' },
        { id: 'r3', day: 5, type: 'whatsapp', subject: 'Special Offer', message: 'We have some great candidates...', status: 'pending' },
        { id: 'r4', day: 7, type: 'email', subject: 'Final Follow-up', message: 'Last chance to collaborate...', status: 'pending' },
      ],
    },
    {
      id: 'candidate',
      name: 'Candidate Follow-up',
      icon: User,
      enabled: true,
      sequences: [
        { id: 'c1', day: 0, type: 'email', subject: 'Profile Complete', message: 'Please complete your profile...', status: 'sent' },
        { id: 'c2', day: 1, type: 'whatsapp', subject: 'Job Alerts', message: 'New jobs matching your skills...', status: 'scheduled' },
        { id: 'c3', day: 7, type: 'email', subject: 'Re-engagement', message: 'We miss you! Check new opportunities...', status: 'pending' },
      ],
    },
    {
      id: 'payment',
      name: 'Payment Follow-up',
      icon: CreditCard,
      enabled: true,
      sequences: [
        { id: 'p1', day: 0, type: 'email', subject: 'Invoice Generated', message: 'Your invoice has been generated...', status: 'sent' },
        { id: 'p2', day: 3, type: 'email', subject: 'Payment Reminder', message: 'Friendly reminder for pending payment...', status: 'scheduled' },
        { id: 'p3', day: 7, type: 'whatsapp', subject: 'Urgent Notice', message: 'Urgent: Payment overdue...', status: 'pending' },
        { id: 'p4', day: 10, type: 'email', subject: 'Account Lock Warning', message: 'Your account will be locked...', status: 'pending' },
      ],
    },
  ]);

  const [settings, setSettings] = useState({
    enableFollowUp: true,
    stopOnReply: true,
    aiVariation: true,
    delayControl: 24,
  });

  const toggleFollowUpType = (id: string) => {
    setFollowUpTypes(followUpTypes.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-emerald-600/20 text-emerald-400',
      scheduled: 'bg-cyan-600/20 text-cyan-400',
      pending: 'bg-zinc-600/20 text-zinc-400',
    };
    return styles[status as keyof typeof styles];
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? Mail : MessageCircle;
  };

  const stats = {
    totalSent: 1247,
    totalScheduled: 89,
    responseRate: 34.2,
    conversionRate: 18.5,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Sent</p>
                <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalScheduled}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Response Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.responseRate}%</p>
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
                <p className="text-zinc-400 text-sm">Conversion</p>
                <p className="text-2xl font-bold text-amber-400">{stats.conversionRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" />
            Follow-Up Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
              <div>
                <p className="font-medium text-sm">Enable Follow-up</p>
                <p className="text-xs text-zinc-500">Master toggle</p>
              </div>
              <Switch 
                checked={settings.enableFollowUp} 
                onCheckedChange={(v) => setSettings({ ...settings, enableFollowUp: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
              <div>
                <p className="font-medium text-sm">Stop on Reply</p>
                <p className="text-xs text-zinc-500">Auto-stop sequence</p>
              </div>
              <Switch 
                checked={settings.stopOnReply} 
                onCheckedChange={(v) => setSettings({ ...settings, stopOnReply: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
              <div>
                <p className="font-medium text-sm">AI Variation</p>
                <p className="text-xs text-zinc-500">Unique messages</p>
              </div>
              <Switch 
                checked={settings.aiVariation} 
                onCheckedChange={(v) => setSettings({ ...settings, aiVariation: v })}
              />
            </div>
            <div className="p-3 rounded-lg bg-black/30">
              <p className="font-medium text-sm">Delay Control</p>
              <p className="text-xs text-zinc-500 mb-2">Hours between messages</p>
              <input 
                type="number" 
                value={settings.delayControl}
                onChange={(e) => setSettings({ ...settings, delayControl: parseInt(e.target.value) })}
                className="w-full px-3 py-1 bg-black/50 border border-white/10 rounded text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-Up Sequences */}
      <Tabs defaultValue="recruiter" className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-white/6 p-1">
          {followUpTypes.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger 
                key={type.id} 
                value={type.id}
                className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400"
              >
                <Icon className="w-4 h-4 mr-2" />
                {type.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {followUpTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="mt-4">
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <type.icon className="w-5 h-5 text-cyan-400" />
                  {type.name} Sequence
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={type.enabled} 
                    onCheckedChange={() => toggleFollowUpType(type.id)}
                  />
                  <Button variant="outline" size="sm" className="border-white/10">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Templates
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-800" />
                  
                  <div className="space-y-6">
                    {type.sequences.map((seq) => {
                      const Icon = getTypeIcon(seq.type);
                      return (
                        <div
                          key={seq.id}
                          className="relative flex items-start gap-4"
                        >
                          {/* Timeline Node */}
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                            seq.status === 'sent' ? 'bg-emerald-600/20' : 
                            seq.status === 'scheduled' ? 'bg-cyan-600/20' : 'bg-zinc-800'
                          }`}>
                            <span className={`text-sm font-bold ${
                              seq.status === 'sent' ? 'text-emerald-400' : 
                              seq.status === 'scheduled' ? 'text-cyan-400' : 'text-zinc-500'
                            }`}>
                              D{seq.day}
                            </span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-4 rounded-lg bg-black/30">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${
                                  seq.type === 'email' ? 'text-violet-400' : 'text-emerald-400'
                                }`} />
                                <div>
                                  <p className="font-medium">{seq.subject}</p>
                                  <p className="text-sm text-zinc-500 mt-1">{seq.message}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusBadge(seq.status)}>
                                  {seq.status}
                                </Badge>
                                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Automation Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Follow-Up Automation</p>
                <p className="text-sm text-zinc-500">All follow-up sequences are fully automated</p>
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
