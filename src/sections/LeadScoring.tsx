import { useState, useEffect } from 'react';
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
  ArrowDownRight,
  Loader,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { leadService } from '@/services';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string;
  experience: number;
  skills: string[];
  score?: number;
  quality?: 'High' | 'Medium' | 'Low';
  priority?: 'Send Immediately' | 'Queue' | 'Low Priority';
}

export function LeadScoring() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);

  // Fetch leads from API on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await leadService.getAllLeads({ page: 1, pageSize: 10 });
      const leadsData = response.data || [];
      setLeads(leadsData.map((lead: any) => ({
        ...lead,
        score: lead.score || 0,
        quality: lead.score >= 80 ? 'High' : lead.score >= 60 ? 'Medium' : 'Low',
        priority: lead.score >= 80 ? 'Send Immediately' : lead.score >= 60 ? 'Queue' : 'Low Priority',
      })));
      if (leadsData.length > 0) {
        setSelectedLead(leadsData[0]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreLead = async (leadId: string) => {
    setIsScoring(true);
    try {
      const response = await leadService.scoreLead(leadId);
      
      // Update leads with new score
      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? {
              ...lead,
              score: response.score,
              quality: response.score >= 80 ? 'High' : response.score >= 60 ? 'Medium' : 'Low',
              priority: response.score >= 80 ? 'Send Immediately' : response.score >= 60 ? 'Queue' : 'Low Priority',
            }
          : lead
      ));
      
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? {
          ...prev,
          score: response.score,
          quality: response.score >= 80 ? 'High' : response.score >= 60 ? 'Medium' : 'Low',
          priority: response.score >= 80 ? 'Send Immediately' : response.score >= 60 ? 'Queue' : 'Low Priority',
        } : null);
      }
      
      toast.success(`Lead scored: ${response.score}/100`);
    } catch (error) {
      console.error('Error scoring lead:', error);
      toast.error('Failed to score lead');
    } finally {
      setIsScoring(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-zinc-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getQualityBadge = (quality?: string) => {
    const styles: Record<string, string> = {
      'High': 'bg-emerald-600/20 text-emerald-400',
      'Medium': 'bg-amber-600/20 text-amber-400',
      'Low': 'bg-red-600/20 text-red-400',
    };
    return styles[quality || 'Low'] || styles.Low;
  };

  const getPriorityBadge = (priority?: string) => {
    const styles: Record<string, string> = {
      'Send Immediately': 'bg-violet-600/20 text-violet-400',
      'Queue': 'bg-cyan-600/20 text-cyan-400',
      'Low Priority': 'bg-zinc-600/20 text-zinc-400',
    };
    return styles[priority || 'Low Priority'] || styles['Low Priority'];
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
        <h1 className="text-3xl font-bold">Lead Scoring Engine</h1>
        <Button 
          onClick={fetchLeads}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <Card className="bg-[#1a1a1a] border-white/6 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Leads ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedLead?.id === lead.id
                      ? 'bg-violet-600/20 border border-violet-600/50'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{lead.email}</p>
                    </div>
                    {lead.score !== undefined && (
                      <span className={`text-sm font-bold flex-shrink-0 ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    )}
                  </div>
                  {lead.quality && (
                    <Badge className={`mt-2 text-xs ${getQualityBadge(lead.quality)}`}>
                      {lead.quality}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Details */}
        {selectedLead && (
          <Card className="bg-[#1a1a1a] border-white/6 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedLead.name}</CardTitle>
                <p className="text-sm text-zinc-400 mt-1">{selectedLead.email}</p>
              </div>
              <Button
                onClick={() => scoreLead(selectedLead.id)}
                disabled={isScoring}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isScoring ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Score Lead
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Display */}
              {selectedLead.score !== undefined && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-zinc-400">Overall Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(selectedLead.score)}`}>
                        {selectedLead.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          selectedLead.score >= 80
                            ? 'bg-emerald-500'
                            : selectedLead.score >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedLead.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quality & Priority */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.quality && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Quality</p>
                    <Badge className={getQualityBadge(selectedLead.quality)}>
                      {selectedLead.quality}
                    </Badge>
                  </div>
                )}
                {selectedLead.priority && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Priority</p>
                    <Badge className={getPriorityBadge(selectedLead.priority)}>
                      {selectedLead.priority}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Experience & Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">{selectedLead.experience} years experience</span>
                </div>
                {selectedLead.skills && selectedLead.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-violet-600/20 text-violet-400 text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
