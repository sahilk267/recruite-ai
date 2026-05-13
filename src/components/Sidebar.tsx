import { useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles,
  Mail,
  FileText,
  Layout,
  UserCheck,
  ScanText,
  ListChecks,
  SendHorizonal,
  KanbanSquare,
  MessageSquareMore,
  Wand2,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard',           label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/ai-assistant',        label: 'AI Assistant',     icon: MessageSquareMore, badge: 'AI' },
  { path: '/job-desc-generator',  label: 'JD Generator',     icon: Wand2,             badge: 'AI' },
  { path: '/resume-screener',     label: 'Resume Screener',  icon: ScanText,          badge: 'AI' },
  { path: '/candidate-matching',  label: 'Candidate Match',  icon: ListChecks,        badge: 'AI' },
  { path: '/outreach-automation', label: 'Email Outreach',   icon: SendHorizonal,     badge: 'AI' },
  { path: '/candidate-pipeline',  label: 'Pipeline Board',   icon: KanbanSquare },
  { path: '/interview-scheduler', label: 'Interviews',       icon: CalendarDays },
  { path: '/companies',           label: 'Company CRM',      icon: Building2,         badge: 'NEW' },
  { path: '/traffic',             label: 'Traffic Engine',   icon: Megaphone },
  { path: '/jobs',                label: 'Job Intelligence', icon: Search },
  { path: '/ai-processing',       label: 'AI Processing',    icon: Brain },
  { path: '/leads-capture',       label: 'Lead Capture',     icon: Users },
  { path: '/leads-scoring',       label: 'Lead Scoring',     icon: Target },
  { path: '/recruiters',          label: 'Recruiters',       icon: Handshake },
  { path: '/followup',            label: 'Follow-Up',        icon: Repeat },
  { path: '/deals',               label: 'Deal Automation',  icon: Briefcase },
  { path: '/distribution',        label: 'Lead Distribution',icon: Share2 },
  { path: '/payments',            label: 'Payments',         icon: CreditCard },
  { path: '/crm',                 label: 'CRM Dashboard',    icon: BarChart3 },
];

const systemItems = [
  { path: '/automation-flow',   label: 'Automation Flow',  icon: Zap },
  { path: '/risk',              label: 'Risk Control',     icon: Shield },
  { path: '/templates',         label: 'Email Templates',  icon: Mail },
  { path: '/proposals',         label: 'Proposals',        icon: FileText },
  { path: '/conversion',        label: 'Conversion',       icon: Zap },
  { path: '/forms',             label: 'Lead Forms',       icon: Layout },
  { path: '/leads',             label: 'Lead Management',  icon: UserCheck },
  { path: '/followups',         label: 'Follow-ups',       icon: Repeat },
  { path: '/sequences',         label: 'Sequence Builder', icon: Mail },
  { path: '/phases',            label: 'Phases',           icon: Rocket },
  { path: '/revenue',           label: 'Revenue Engine',   icon: TrendingUp },
  { path: '/automation-levels', label: 'Auto Levels',      icon: Cpu },
  { path: '/email-campaigns',   label: 'Email Campaigns',  icon: SendHorizonal, badge: 'NEW' },
  { path: '/messages',          label: 'Team Chat',        icon: MessageSquareMore, badge: 'NEW' },
  { path: '/social',            label: 'Social Hub',       icon: Megaphone, badge: 'NEW' },
  { path: '/settings',          label: 'Settings',         icon: Settings },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (user?.name) return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-[#1a1a1a] border-r border-white/6 z-50 transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
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
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                  !isOpen && 'justify-center px-2'
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-violet-400')} />
                {isOpen && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0',
                        item.badge === 'NEW'
                          ? 'bg-emerald-600/30 text-emerald-300'
                          : 'bg-violet-600/30 text-violet-300'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
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
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                  !isOpen && 'justify-center px-2'
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-cyan-400')} />
                {isOpen && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      {isOpen ? (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/6 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="font-semibold text-sm">{getUserInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role || 'admin'}</p>
            </div>
            <button onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-white/6 bg-[#1a1a1a]">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mx-auto">
            <span className="font-semibold text-sm">{getUserInitials()}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
