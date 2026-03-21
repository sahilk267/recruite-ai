
import { 
  Cpu, 
  Check,
  TrendingUp,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface AutomationModule {
  id: string;
  name: string;
  automation: number;
  color: string;
  description: string;
}

const modules: AutomationModule[] = [
  { id: '1', name: 'Job Scraping', automation: 100, color: '#10b981', description: 'Multi-source job extraction' },
  { id: '2', name: 'Content Posting', automation: 95, color: '#10b981', description: 'Social media auto-posting' },
  { id: '3', name: 'Lead Capture', automation: 100, color: '#10b981', description: 'Form handling & verification' },
  { id: '4', name: 'Lead Scoring', automation: 100, color: '#10b981', description: 'AI-powered lead evaluation' },
  { id: '5', name: 'Follow-up', automation: 100, color: '#10b981', description: 'Automated email & WhatsApp' },
  { id: '6', name: 'Deal Closing', automation: 85, color: '#f59e0b', description: 'AI negotiation & closing' },
  { id: '7', name: 'Payment', automation: 90, color: '#10b981', description: 'Invoicing & collection' },
  { id: '8', name: 'Lead Distribution', automation: 100, color: '#10b981', description: 'Smart routing & matching' },
];

export function AutomationTable() {
  const totalAutomation = Math.round(modules.reduce((sum, m) => sum + m.automation, 0) / modules.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold flex items-center justify-center gap-3"
        >
          <Cpu className="w-8 h-8 text-violet-400" />
          Automation Levels
        </motion.h2>
        <p className="text-zinc-500 mt-2">Complete breakdown of automation across all modules</p>
      </div>

      {/* Total Automation */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <p className="text-zinc-400 mb-4">Total System Automation</p>
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-zinc-800"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${totalAutomation * 5.53} 552.92`}
                  className="text-emerald-500"
                  initial={{ strokeDasharray: '0 552.92' }}
                  animate={{ strokeDasharray: `${totalAutomation * 5.53} 552.92` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-emerald-400">{totalAutomation}%</span>
                <span className="text-sm text-zinc-500 mt-1">Automated</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Breakdown */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Module Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      <span className="font-bold" style={{ color: module.color }}>
                        {module.automation}%
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-xs text-zinc-500">{module.description}</p>
                    </div>
                  </div>
                  <Badge 
                    className={module.automation >= 90 ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'}
                  >
                    {module.automation >= 90 ? 'Fully Auto' : 'Mostly Auto'}
                  </Badge>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: module.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${module.automation}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">6</p>
            <p className="text-zinc-400">Fully Automated</p>
            <p className="text-xs text-zinc-500 mt-1">90-100% automation</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-600/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">2</p>
            <p className="text-zinc-400">Partially Automated</p>
            <p className="text-xs text-zinc-500 mt-1">70-89% automation</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-3xl font-bold text-violet-400">{totalAutomation}%</p>
            <p className="text-zinc-400">Average Automation</p>
            <p className="text-xs text-zinc-500 mt-1">Across all modules</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Target: 95% Automation</p>
                <p className="text-sm text-zinc-500">Current: {totalAutomation}% - On track!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Manual work reduced by</p>
              <p className="text-2xl font-bold text-emerald-400">{totalAutomation}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
