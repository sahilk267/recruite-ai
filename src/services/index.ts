import apiClient from './api';
import type { Job, Lead, Recruiter, Deal, Payment, EmailTemplate, Proposal } from '@/types';

// ============ JOB SERVICE ============
export const jobService = {
  getAllJobs: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/jobs', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getJobById: async (id: string) => {
    const response = await apiClient.get(`/api/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: Partial<Job>) => {
    const response = await apiClient.post('/api/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: Partial<Job>) => {
    const response = await apiClient.patch(`/api/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id: string) => {
    const response = await apiClient.delete(`/api/jobs/${id}`);
    return response.data;
  },
};

// ============ LEAD SERVICE ============
export const leadService = {
  getAllLeads: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/leads', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getLeadById: async (id: string) => {
    const response = await apiClient.get(`/api/leads/${id}`);
    return response.data;
  },

  createLead: async (data: Partial<Lead>) => {
    const response = await apiClient.post('/api/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: Partial<Lead>) => {
    const response = await apiClient.patch(`/api/leads/${id}`, data);
    return response.data;
  },

  scoreLead: async (id: string) => {
    const response = await apiClient.post(`/api/leads/${id}/score`);
    return response.data;
  },

  deleteLead: async (id: string) => {
    const response = await apiClient.delete(`/api/leads/${id}`);
    return response.data;
  },
};

// ============ RECRUITER SERVICE ============
export const recruiterService = {
  getAllRecruiters: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/recruiters', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getRecruiterById: async (id: string) => {
    const response = await apiClient.get(`/api/recruiters/${id}`);
    return response.data;
  },

  createRecruiter: async (data: Partial<Recruiter>) => {
    const response = await apiClient.post('/api/recruiters', data);
    return response.data;
  },

  updateRecruiter: async (id: string, data: Partial<Recruiter>) => {
    const response = await apiClient.patch(`/api/recruiters/${id}`, data);
    return response.data;
  },

  deleteRecruiter: async (id: string) => {
    const response = await apiClient.delete(`/api/recruiters/${id}`);
    return response.data;
  },

  bulkImportRecruiters: async (recruiters: Partial<Recruiter>[]) => {
    const response = await apiClient.post('/api/recruiters/bulk-import', { recruiters });
    return response.data;
  },
};

// ============ OUTREACH SERVICE ============
export const outreachService = {
  sendEmail: async (data: { recruiter_id: string; template_id?: string; content?: string }) => {
    const response = await apiClient.post('/api/outreach/email', data);
    return response.data;
  },

  sendWhatsApp: async (data: { recruiter_id: string; content: string }) => {
    const response = await apiClient.post('/api/outreach/whatsapp', data);
    return response.data;
  },

  getHistory: async (recruiterId: string) => {
    const response = await apiClient.get(`/api/outreach/history/${recruiterId}`);
    return response.data;
  },

  getTemplates: async () => {
    const response = await apiClient.get('/api/templates');
    return response.data;
  },

  createTemplate: async (data: Partial<EmailTemplate>) => {
    const response = await apiClient.post('/api/templates', data);
    return response.data;
  },
};

// ============ DEAL SERVICE ============
export const dealService = {
  getAllDeals: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/deals', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getDealById: async (id: string) => {
    const response = await apiClient.get(`/api/deals/${id}`);
    return response.data;
  },

  createDeal: async (data: Partial<Deal>) => {
    const response = await apiClient.post('/api/deals', data);
    return response.data;
  },

  updateDeal: async (id: string, data: Partial<Deal>) => {
    const response = await apiClient.patch(`/api/deals/${id}`, data);
    return response.data;
  },

  closeDeal: async (id: string) => {
    const response = await apiClient.post(`/api/deals/${id}/close`);
    return response.data;
  },

  deleteDeal: async (id: string) => {
    const response = await apiClient.delete(`/api/deals/${id}`);
    return response.data;
  },
};

// ============ PAYMENT SERVICE ============
export const paymentService = {
  getAllPayments: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/payments', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getPaymentById: async (id: string) => {
    const response = await apiClient.get(`/api/payments/${id}`);
    return response.data;
  },

  createPayment: async (data: Partial<Payment>) => {
    const response = await apiClient.post('/api/payments', data);
    return response.data;
  },

  recordPayment: async (id: string, data: any) => {
    const response = await apiClient.post(`/api/payments/${id}/record`, data);
    return response.data;
  },

  deletePayment: async (id: string) => {
    const response = await apiClient.delete(`/api/payments/${id}`);
    return response.data;
  },
};
