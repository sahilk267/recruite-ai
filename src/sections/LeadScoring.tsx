import { useState } from 'react';
import { 
  Target, 
  Star, 
  Briefcase,
  GraduationCap,
  FileCheck,
  Shield,
  Zap,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Lead {
  id: string;
  name: string;
  email: string;
  experience: number;
  skills: string[];
  score: number;
  quality: 'High' | 'Medium' | 'Low';
  priority: 'Send Immediately' | 'Queue' | 'Low Priority';
  breakdown: {
    skillMatch: number;
    experience: number;
    education: number;
    completeness: number;
    fakeDetection: number;
  };
}

export function LeadScoring() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      experience: 4,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      score: 87,
      quality: 'High',
      priority: 'Send Immediately',
      breakdown: { skillMatch: 90, experience: 85, education: 80, completeness: 95, fakeDetection: 95 },
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya@example.com',
      experience: 2,
      skills: ['Python', 'Django', 'SQL'],
      score: 72,
      quality: 'Medium',
      priority: 'Queue',
      breakdown: { skillMatch: 75, experience: 70, education: 75, completeness: 80, fakeDetection: 90 },
    },
    {
      id: '3',
      name: 'Amit Kumar',
      email: 'amit@example.com',
      experience: 6,
      skills: ['Java', 'Spring', 'AWS'],
      score: 91,
      quality: 'High',
      priority: 'Send Immediately',
      breakdown: { skillMatch: 95, experience: 90, education: 85, completeness: 90, fakeDetection: 95 },
    },
    {
      id: '4',
      name: 'Sneha Gupta',
      email: 'sneha@example.com',
      experience: 1,
      skills: ['HTML', 'CSS', 'JavaScript'],
      score: 45,
      quality: 'Low',
      priority: 'Low Priority',
      breakdown: { skillMatch: 40, experience: 35, education: 60, completeness: 50, fakeDetection: 85 },
    },
    {
      id: '5',
      name: 'Vikram Rao',
      email: 'vikram@example.com',
      experience: 5,
      skills: ['DevOps', 'Kubernetes', 'Docker', 'CI/CD'],
      score: 78,
      quality: 'Medium',
      priority: 'Queue',
      breakdown: { skillMatch: 80, experience: 85, education: 70, completeness: 85, fakeDetection: 90 },
    },
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getQualityBadge = (quality: string) => {
    const styles = {
      High: 'bg-emerald-600/20 text-emerald-400',
      Medium: 'bg-amber-600/20 text-amber-400',
      Low: 'bg-red-600/20 text-red-400',
    };
    return styles[quality as keyof typeof styles];
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      'Send Immediately': 'bg-violet-600/20 text-violet-400',
      'Queue': 'bg-cyan-600/20 text-cyan-400',
      'Low Priority': 'bg-zinc-600/20 text-zinc-400',
    };
    return styles[priority as keyof typeof styles];
  };

  const stats = {
    total: leads.length,
    high: leads.filter(l => l.quality === 'High').length,
    medium: leads.filter(l => l.quality === 'Medium').length,
    low: leads.filter(l => l.quality === 'Low').length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Total Leads</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">High Quality</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.high}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Medium</p>
            <p className="text-2xl font-bold text-amber-400">{stats.medium}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Low Quality</p>
            <p className="text-2xl font-bold text-red-400">{stats.low}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Avg Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              Scored Leads
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/10">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="border-white/10">
                <Zap className="w-4 h-4 mr-2" />
                Auto-Score
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className={`flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border cursor-pointer transition-all hover:border-violet-500/30 ${
                  selectedLead?.id === lead.id ? 'border-violet-500/50' : 'border-white/6'
                }`}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <span className="font-semibold">{lead.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-zinc-500">{lead.email}</p>
                    <div className="flex gap-1 mt-1">
                      {lead.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-zinc-800 rounded">
                          {skill}
                        </span>
                      ))}
                      {lead.skills.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded">
                          +{lead.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getScoreColor(lead.score)}`}>{lead.score}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getQualityBadge(lead.quality)}>{lead.quality}</Badge>
                    <Badge className={getPriorityBadge(lead.priority)}>{lead.priority}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Breakdown */}
        <div>
          <Card className="bg-[#1a1a1a] border-white/6 sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLead ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${selectedLead.score * 3.52} 351.86`}
                          className={getScoreColor(selectedLead.score)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(selectedLead.score)}`}>
                          {selectedLead.score}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 font-medium">{selectedLead.name}</p>
                    <p className="text-sm text-zinc-500">{selectedLead.experience} years exp.</p>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="space-y-4">
                    {[
                      { label: 'Skill Match', value: selectedLead.breakdown.skillMatch, icon: Target, color: 'bg-violet-600' },
                      { label: 'Experience', value: selectedLead.breakdown.experience, icon: Briefcase, color: 'bg-cyan-600' },
                      { label: 'Education', value: selectedLead.breakdown.education, icon: GraduationCap, color: 'bg-emerald-600' },
                      { label: 'Completeness', value: selectedLead.breakdown.completeness, icon: FileCheck, color: 'bg-amber-600' },
                      { label: 'Fake Detection', value: selectedLead.breakdown.fakeDetection, icon: Shield, color: 'bg-red-600' },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-zinc-500" />
                              <span>{item.label}</span>
                            </div>
                            <span>{item.value}%</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/6 space-y-2">
                    <Button className="w-full gradient-primary">
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Send to Recruiter
                    </Button>
                    <Button variant="outline" className="w-full border-white/10">
                      <ArrowDownRight className="w-4 h-4 mr-2" />
                      Move to Queue
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a lead to view score breakdown</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scoring Criteria */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Scoring Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: 'Skill Match', weight: '30%', desc: 'Relevance to job requirements' },
              { name: 'Experience', weight: '25%', desc: 'Years of relevant experience' },
              { name: 'Education', weight: '20%', desc: 'Educational qualifications' },
              { name: 'Completeness', weight: '15%', desc: 'Profile completion rate' },
              { name: 'Fake Detection', weight: '10%', desc: 'Authenticity verification' },
            ].map((criterion, i) => (
              <div key={i} className="p-4 rounded-lg bg-black/30 text-center">
                <p className="font-medium">{criterion.name}</p>
                <p className="text-2xl font-bold text-violet-400 mt-1">{criterion.weight}</p>
                <p className="text-xs text-zinc-500 mt-1">{criterion.desc}</p>
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
                <p className="font-medium">Lead Scoring Automation</p>
                <p className="text-sm text-zinc-500">Resume parsing, scoring, and prioritization fully automated</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              90-100% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
