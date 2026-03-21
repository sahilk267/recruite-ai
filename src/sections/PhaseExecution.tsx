
import { 
  Rocket, 
  Check,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Calendar,
  ArrowRight,
  Star,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Phase {
  id: number;
  name: string;
  duration: string;
  status: 'completed' | 'in-progress' | 'pending';
  goal: string;
  features: string[];
  color: string;
}

const phases: Phase[] = [
  {
    id: 1,
    name: 'Phase 1: Foundation',
    duration: '7 Days',
    status: 'completed',
    goal: 'Traffic Generation',
    features: ['Job Scraper', 'AI Rewrite', 'Auto Posting', 'Basic API'],
    color: 'emerald',
  },
  {
    id: 2,
    name: 'Phase 2: Outreach',
    duration: '14 Days',
    status: 'in-progress',
    goal: 'First Revenue',
    features: ['Recruiter Outreach', 'Lead Capture', 'Follow-up System'],
    color: 'amber',
  },
  {
    id: 3,
    name: 'Phase 3: Automation',
    duration: '30 Days',
    status: 'pending',
    goal: 'Scale & Automate',
    features: ['AI Deal System', 'Payment Automation', 'CRM Dashboard'],
    color: 'rose',
  },
];

export function PhaseExecution() {
  const currentPhase = 2;
  void currentPhase; // Used for UI indication

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-violet-400" />
            Phase Execution Plan
          </h2>
          <p className="text-zinc-500">51-day complete implementation roadmap</p>
        </div>
        <Badge className="bg-violet-600/20 text-violet-400 text-lg px-4 py-2">
          Day 12 of 51
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-500">Overall Progress</p>
              <p className="text-3xl font-bold">23%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Days Remaining</p>
              <p className="text-3xl font-bold text-violet-400">39</p>
            </div>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '23%' }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>Start</span>
            <span>Phase 1</span>
            <span>Phase 2</span>
            <span>Phase 3</span>
            <span>Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="space-y-6">
        {phases.map((phase, index) => {
          const isActive = phase.status === 'in-progress';
          const isCompleted = phase.status === 'completed';
          
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-[#1a1a1a] border-white/6 ${isActive ? 'ring-2 ring-violet-500/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Phase Number */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-emerald-600/20' : 
                      isActive ? 'bg-violet-600/20' : 'bg-zinc-800'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <span className={`text-2xl font-bold ${isActive ? 'text-violet-400' : 'text-zinc-500'}`}>
                          {phase.id}
                        </span>
                      )}
                    </div>

                    {/* Phase Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{phase.name}</h3>
                        <Badge className={
                          isCompleted ? 'bg-emerald-600/20 text-emerald-400' :
                          isActive ? 'bg-violet-600/20 text-violet-400' :
                          'bg-zinc-600/20 text-zinc-400'
                        }>
                          {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {phase.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Goal: {phase.goal}
                        </span>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {phase.features.map((feature, i) => (
                          <span 
                            key={i} 
                            className={`px-3 py-1 rounded-full text-sm ${
                              isCompleted ? 'bg-emerald-600/20 text-emerald-400' :
                              isActive ? 'bg-violet-600/20 text-violet-400' :
                              'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-full lg:w-48">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-500">Progress</span>
                        <span className={isActive ? 'text-violet-400' : ''}>
                          {isCompleted ? '100%' : isActive ? '45%' : '0%'}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isCompleted ? 'bg-emerald-600' :
                            isActive ? 'bg-violet-600' : 'bg-zinc-700'
                          }`}
                          style={{ width: isCompleted ? '100%' : isActive ? '45%' : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Milestones */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="w-5 h-5 text-cyan-400" />
            Key Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { day: 'Day 3', milestone: 'First Job Posted', status: 'completed', icon: Check },
              { day: 'Day 7', milestone: 'Traffic Flowing', status: 'completed', icon: Check },
              { day: 'Day 14', milestone: 'First Revenue', status: 'in-progress', icon: Clock },
              { day: 'Day 30', milestone: 'Full Automation', status: 'pending', icon: Target },
              { day: 'Day 45', milestone: 'Scale Up', status: 'pending', icon: TrendingUp },
              { day: 'Day 51', milestone: 'System Mature', status: 'pending', icon: Star },
            ].map((milestone, i) => {
              const Icon = milestone.icon;
              return (
                <div key={i} className={`p-4 rounded-lg border ${
                  milestone.status === 'completed' ? 'border-emerald-500/30 bg-emerald-600/10' :
                  milestone.status === 'in-progress' ? 'border-violet-500/30 bg-violet-600/10' :
                  'border-white/10 bg-black/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${
                      milestone.status === 'completed' ? 'text-emerald-400' :
                      milestone.status === 'in-progress' ? 'text-violet-400' :
                      'text-zinc-500'
                    }`} />
                    <span className="text-xs text-zinc-500">{milestone.day}</span>
                  </div>
                  <p className="font-medium text-sm">{milestone.milestone}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="font-medium">Current Focus</p>
                <p className="text-sm text-zinc-500">Building recruiter outreach system and lead capture</p>
              </div>
            </div>
            <Button className="gradient-primary">
              <ArrowRight className="w-4 h-4 mr-2" />
              View Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
