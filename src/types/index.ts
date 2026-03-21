// Navigation
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

// Dashboard Stats
export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: string;
}

// Platform Status
export interface PlatformStatus {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  posts: number;
  status: 'active' | 'pending' | 'disconnected';
}

// Job Data
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  category: string;
  source: string;
  postedAt: string;
  status: 'active' | 'closed' | 'pending';
}

// Lead Data
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume?: string;
  skills: string[];
  experience: number;
  score: number;
  quality: 'High' | 'Medium' | 'Low';
  priority: 'Send Immediately' | 'Queue' | 'Low Priority';
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  createdAt: string;
}

// Recruiter Data
export interface Recruiter {
  id: string;
  company_name: string;
  recruiter_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  company_size?: string;
  hiring_active: boolean;
  source: 'scrape' | 'manual' | 'api';
  scrape_date?: string;
  status: 'new' | 'contacted' | 'interested' | 'replied' | 'deal_closed' | 'active' | 'inactive';
  last_outreach?: string;
  next_outreach?: string;
  outreach_count: number;
  reply_received: boolean;
  leadsSent?: number; // Backend compatibility
  dealsClosed?: number; // Backend compatibility
  createdAt: string;
  updatedAt: string;
}

// Outreach Message
export interface OutreachMessage {
  id: string;
  recruiter_id: string;
  message_type: 'email' | 'whatsapp' | 'sms';
  content: string;
  template_id?: string;
  sent_at?: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  replied: boolean;
  status: 'pending' | 'sent' | 'failed' | 'replied';
  createdAt: string;
}

// Email Template
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'intro' | 'follow-up' | 'offer';
  is_active: boolean;
  createdAt: string;
}

// Proposal
export interface Proposal {
  id: string;
  recruiter_id: string;
  deal_id?: string;
  pdf_url?: string;
  amount?: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  createdAt: string;
}

// Deal Data
export interface Deal {
  id: string;
  recruiterId: string;
  recruiterName: string;
  company: string;
  leadId: string;
  leadName: string;
  value: number;
  status: 'negotiating' | 'proposal_sent' | 'accepted' | 'closed' | 'lost';
  stage: number;
  createdAt: string;
  updatedAt: string;
}

// Payment Data
export interface Payment {
  id: string;
  dealId: string;
  recruiterId: string;
  recruiterName: string;
  amount: number;
  type: 'pay_per_lead' | 'subscription' | 'wallet';
  status: 'pending' | 'invoiced' | 'paid' | 'overdue';
  invoiceDate?: string;
  paidDate?: string;
}

// Follow-up Template
export interface FollowUpTemplate {
  id: string;
  type: 'recruiter' | 'candidate' | 'payment';
  day: number;
  subject: string;
  message: string;
  enabled: boolean;
}

// Automation Settings
export interface AutomationSettings {
  autoEmail: boolean;
  autoWhatsApp: boolean;
  autoFollowUp: boolean;
  autoChatReply: boolean;
  autoProposal: boolean;
  autoDealClose: boolean;
}

// Risk Control Settings
export interface RiskSettings {
  proxyRotation: boolean;
  rateLimit: boolean;
  delaySystem: boolean;
  manualOverride: boolean;
  mode: 'safe' | 'aggressive';
}

// Chart Data
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// AI Processing Output
export interface AIJobOutput {
  title: string;
  skills: string[];
  salary_range: string;
  category: string;
  seo_score: number;
}

// Lead Score Breakdown
export interface LeadScoreBreakdown {
  skillMatch: number;
  experience: number;
  education: number;
  completeness: number;
  fakeDetection: number;
}

// Module Automation Level
export interface ModuleAutomation {
  module: string;
  automation: number;
  color: string;
}
