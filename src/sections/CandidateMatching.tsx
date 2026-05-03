import { useState, useEffect } from 'react';
import {
  Users, Briefcase, Star, ChevronDown, ChevronUp, RefreshCw,
  CheckCircle, XCircle, TrendingUp, Target, Filter, Search,
  Layers, Award, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jobService } from '@/services';
import apiClient from '@/services/api';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  experience_min: number;
  status: string;
}

interface CandidateMatch {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: number;
  score: number;
  quality: string;
  match_score: number;
  match_quality: string;
  skill_match_pct: number;
  matched_skills: string[];
  missing_skills: string[];
}

interface MatchData {
  job: Job;
  candidates: CandidateMatch[];
  total: number;
}

export function CandidateMatching() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await jobService.getAllJobs(1, 20);
      const jobList = response.data || [];
      setJobs(jobList);
      if (jobList.length > 0) {
        setSelectedJob(jobList[0]);
      }
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const runMatching = async (job: Job) => {
    setIsMatching(true);
    setMatchData(null);
    try {
      const response = await apiClient.post(`/api/jobs/${job.id}/match-candidates`);
      setMatchData(response.data);
      toast.success(`Matched ${response.data.candidates.length} candidates for ${job.title}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to match candidates');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setMatchData(null);
    setFilterQuality('all');
  };

  const filteredCandidates = (matchData?.candidates || []).filter(c => {
    const matchesQuality = filterQuality === 'all' || c.match_quality === filterQuality;
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesQuality && matchesSearch;
  });

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBadge = (quality: string) => {
    if (quality === 'High') return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
    if (quality === 'Medium') return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
    return 'bg-red-600/20 text-red-400 border-red-500/30';
  };

  const highCount = matchData?.candidates.filter(c => c.match_quality === 'High').length || 0;
  const medCount = matchData?.candidates.filter(c => c.match_quality === 'Medium').length || 0;
  const lowCount = matchData?.candidates.filter(c => c.match_quality === 'Low').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Candidate Matching</h2>
          <p className="text-sm text-zinc-500">Rank all candidates against any job using real skill-match scoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                Select Job
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchJobs}
                disabled={isLoadingJobs}
                className="text-zinc-500 hover:text-white h-7 px-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12 text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No jobs found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {jobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full text-left p-4 transition-all hover:bg-white/3 ${
                      selectedJob?.id === job.id ? 'bg-cyan-600/10 border-l-2 border-cyan-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{job.company} · {job.location}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`text-xs ${job.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-zinc-600/20 text-zinc-400'}`}>
                        {job.status}
                      </Badge>
                      <span className="text-xs text-zinc-600">{job.skills?.length || 0} skills</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedJob && (
              <div className="p-4 border-t border-white/6">
                <Button
                  onClick={() => runMatching(selectedJob)}
                  disabled={isMatching}
                  className="w-full gradient-primary hover:opacity-90 text-sm"
                >
                  {isMatching ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Matching...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> Run AI Match</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected Job Info */}
          {selectedJob && (
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{selectedJob.title}</h3>
                    <p className="text-sm text-zinc-500">{selectedJob.company} · {selectedJob.location} · {selectedJob.salary}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedJob.skills?.slice(0, 6).map((s, i) => (
                        <Badge key={i} className="bg-cyan-600/20 text-cyan-400 text-xs">{s}</Badge>
                      ))}
                      {(selectedJob.skills?.length || 0) > 6 && (
                        <Badge className="bg-zinc-700/50 text-zinc-400 text-xs">+{selectedJob.skills.length - 6} more</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-zinc-500 flex-shrink-0">
                    <p>{selectedJob.experience_min}+ years exp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Match Summary */}
          {matchData && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'High Match', count: highCount, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/20', q: 'High' },
                { label: 'Medium Match', count: medCount, color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-500/20', q: 'Medium' },
                { label: 'Low Match', count: lowCount, color: 'text-red-400', bg: 'bg-red-600/10 border-red-500/20', q: 'Low' },
              ].map(stat => (
                <button
                  key={stat.q}
                  onClick={() => setFilterQuality(filterQuality === stat.q ? 'all' : stat.q)}
                  className={`p-3 rounded-xl border text-center transition-all ${stat.bg} ${filterQuality === stat.q ? 'ring-1 ring-white/20' : ''}`}
                >
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
                </button>
              ))}
            </div>
          )}

          {/* Filter & Search */}
          {matchData && (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFilterQuality('all'); setSearchQuery(''); }}
                className="border-white/10 text-zinc-400 hover:text-white text-xs"
              >
                <Filter className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </div>
          )}

          {/* Candidates List */}
          <AnimatePresence mode="wait">
            {isMatching ? (
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardContent className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400">Running AI matching algorithm...</p>
                  <p className="text-xs text-zinc-600 mt-1">Comparing skills, experience, and fit</p>
                </CardContent>
              </Card>
            ) : matchData ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {filteredCandidates.length === 0 ? (
                  <Card className="bg-[#1a1a1a] border-white/6">
                    <CardContent className="py-12 text-center text-zinc-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No candidates match the current filter</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredCandidates.map((candidate, idx) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className="bg-[#1a1a1a] border-white/6 hover:border-white/10 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Rank */}
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-zinc-400">
                              {idx + 1}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="font-medium">{candidate.name}</p>
                                  <p className="text-xs text-zinc-500">{candidate.email} · {candidate.experience}y exp</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getScoreBadge(candidate.match_quality)} border text-xs font-medium`}>
                                    {candidate.match_quality}
                                  </Badge>
                                  <span className={`text-xl font-bold ${getScoreColor(candidate.match_score)}`}>
                                    {candidate.match_score}
                                  </span>
                                </div>
                              </div>

                              {/* Skill Match Bar */}
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-xs text-zinc-500">
                                  <span>Skill match</span>
                                  <span>{candidate.skill_match_pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                                    style={{ width: `${candidate.skill_match_pct}%` }}
                                  />
                                </div>
                              </div>

                              {/* Matched Skills Preview */}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {candidate.matched_skills.slice(0, 4).map((s, i) => (
                                  <Badge key={i} className="bg-emerald-600/15 text-emerald-400 text-xs">{s}</Badge>
                                ))}
                                {candidate.missing_skills.slice(0, 2).map((s, i) => (
                                  <Badge key={i} className="bg-red-600/15 text-red-400 text-xs line-through opacity-60">{s}</Badge>
                                ))}
                              </div>

                              {/* Expand toggle */}
                              <button
                                onClick={() => setExpandedCandidate(
                                  expandedCandidate === candidate.id ? null : candidate.id
                                )}
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors"
                              >
                                {expandedCandidate === candidate.id ? (
                                  <><ChevronUp className="w-3 h-3" /> Hide details</>
                                ) : (
                                  <><ChevronDown className="w-3 h-3" /> View all skills</>
                                )}
                              </button>

                              <AnimatePresence>
                                {expandedCandidate === candidate.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 pt-3 border-t border-white/6 space-y-3">
                                      <div>
                                        <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                                          All Matched Skills
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {candidate.matched_skills.map((s, i) => (
                                            <Badge key={i} className="bg-emerald-600/20 text-emerald-400 text-xs">{s}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      {candidate.missing_skills.length > 0 && (
                                        <div>
                                          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                                            <XCircle className="w-3 h-3 text-red-400" />
                                            Missing Skills
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {candidate.missing_skills.map((s, i) => (
                                              <Badge key={i} className="bg-red-600/20 text-red-400 text-xs">{s}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-zinc-500 mb-1.5">All Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {candidate.skills.map((s, i) => (
                                            <Badge key={i} className="bg-zinc-700/50 text-zinc-300 text-xs">{s}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : selectedJob ? (
              <Card className="bg-[#1a1a1a] border-white/6">
                <CardContent className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-7 h-7 text-cyan-400" />
                  </div>
                  <p className="text-zinc-400">Click "Run AI Match" to rank all candidates</p>
                  <p className="text-xs text-zinc-600 mt-1">The AI will score each candidate against the selected job</p>
                </CardContent>
              </Card>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
