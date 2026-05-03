import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './sections/DashboardOverview';
import { TrafficEngine } from './sections/TrafficEngine';
import { JobIntelligence } from './sections/JobIntelligence';
import { AIProcessing } from './sections/AIProcessing';
import { LeadCapture } from './sections/LeadCapture';
import { LeadScoring } from './sections/LeadScoring';
import { RecruiterManagement } from './sections/RecruiterManagement';
import { FollowUpEngine } from './sections/FollowUpEngine';
import { DealAutomation } from './sections/DealAutomation';
import { LeadDistribution } from './sections/LeadDistribution';
import { PaymentSystem } from './sections/PaymentSystem';
import { CRMDashboard } from './sections/CRMDashboard';
import { AutomationFlow } from './sections/AutomationFlow';
import { RiskControl } from './sections/RiskControl';
import { PhaseExecution } from './sections/PhaseExecution';
import { AutomationTable } from './sections/AutomationTable';
import { EmailTemplates } from './sections/EmailTemplates';
import { ProposalSystem } from './sections/ProposalSystem';
import { ConversionDashboard } from './sections/ConversionDashboard';
import { RevenueDashboard } from './sections/RevenueDashboard';
import { LeadForms } from './sections/LeadForms';
import { LeadManagement } from './sections/LeadManagement';
import FollowUpManagement from './sections/FollowUpManagement';
import SequenceBuilder from './sections/SequenceBuilder';
import { ResumeScreener } from './sections/ResumeScreener';
import { CandidateMatching } from './sections/CandidateMatching';
import { OutreachAutomation } from './sections/OutreachAutomation';

type Section =
  | 'dashboard'
  | 'traffic'
  | 'jobs'
  | 'ai-processing'
  | 'leads-capture'
  | 'leads-scoring'
  | 'recruiters'
  | 'followup'
  | 'deals'
  | 'distribution'
  | 'payments'
  | 'crm'
  | 'automation-flow'
  | 'risk'
  | 'phases'
  | 'revenue'
  | 'automation-levels'
  | 'templates'
  | 'proposals'
  | 'conversion'
  | 'forms'
  | 'leads'
  | 'followups'
  | 'sequences'
  | 'resume-screener'
  | 'candidate-matching'
  | 'outreach-automation';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'traffic':
        return <TrafficEngine />;
      case 'jobs':
        return <JobIntelligence />;
      case 'ai-processing':
        return <AIProcessing />;
      case 'leads-capture':
        return <LeadCapture />;
      case 'leads-scoring':
        return <LeadScoring />;
      case 'recruiters':
        return <RecruiterManagement />;
      case 'followup':
        return <FollowUpEngine />;
      case 'deals':
        return <DealAutomation />;
      case 'distribution':
        return <LeadDistribution />;
      case 'payments':
        return <PaymentSystem />;
      case 'crm':
        return <CRMDashboard />;
      case 'automation-flow':
        return <AutomationFlow />;
      case 'risk':
        return <RiskControl />;
      case 'phases':
        return <PhaseExecution />;
      case 'revenue':
        return <RevenueDashboard />;
      case 'automation-levels':
        return <AutomationTable />;
      case 'templates':
        return <EmailTemplates />;
      case 'proposals':
        return <ProposalSystem />;
      case 'conversion':
        return <ConversionDashboard />;
      case 'forms':
        return <LeadForms />;
      case 'leads':
        return <LeadManagement />;
      case 'followups':
        return <FollowUpManagement />;
      case 'sequences':
        return <SequenceBuilder />;
      case 'resume-screener':
        return <ResumeScreener />;
      case 'candidate-matching':
        return <CandidateMatching />;
      case 'outreach-automation':
        return <OutreachAutomation />;
      default:
        return <DashboardOverview />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<Section, string> = {
      dashboard: 'Dashboard Overview',
      traffic: 'Traffic + Content Engine',
      jobs: 'Job Intelligence Engine',
      'ai-processing': 'AI Processing Engine',
      'leads-capture': 'Lead Capture System',
      'leads-scoring': 'Lead Scoring Engine',
      recruiters: 'Recruiter Acquisition',
      followup: 'Follow-Up Engine',
      deals: 'Deal Automation',
      distribution: 'Lead Distribution',
      payments: 'Payment System',
      crm: 'CRM Dashboard',
      'automation-flow': 'Complete Automation Flow',
      risk: 'Risk Control System',
      phases: 'Phase Execution',
      revenue: 'Revenue Engine',
      'automation-levels': 'Automation Levels',
      templates: 'Email Templates',
      proposals: 'Proposal System',
      conversion: 'Conversion Dashboard',
      forms: 'Lead Capture Forms',
      leads: 'Lead Management',
      followups: 'Follow-up Management',
      sequences: 'Sequence Builder',
      'resume-screener': 'AI Resume Screener',
      'candidate-matching': 'AI Candidate Matching',
      'outreach-automation': 'Automated Email Outreach',
    };
    return titles[activeSection] || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header 
          title={getSectionTitle()} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
