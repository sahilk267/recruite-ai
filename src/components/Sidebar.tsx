import { 
  LayoutDashboard, 
  Megaphone, 
  Search, 
  Brain, 
  Users, 
  Target, 
  Handshake,
  Repeat,
  Briefcase,
  Share2,
  CreditCard,
  BarChart3,
  Settings,
  Zap,
  Shield,
  Rocket,
  TrendingUp,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: any) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'traffic', label: 'Traffic Engine', icon: Megaphone },
  { id: 'jobs', label: 'Job Intelligence', icon: Search },
  { id: 'ai-processing', label: 'AI Processing', icon: Brain },
  { id: 'leads-capture', label: 'Lead Capture', icon: Users },
  { id: 'leads-scoring', label: 'Lead Scoring', icon: Target },
  { id: 'recruiters', label: 'Recruiters', icon: Handshake },
  { id: 'followup', label: 'Follow-Up', icon: Repeat },
  { id: 'deals', label: 'Deal Automation', icon: Briefcase },
  { id: 'distribution', label: 'Lead Distribution', icon: Share2 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'crm', label: 'CRM Dashboard', icon: BarChart3 },
];

const systemItems = [
  { id: 'automation-flow', label: 'Automation Flow', icon: Zap },
  { id: 'risk', label: 'Risk Control', icon: Shield },
  { id: 'phases', label: 'Phases', icon: Rocket },
  { id: 'revenue', label: 'Revenue Engine', icon: TrendingUp },
  { id: 'automation-levels', label: 'Auto Levels', icon: Cpu },
];

export function Sidebar({ activeSection, onSectionChange, isOpen, onToggle }: SidebarProps) {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-[#1a1a1a] border-r border-white/6 z-50 transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/6">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">RecruitAI</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        <button 
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="py-4 overflow-y-auto h-[calc(100%-140px)]">
        <div className="px-3 mb-2">
          {isOpen && <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Modules</span>}
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/30" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  !isOpen && "justify-center px-2"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-violet-400")} />
                {isOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-3 mt-6 mb-2">
          {isOpen && <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">System</span>}
        </div>
        <nav className="space-y-1 px-2">
          {systemItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  !isOpen && "justify-center px-2"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-cyan-400")} />
                {isOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      {isOpen ? (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/6 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <span className="font-semibold text-sm">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin Dashboard</p>
              <p className="text-xs text-zinc-500">Super Admin</p>
            </div>
            <Settings className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer" />
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-white/6 bg-[#1a1a1a]">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mx-auto">
            <span className="font-semibold text-sm">AD</span>
          </div>
        </div>
      )}
    </aside>
  );
}
