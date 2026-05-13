import { useState } from 'react';
import {
  Sparkles, Wand2, Save, Copy, Check, Loader2, ChevronDown, ChevronUp,
  Briefcase, MapPin, GraduationCap, Clock, DollarSign, ListChecks, Star,
  FileText, RefreshCw, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { toast } from 'sonner';

interface GeneratedJD {
  title: string;
  summary: string;
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  experience_min: number;
  education: string;
  salary_range: string;
  full_description: string;
  ai_powered: boolean;
  job_id?: string;
}

export function JobDescriptionGenerator() {
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [saveAsJob, setSaveAsJob] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedJD | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const EXAMPLES = [
    'I need a senior React developer for a fintech startup, 5+ years experience, must know TypeScript and AWS',
    'Looking for a Python ML engineer to build recommendation systems, remote-first, strong NLP background preferred',
    'Hiring a DevOps engineer to manage Kubernetes clusters on GCP, 3+ years experience, startup culture',
    'Need a full stack developer for our e-commerce platform, Node.js and Vue.js, Mumbai or Bangalore',
  ];

  async function generate() {
    if (!description.trim()) {
      toast.error('Please describe the role first');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiClient.post('/api/ai/job-description-generator', {
        description: description.trim(),
        company: company.trim() || 'Our Company',
        location: location.trim() || 'Remote',
        save_as_job: saveAsJob,
      });
      setResult(res.data);
      if (res.data.job_id) {
        toast.success('Job description generated and saved to your job board!');
      } else {
        toast.success('Job description generated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to generate job description');
    } finally {
      setLoading(false);
    }
  }

  function copyFull() {
    if (!result) return;
    navigator.clipboard.writeText(result.full_description);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-violet-400" />
          AI Job Description Generator
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">
          Describe a role in plain English — Gemini writes a complete, professional job posting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Input Panel ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Describe the role</p>

            {/* Main description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I need a senior React developer for a fintech startup, 5+ years experience, TypeScript and AWS required..."
              rows={5}
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40 resize-none leading-relaxed"
            />

            {/* Company + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Our Company"
                    className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote"
                    className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Save toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setSaveAsJob(!saveAsJob)}
                className={cn(
                  'w-10 h-5 rounded-full transition-all relative flex-shrink-0',
                  saveAsJob ? 'bg-violet-600' : 'bg-white/10'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                  saveAsJob ? 'left-5' : 'left-0.5'
                )} />
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                Save as a job listing automatically
              </span>
            </label>

            <button
              onClick={generate}
              disabled={loading || !description.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                !loading && description.trim()
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              )}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating with Gemini…</>
                : <><Sparkles className="w-4 h-4" />Generate Job Description</>}
            </button>
          </div>

          {/* Example prompts */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Try an example
            </p>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/8 leading-relaxed"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        {/* ─── Output Panel ────────────────────────────────────────────── */}
        <div>
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center bg-[#1a1a1a] border border-white/8 border-dashed rounded-2xl py-16 text-center">
              <Wand2 className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-600 text-sm font-medium">Your job description will appear here</p>
              <p className="text-zinc-700 text-xs mt-1">Gemini 2.5 Flash · Usually takes 5–10 seconds</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center bg-[#1a1a1a] border border-white/8 rounded-2xl py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-3">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">Gemini is writing your job posting…</p>
              <p className="text-zinc-600 text-xs mt-1">Analysing role requirements and crafting content</p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
              {/* Result header */}
              <div className="p-4 border-b border-white/8 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold text-white">{result.title}</h3>
                    {result.ai_powered && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />AI
                      </span>
                    )}
                    {result.job_id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Save className="w-2.5 h-2.5" />Saved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{result.summary}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={copyFull}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Redo
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-px bg-white/5">
                {[
                  { icon: Clock, label: 'Experience', value: `${result.experience_min}+ yrs` },
                  { icon: DollarSign, label: 'Salary', value: result.salary_range },
                  { icon: GraduationCap, label: 'Education', value: result.education.split(' ').slice(0, 2).join(' ') },
                ].map((item) => (
                  <div key={item.label} className="bg-[#1a1a1a] px-3 py-2.5 text-center">
                    <item.icon className="w-3.5 h-3.5 text-zinc-600 mx-auto mb-0.5" />
                    <p className="text-[10px] text-zinc-600">{item.label}</p>
                    <p className="text-xs font-semibold text-zinc-300">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="p-4 space-y-3 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListChecks className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Required Skills</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.required_skills.map((s) => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {result.preferred_skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Preferred Skills</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.preferred_skills.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              <div className="p-4 border-b border-white/8">
                <div className="flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Key Responsibilities</p>
                </div>
                <ul className="space-y-1.5">
                  {result.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-violet-500 mt-0.5 flex-shrink-0">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full description toggle */}
              <div className="p-4">
                <button
                  onClick={() => setShowFull(!showFull)}
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {showFull ? 'Hide' : 'Show'} full description
                  {showFull ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {showFull && (
                  <div className="mt-3 bg-[#141414] border border-white/8 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                      {result.full_description}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
