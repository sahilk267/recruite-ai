import { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Brain, 
  Users, 
  Send,
  Repeat,
  MessageSquare,
  Target,
  Share2,
  CreditCard,
  TrendingUp,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface FlowStep {
  id: number;
  label: string;
  icon: React.ElementType;
  description: string;
}

const flowSteps: FlowStep[] = [
  { id: 1, label: 'Scraper runs', icon: Search, description: 'Job scrapers start crawling sources' },
  { id: 2, label: 'Job detected', icon: Search, description: 'New job posting identified' },
  { id: 3, label: 'AI rewrite', icon: Brain, description: 'Content optimized by AI' },
  { id: 4, label: 'Recruiter found', icon: Users, description: 'Matching recruiter identified' },
  { id: 5, label: 'Outreach sent', icon: Send, description: 'Initial contact made' },
  { id: 6, label: 'Follow-up triggered', icon: Repeat, description: 'Automated follow-up sequence' },
  { id: 7, label: 'AI handles replies', icon: MessageSquare, description: 'Chat responses automated' },
  { id: 8, label: 'Deal auto close', icon: Target, description: 'Deal closed by AI' },
  { id: 9, label: 'Job posted', icon: Share2, description: 'Posted to social platforms' },
  { id: 10, label: 'User clicks', icon: Users, description: 'Candidate clicks job link' },
  { id: 11, label: 'Lead captured', icon: Users, description: 'Lead information collected' },
  { id: 12, label: 'AI scoring', icon: Brain, description: 'Lead scored by AI' },
  { id: 13, label: 'Recruiter match', icon: Target, description: 'Best recruiter matched' },
  { id: 14, label: 'Lead sent', icon: Send, description: 'Lead sent to recruiter' },
  { id: 15, label: 'Payment request', icon: CreditCard, description: 'Invoice generated' },
  { id: 16, label: 'Payment follow-up', icon: Repeat, description: 'Payment reminder sent' },
  { id: 17, label: 'Revenue tracked', icon: TrendingUp, description: 'Revenue recorded' },
];

export function AutomationFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= flowSteps.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setActiveStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-violet-400" />
            Complete Automation Flow
          </h2>
          <p className="text-zinc-500">17-step fully automated recruitment pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsPlaying(!isPlaying)}
            className="border-white/10"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" onClick={reset} className="border-white/10">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Flow Visualization */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-8">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-zinc-800 rounded">
              <motion.div 
                className="h-full gradient-primary rounded"
                initial={{ width: '0%' }}
                animate={{ width: `${(activeStep / (flowSteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-17 gap-2 relative">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= activeStep;
                const isCurrent = index === activeStep;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center"
                  >
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-violet-600 glow-purple scale-110' 
                          : isActive 
                            ? 'bg-violet-600/50 border-2 border-violet-500/50' 
                            : 'bg-zinc-800 border-2 border-zinc-700'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    </div>
                    <div className="mt-4 text-center">
                      <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                        {step.id}
                      </p>
                      <p className={`text-xs mt-1 ${isActive ? 'text-violet-400' : 'text-zinc-600'}`}>
                        {step.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-20 bg-violet-600/20 border border-violet-500/30 rounded-lg px-3 py-2 text-xs text-center max-w-[120px]"
                      >
                        {step.description}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Current Step</p>
            <p className="text-2xl font-bold text-violet-400">
              {activeStep > 0 ? flowSteps[activeStep]?.label : 'Ready'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {activeStep > 0 ? flowSteps[activeStep]?.description : 'Click Play to start'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Progress</p>
            <p className="text-2xl font-bold text-emerald-400">
              {Math.round((activeStep / (flowSteps.length - 1)) * 100)}%
            </p>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
              <motion.div 
                className="h-full bg-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(activeStep / (flowSteps.length - 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <p className="text-zinc-400 text-sm">Total Steps</p>
            <p className="text-2xl font-bold text-cyan-400">{flowSteps.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Fully automated pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Summary */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg">Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { phase: 'Discovery', steps: '1-3', color: 'violet' },
              { phase: 'Outreach', steps: '4-8', color: 'cyan' },
              { phase: 'Marketing', steps: '9-10', color: 'emerald' },
              { phase: 'Processing', steps: '11-14', color: 'amber' },
              { phase: 'Revenue', steps: '15-17', color: 'rose' },
            ].map((item, i) => (
              <div key={i} className={`p-4 rounded-lg bg-${item.color}-600/10 border border-${item.color}-500/30`}>
                <p className={`text-${item.color}-400 font-medium`}>{item.phase}</p>
                <p className="text-2xl font-bold mt-1">{item.steps}</p>
                <p className="text-xs text-zinc-500">Steps</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

