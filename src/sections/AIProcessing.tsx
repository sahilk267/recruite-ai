import { useState } from 'react';
import { 
  Brain, 
  Wand2, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw,
  Code,
  Tag,
  IndianRupee,
  Folder,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface AIOutput {
  title: string;
  skills: string[];
  salary_range: string;
  category: string;
  seo_score: number;
  experience: string;
  job_type: string;
}

export function AIProcessing() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<AIOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleInputs = [
    "We need a React developer with 3+ years experience. Salary 8-12 LPA. Location: Bangalore.",
    "Hiring Python developer for AI/ML projects. Remote work. 5-8 years exp.",
    "Java Spring Boot developer needed urgently. 2-4 years. Mumbai office.",
  ];

  const processJob = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockOutput: AIOutput = {
      title: input.toLowerCase().includes('react') 
        ? "🚀 Urgent Hiring: React Developer (Remote)"
        : input.toLowerCase().includes('python')
        ? "🐍 Python Developer - AI/ML Projects (Remote)"
        : "💼 Senior Software Developer Position",
      skills: input.toLowerCase().includes('react') 
        ? ["React", "JavaScript", "TypeScript", "Redux", "Node.js"]
        : input.toLowerCase().includes('python')
        ? ["Python", "Machine Learning", "TensorFlow", "Data Science", "SQL"]
        : ["Java", "Spring Boot", "Microservices", "MySQL", "REST APIs"],
      salary_range: input.match(/\d+-\d+/) ? `₹${input.match(/\d+-\d+/)![0]} LPA` : "₹5-15 LPA",
      category: input.toLowerCase().includes('react') || input.toLowerCase().includes('python') || input.toLowerCase().includes('java')
        ? "IT & Software"
        : "Engineering",
      seo_score: Math.floor(Math.random() * 15) + 85,
      experience: input.match(/\d+\+?\s*years?/) ? input.match(/\d+\+?\s*years?/)![0] : "2-5 years",
      job_type: input.toLowerCase().includes('remote') ? "Remote" : "On-site",
    };
    
    setOutput(mockOutput);
    setIsProcessing(false);
  };

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const features = [
    { icon: Wand2, name: 'Job Rewrite', desc: 'SEO-optimized job descriptions', color: 'violet' },
    { icon: Tag, name: 'Skill Extraction', desc: 'Auto-detect required skills', color: 'cyan' },
    { icon: IndianRupee, name: 'Salary Estimation', desc: 'Market-competitive ranges', color: 'emerald' },
    { icon: Folder, name: 'Category Tagging', desc: 'Smart job categorization', color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const colors = {
            violet: 'bg-violet-600/20 text-violet-400',
            cyan: 'bg-cyan-600/20 text-cyan-400',
            emerald: 'bg-emerald-600/20 text-emerald-400',
            amber: 'bg-amber-600/20 text-amber-400',
          };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#1a1a1a] border-white/6 hover:border-violet-500/30 transition-all">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${colors[feature.color as keyof typeof colors]} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium">{feature.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Processing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              Job Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Raw Job Description</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste raw job description here..."
                rows={8}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none resize-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Quick Samples</label>
              <div className="flex flex-wrap gap-2">
                {sampleInputs.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sample)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
                  >
                    Sample {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={processJob}
              disabled={isProcessing || !input.trim()}
              className="w-full gradient-primary hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing with Ollama...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="w-5 h-5 text-cyan-400" />
              AI Output
            </CardTitle>
            {output && (
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* SEO Score */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/30">
                    <span className="text-sm">SEO Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${output.seo_score}%` }} />
                      </div>
                      <Badge className="bg-emerald-600/20 text-emerald-400">{output.seo_score}%</Badge>
                    </div>
                  </div>

                  {/* JSON Output */}
                  <div className="p-4 rounded-lg bg-black/50 border border-white/10 font-mono text-sm overflow-auto">
                    <pre className="text-zinc-300">
{`{
  "title": "${output.title}",
  "skills": [${output.skills.map(s => `"${s}"`).join(', ')}],
  "salary_range": "${output.salary_range}",
  "category": "${output.category}",
  "experience": "${output.experience}",
  "job_type": "${output.job_type}",
  "seo_score": ${output.seo_score}
}`}
                    </pre>
                  </div>

                  {/* Skills Tags */}
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Extracted Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {output.skills.map((skill, i) => (
                        <Badge key={i} className="bg-violet-600/20 text-violet-400 px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Enter a job description and click Process</p>
                    <p className="text-sm mt-1">AI will generate optimized output</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Processing Stats */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-400">12,847</p>
              <p className="text-sm text-zinc-500">Jobs Processed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-400">98.5%</p>
              <p className="text-sm text-zinc-500">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">2.3s</p>
              <p className="text-sm text-zinc-500">Avg Processing Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">Ollama</p>
              <p className="text-sm text-zinc-500">AI Engine</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Badge */}
      <div className="flex justify-center">
        <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-6 py-3">
          <Zap className="w-5 h-5 mr-2" />
          100% Automated Processing
        </Badge>
      </div>
    </div>
  );
}
