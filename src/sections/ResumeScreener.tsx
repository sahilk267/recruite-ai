import { useState, useRef } from 'react';
import {
  Upload, FileText, Brain, CheckCircle, XCircle, AlertCircle,
  Sparkles, Target, GraduationCap, Briefcase, ChevronRight,
  RefreshCw, Download, Star, TrendingUp, Code, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import apiClient from '@/services/api';

interface ParseResult {
  skills: string[];
  experience: number;
  education: string;
  name: string;
  email: string;
  phone: string;
  text_preview: string;
  full_text: string;
}

interface MatchResult {
  score: number;
  quality: string;
  skill_match_pct: number;
  exp_score_pct: number;
  matched_skills: string[];
  missing_skills: string[];
  candidate_skills: string[];
  candidate_experience: number;
  candidate_education: string;
  job_skills_required: string[];
  job_experience_min: number;
  recommendation: string;
}

type Tab = 'parse' | 'match';

export function ResumeScreener() {
  const [activeTab, setActiveTab] = useState<Tab>('parse');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const allowed = ['text/plain', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      toast.error('Please upload a .txt, .pdf, .doc, or .docx file');
      return;
    }

    setIsUploading(true);
    setParseResult(null);
    setMatchResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/resumes/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setParseResult(response.data);
      toast.success(`Resume parsed — ${response.data.skills.length} skills found`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleMatch = async () => {
    if (!parseResult) {
      toast.error('Please upload a resume first');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsMatching(true);
    try {
      const response = await apiClient.post('/api/resumes/match', {
        resume_text: parseResult.full_text,
        job_description: jobDescription,
        job_skills: [],
        job_experience_min: 0,
      });
      setMatchResult(response.data);
      toast.success(`Match score: ${response.data.score}/100`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to match resume');
    } finally {
      setIsMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-600/20 border-emerald-500/30';
    if (score >= 50) return 'bg-amber-600/20 border-amber-500/30';
    return 'bg-red-600/20 border-red-500/30';
  };

  const sampleJD = `We are looking for a Senior React Developer with 3+ years of experience.

Required Skills:
- React, TypeScript, Next.js
- Node.js, REST APIs
- Experience with AWS or GCP
- Strong understanding of Redux or Zustand

Nice to have:
- GraphQL experience
- Docker/Kubernetes
- Agile/Scrum methodology

Salary: ₹15-25 LPA | Location: Bangalore / Remote`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Resume Screener</h2>
          <p className="text-sm text-zinc-500">Upload resumes and match them against job descriptions in real-time</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit">
        {[
          { id: 'parse' as Tab, label: 'Parse Resume', icon: FileText },
          { id: 'match' as Tab, label: 'Match to Job', icon: Target },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'parse' && (
          <motion.div
            key="parse"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Upload Area */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-violet-400" />
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 hover:border-violet-500/40 hover:bg-white/2'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-10 h-10 text-violet-400 animate-spin" />
                      <p className="text-sm text-zinc-400">Parsing resume with AI...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium">Drop resume here or click to browse</p>
                        <p className="text-sm text-zinc-500 mt-1">Supports .txt, .pdf, .doc, .docx</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Sparkles className="w-3 h-3" />
                  <span>AI extracts skills, experience, education, and contact info automatically</span>
                </div>
              </CardContent>
            </Card>

            {/* Parse Results */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Extracted Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {parseResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {/* Contact Info */}
                      <div className="p-3 rounded-lg bg-zinc-900/60 space-y-1">
                        {parseResult.name !== 'Unknown' && (
                          <p className="text-sm"><span className="text-zinc-500">Name:</span> <span className="font-medium">{parseResult.name}</span></p>
                        )}
                        {parseResult.email && (
                          <p className="text-sm"><span className="text-zinc-500">Email:</span> <span className="font-medium">{parseResult.email}</span></p>
                        )}
                        {parseResult.phone && (
                          <p className="text-sm"><span className="text-zinc-500">Phone:</span> <span className="font-medium">{parseResult.phone}</span></p>
                        )}
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-violet-600/10 border border-violet-500/20 text-center">
                          <p className="text-2xl font-bold text-violet-400">{parseResult.experience}</p>
                          <p className="text-xs text-zinc-500">Years Exp.</p>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-center">
                          <p className="text-2xl font-bold text-cyan-400">{parseResult.skills.length}</p>
                          <p className="text-xs text-zinc-500">Skills Found</p>
                        </div>
                      </div>

                      {/* Education */}
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <span className="text-zinc-400">Education:</span>
                        <Badge className="bg-emerald-600/20 text-emerald-400">{parseResult.education}</Badge>
                      </div>

                      {/* Skills */}
                      <div>
                        <p className="text-xs text-zinc-500 mb-2">Detected Skills ({parseResult.skills.length})</p>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {parseResult.skills.map((skill, i) => (
                            <Badge key={i} className="bg-violet-600/20 text-violet-400 text-xs">{skill}</Badge>
                          ))}
                          {parseResult.skills.length === 0 && (
                            <p className="text-xs text-zinc-500">No skills detected — try a more detailed resume</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => setActiveTab('match')}
                        className="w-full gradient-primary hover:opacity-90 text-sm"
                      >
                        Match to Job Description <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Upload a resume to see extracted data</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'match' && (
          <motion.div
            key="match"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Job Description Input */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!parseResult && (
                  <div className="p-3 rounded-lg bg-amber-600/10 border border-amber-500/20 text-sm text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Upload a resume first in the "Parse Resume" tab</span>
                  </div>
                )}

                {parseResult && (
                  <div className="p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Resume loaded: {parseResult.skills.length} skills · {parseResult.experience}y exp</span>
                  </div>
                )}

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here..."
                  rows={10}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none resize-none font-mono"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJobDescription(sampleJD)}
                    className="border-white/10 text-zinc-400 hover:text-white text-xs"
                  >
                    Load Sample JD
                  </Button>
                  <Button
                    onClick={handleMatch}
                    disabled={isMatching || !parseResult || !jobDescription.trim()}
                    className="flex-1 gradient-primary hover:opacity-90 text-sm"
                  >
                    {isMatching ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Matching...</>
                    ) : (
                      <><Target className="w-4 h-4 mr-2" /> Match Candidate</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Match Results */}
            <Card className="bg-[#1a1a1a] border-white/6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {matchResult ? (
                    <motion.div
                      key="match-result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {/* Score Circle */}
                      <div className={`p-4 rounded-xl border text-center ${getScoreBg(matchResult.score)}`}>
                        <p className={`text-5xl font-bold ${getScoreColor(matchResult.score)}`}>
                          {matchResult.score}
                        </p>
                        <p className="text-sm text-zinc-400 mt-1">Match Score / 100</p>
                        <Badge className={`mt-2 ${
                          matchResult.quality === 'High' ? 'bg-emerald-600/30 text-emerald-400' :
                          matchResult.quality === 'Medium' ? 'bg-amber-600/30 text-amber-400' :
                          'bg-red-600/30 text-red-400'
                        }`}>
                          {matchResult.quality} Match
                        </Badge>
                      </div>

                      {/* Score Breakdown */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Skill Match</span>
                          <span className="font-medium">{matchResult.skill_match_pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${matchResult.skill_match_pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-zinc-400">Experience Match</span>
                          <span className="font-medium">{matchResult.exp_score_pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{ width: `${matchResult.exp_score_pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Matched / Missing Skills */}
                      {matchResult.matched_skills.length > 0 && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Matched Skills ({matchResult.matched_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResult.matched_skills.map((s, i) => (
                              <Badge key={i} className="bg-emerald-600/20 text-emerald-400 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchResult.missing_skills.length > 0 && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-400" />
                            Missing Skills ({matchResult.missing_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResult.missing_skills.map((s, i) => (
                              <Badge key={i} className="bg-red-600/20 text-red-400 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendation */}
                      <div className={`p-3 rounded-lg text-sm ${getScoreBg(matchResult.score)}`}>
                        <p className={`font-medium ${getScoreColor(matchResult.score)}`}>
                          {matchResult.recommendation}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Enter a job description and click Match</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Skills in Database', value: '200+', color: 'text-violet-400' },
              { label: 'Extraction Accuracy', value: '94%', color: 'text-cyan-400' },
              { label: 'Supported Formats', value: 'TXT/PDF/DOC', color: 'text-emerald-400' },
              { label: 'Processing Time', value: '< 1s', color: 'text-amber-400' },
            ].map((stat, i) => (
              <div key={i}>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
