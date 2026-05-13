import { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';

// ─── Lazy-loaded sections ──────────────────────────────────────────────────────
const DashboardOverview    = lazy(() => import('./sections/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const TrafficEngine        = lazy(() => import('./sections/TrafficEngine').then(m => ({ default: m.TrafficEngine })));
const JobIntelligence      = lazy(() => import('./sections/JobIntelligence').then(m => ({ default: m.JobIntelligence })));
const AIProcessing         = lazy(() => import('./sections/AIProcessing').then(m => ({ default: m.AIProcessing })));
const LeadCapture          = lazy(() => import('./sections/LeadCapture').then(m => ({ default: m.LeadCapture })));
const LeadScoring          = lazy(() => import('./sections/LeadScoring').then(m => ({ default: m.LeadScoring })));
const RecruiterManagement  = lazy(() => import('./sections/RecruiterManagement').then(m => ({ default: m.RecruiterManagement })));
const FollowUpEngine       = lazy(() => import('./sections/FollowUpEngine').then(m => ({ default: m.FollowUpEngine })));
const DealAutomation       = lazy(() => import('./sections/DealAutomation').then(m => ({ default: m.DealAutomation })));
const LeadDistribution     = lazy(() => import('./sections/LeadDistribution').then(m => ({ default: m.LeadDistribution })));
const PaymentSystem        = lazy(() => import('./sections/PaymentSystem').then(m => ({ default: m.PaymentSystem })));
const CRMDashboard         = lazy(() => import('./sections/CRMDashboard').then(m => ({ default: m.CRMDashboard })));
const AutomationFlow       = lazy(() => import('./sections/AutomationFlow').then(m => ({ default: m.AutomationFlow })));
const RiskControl          = lazy(() => import('./sections/RiskControl').then(m => ({ default: m.RiskControl })));
const PhaseExecution       = lazy(() => import('./sections/PhaseExecution').then(m => ({ default: m.PhaseExecution })));
const RevenueDashboard     = lazy(() => import('./sections/RevenueDashboard').then(m => ({ default: m.RevenueDashboard })));
const AutomationTable      = lazy(() => import('./sections/AutomationTable').then(m => ({ default: m.AutomationTable })));
const EmailTemplates       = lazy(() => import('./sections/EmailTemplates').then(m => ({ default: m.EmailTemplates })));
const ProposalSystem       = lazy(() => import('./sections/ProposalSystem').then(m => ({ default: m.ProposalSystem })));
const ConversionDashboard  = lazy(() => import('./sections/ConversionDashboard').then(m => ({ default: m.ConversionDashboard })));
const LeadForms            = lazy(() => import('./sections/LeadForms').then(m => ({ default: m.LeadForms })));
const LeadManagement       = lazy(() => import('./sections/LeadManagement').then(m => ({ default: m.LeadManagement })));
const FollowUpManagement   = lazy(() => import('./sections/FollowUpManagement'));
const SequenceBuilder      = lazy(() => import('./sections/SequenceBuilder'));
const ResumeScreener       = lazy(() => import('./sections/ResumeScreener').then(m => ({ default: m.ResumeScreener })));
const CandidateMatching    = lazy(() => import('./sections/CandidateMatching').then(m => ({ default: m.CandidateMatching })));
const OutreachAutomation   = lazy(() => import('./sections/OutreachAutomation').then(m => ({ default: m.OutreachAutomation })));
const CandidatePipeline    = lazy(() => import('./sections/CandidatePipeline').then(m => ({ default: m.CandidatePipeline })));
const AIAssistant          = lazy(() => import('./sections/AIAssistant').then(m => ({ default: m.AIAssistant })));
const JobDescriptionGenerator = lazy(() => import('./sections/JobDescriptionGenerator').then(m => ({ default: m.JobDescriptionGenerator })));
const InterviewScheduler   = lazy(() => import('./sections/InterviewScheduler').then(m => ({ default: m.InterviewScheduler })));
const SettingsPanel        = lazy(() => import('./sections/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const CompanyCRM           = lazy(() => import('./sections/CompanyCRM').then(m => ({ default: m.CompanyCRM })));
const EmailCampaigns       = lazy(() => import('./sections/EmailCampaigns').then(m => ({ default: m.EmailCampaigns })));
const TeamMessages         = lazy(() => import('./sections/TeamMessages').then(m => ({ default: m.TeamMessages })));
const SocialHub            = lazy(() => import('./sections/SocialHub').then(m => ({ default: m.SocialHub })));

// ─── Route title map ──────────────────────────────────────────────────────────
export const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':           'Dashboard Overview',
  '/traffic':             'Traffic + Content Engine',
  '/jobs':                'Job Intelligence Engine',
  '/ai-processing':       'AI Processing Engine',
  '/leads-capture':       'Lead Capture System',
  '/leads-scoring':       'Lead Scoring Engine',
  '/recruiters':          'Recruiter Acquisition',
  '/followup':            'Follow-Up Engine',
  '/deals':               'Deal Automation',
  '/distribution':        'Lead Distribution',
  '/payments':            'Payment System',
  '/crm':                 'CRM Dashboard',
  '/automation-flow':     'Complete Automation Flow',
  '/risk':                'Risk Control System',
  '/phases':              'Phase Execution',
  '/revenue':             'Revenue Engine',
  '/automation-levels':   'Automation Levels',
  '/templates':           'Email Templates',
  '/proposals':           'Proposal System',
  '/conversion':          'Conversion Dashboard',
  '/forms':               'Lead Capture Forms',
  '/leads':               'Lead Management',
  '/followups':           'Follow-up Management',
  '/sequences':           'Sequence Builder',
  '/resume-screener':     'AI Resume Screener',
  '/candidate-matching':  'AI Candidate Matching',
  '/outreach-automation': 'Automated Email Outreach',
  '/candidate-pipeline':  'Candidate Pipeline Board',
  '/ai-assistant':        'AI Recruitment Assistant',
  '/job-desc-generator':  'AI Job Description Generator',
  '/interview-scheduler': 'Interview Scheduler',
  '/settings':            'Settings',
  '/companies':           'Company CRM',
  '/email-campaigns':     'Email Campaigns',
  '/messages':            'Team Messages',
  '/social':              'Social Media Hub',
};

// ─── Section loading spinner ───────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );
}

// ─── 404 Page ──────────────────────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <p className="text-8xl font-bold text-violet-600 mb-4">404</p>
      <h2 className="text-2xl font-semibold text-white mb-2">Page not found</h2>
      <p className="text-zinc-400 mb-6">This section doesn't exist yet or has been moved.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors text-white text-sm font-medium"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// ─── Authenticated layout (sidebar + header + outlet) ─────────────────────────
function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? 'RecruiteAI';

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header title={title} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<SectionLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"           element={<ErrorBoundary sectionName="Dashboard"><DashboardOverview /></ErrorBoundary>} />
                <Route path="/traffic"             element={<ErrorBoundary sectionName="Traffic Engine"><TrafficEngine /></ErrorBoundary>} />
                <Route path="/jobs"                element={<ErrorBoundary sectionName="Job Intelligence"><JobIntelligence /></ErrorBoundary>} />
                <Route path="/ai-processing"       element={<ErrorBoundary sectionName="AI Processing"><AIProcessing /></ErrorBoundary>} />
                <Route path="/leads-capture"       element={<ErrorBoundary sectionName="Lead Capture"><LeadCapture /></ErrorBoundary>} />
                <Route path="/leads-scoring"       element={<ErrorBoundary sectionName="Lead Scoring"><LeadScoring /></ErrorBoundary>} />
                <Route path="/recruiters"          element={<ErrorBoundary sectionName="Recruiters"><RecruiterManagement /></ErrorBoundary>} />
                <Route path="/followup"            element={<ErrorBoundary sectionName="Follow-Up Engine"><FollowUpEngine /></ErrorBoundary>} />
                <Route path="/deals"               element={<ErrorBoundary sectionName="Deal Automation"><DealAutomation /></ErrorBoundary>} />
                <Route path="/distribution"        element={<ErrorBoundary sectionName="Lead Distribution"><LeadDistribution /></ErrorBoundary>} />
                <Route path="/payments"            element={<ErrorBoundary sectionName="Payment System"><PaymentSystem /></ErrorBoundary>} />
                <Route path="/crm"                 element={<ErrorBoundary sectionName="CRM Dashboard"><CRMDashboard /></ErrorBoundary>} />
                <Route path="/automation-flow"     element={<ErrorBoundary sectionName="Automation Flow"><AutomationFlow /></ErrorBoundary>} />
                <Route path="/risk"                element={<ErrorBoundary sectionName="Risk Control"><RiskControl /></ErrorBoundary>} />
                <Route path="/phases"              element={<ErrorBoundary sectionName="Phase Execution"><PhaseExecution /></ErrorBoundary>} />
                <Route path="/revenue"             element={<ErrorBoundary sectionName="Revenue Engine"><RevenueDashboard /></ErrorBoundary>} />
                <Route path="/automation-levels"   element={<ErrorBoundary sectionName="Automation Levels"><AutomationTable /></ErrorBoundary>} />
                <Route path="/templates"           element={<ErrorBoundary sectionName="Email Templates"><EmailTemplates /></ErrorBoundary>} />
                <Route path="/proposals"           element={<ErrorBoundary sectionName="Proposals"><ProposalSystem /></ErrorBoundary>} />
                <Route path="/conversion"          element={<ErrorBoundary sectionName="Conversion Dashboard"><ConversionDashboard /></ErrorBoundary>} />
                <Route path="/forms"               element={<ErrorBoundary sectionName="Lead Forms"><LeadForms /></ErrorBoundary>} />
                <Route path="/leads"               element={<ErrorBoundary sectionName="Lead Management"><LeadManagement /></ErrorBoundary>} />
                <Route path="/followups"           element={<ErrorBoundary sectionName="Follow-ups"><FollowUpManagement /></ErrorBoundary>} />
                <Route path="/sequences"           element={<ErrorBoundary sectionName="Sequence Builder"><SequenceBuilder /></ErrorBoundary>} />
                <Route path="/resume-screener"     element={<ErrorBoundary sectionName="Resume Screener"><ResumeScreener /></ErrorBoundary>} />
                <Route path="/candidate-matching"  element={<ErrorBoundary sectionName="Candidate Matching"><CandidateMatching /></ErrorBoundary>} />
                <Route path="/outreach-automation" element={<ErrorBoundary sectionName="Email Outreach"><OutreachAutomation /></ErrorBoundary>} />
                <Route path="/candidate-pipeline"  element={<ErrorBoundary sectionName="Pipeline Board"><CandidatePipeline /></ErrorBoundary>} />
                <Route path="/ai-assistant"        element={<ErrorBoundary sectionName="AI Assistant"><AIAssistant /></ErrorBoundary>} />
                <Route path="/job-desc-generator"  element={<ErrorBoundary sectionName="JD Generator"><JobDescriptionGenerator /></ErrorBoundary>} />
                <Route path="/interview-scheduler" element={<ErrorBoundary sectionName="Interview Scheduler"><InterviewScheduler /></ErrorBoundary>} />
                <Route path="/settings"            element={<ErrorBoundary sectionName="Settings"><SettingsPanel /></ErrorBoundary>} />
                <Route path="/companies"           element={<ErrorBoundary sectionName="Company CRM"><CompanyCRM /></ErrorBoundary>} />
                <Route path="/email-campaigns"     element={<ErrorBoundary sectionName="Email Campaigns"><EmailCampaigns /></ErrorBoundary>} />
                <Route path="/messages"            element={<ErrorBoundary sectionName="Team Messages"><TeamMessages /></ErrorBoundary>} />
                <Route path="/social"              element={<ErrorBoundary sectionName="Social Hub"><SocialHub /></ErrorBoundary>} />
                <Route path="*"                    element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return <AuthenticatedLayout />;
}

export default App;
