import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './sections/DashboardOverview';
import { TrafficEngine } from './sections/TrafficEngine';
import { JobIntelligence } from './sections/JobIntelligence';
import { AIProcessing } from './sections/AIProcessing';
import { LeadCapture } from './sections/LeadCapture';
import { LeadScoring } from './sections/LeadScoring';
import { RecruiterAcquisition } from './sections/RecruiterAcquisition';
import { FollowUpEngine } from './sections/FollowUpEngine';
import { DealAutomation } from './sections/DealAutomation';
import { LeadDistribution } from './sections/LeadDistribution';
import { PaymentSystem } from './sections/PaymentSystem';
import { CRMDashboard } from './sections/CRMDashboard';
import { AutomationFlow } from './sections/AutomationFlow';
import { RiskControl } from './sections/RiskControl';
import { PhaseExecution } from './sections/PhaseExecution';
import { RevenueEngine } from './sections/RevenueEngine';
import { AutomationTable } from './sections/AutomationTable';

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
  | 'automation-levels';

function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        return <RecruiterAcquisition />;
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
        return <RevenueEngine />;
      case 'automation-levels':
        return <AutomationTable />;
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
      'automation-levels': 'Automation Levels'
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
