#!/usr/bin/env node

/**
 * RECRUITE AI - Frontend Integration Test Suite
 * Tests all API endpoints from the updated frontend components
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  header: (title) => console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.bold}${colors.yellow}🧪 ${msg}${colors.reset}`),
  section: (title) => console.log(`\n${colors.bold}${colors.blue}📋 ${title}${colors.reset}`),
};

// Store auth token and user data
let authToken = '';
let testUserId = '';

class APITester {
  async testHealthCheck() {
    log.section('1. Health Check');
    try {
      const response = await axios.get(`${API_BASE}/health`);
      log.success(`Server healthy: ${response.data.status}`);
      return true;
    } catch (error) {
      log.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  async testRootEndpoint() {
    log.section('2. Root Endpoint');
    try {
      const response = await axios.get(`${API_BASE}/`);
      log.success(`Root endpoint working`);
      log.info(`API Version: ${response.data.version}`);
      log.info(`Available endpoints: ${response.data.availableRoutes.length}`);
      return true;
    } catch (error) {
      log.error(`Root endpoint failed: ${error.message}`);
      return false;
    }
  }

  async testUserRegistration() {
    log.section('3. User Registration');
    try {
      const userData = {
        email: `testuser_${Date.now()}@example.com`,
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await axios.post(`${API_BASE}/api/auth/register`, userData);
      testUserId = response.data.data.user.id;
      log.success(`User registered: ${userData.email}`);
      log.info(`User ID: ${testUserId}`);
      return userData.email;
    } catch (error) {
      log.error(`Registration failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testUserLogin(email) {
    log.section('4. User Login');
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password: 'Test123!@#',
      });

      authToken = response.data.data.token;
      log.success(`Login successful`);
      log.info(`Token received: ${authToken.substring(0, 20)}...`);
      return true;
    } catch (error) {
      log.error(`Login failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testGetCurrentUser() {
    log.section('5. Get Current User');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Current user fetched: ${response.data.data.email}`);
      log.info(`User name: ${response.data.data.name}`);
      return true;
    } catch (error) {
      log.error(`Get current user failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testCreateJob() {
    log.section('6. Create Job');
    try {
      const jobData = {
        title: 'Senior React Developer',
        company: 'Tech Corp',
        description: 'Looking for experienced React developer',
        location: 'Bangalore',
      };

      const response = await axios.post(`${API_BASE}/api/jobs`, jobData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Job created: ${jobData.title}`);
      log.info(`Job ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error) {
      log.error(`Create job failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testGetAllJobs() {
    log.section('7. Get All Jobs');
    try {
      const response = await axios.get(`${API_BASE}/api/jobs?page=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Jobs fetched: ${response.data.data.length} found`);
      log.info(`Total jobs: ${response.data.data.length}`);
      return response.data.data;
    } catch (error) {
      log.error(`Get all jobs failed: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async testCreateRecruiter() {
    log.section('8. Create Recruiter');
    try {
      const recruiterData = {
        name: 'Rajesh Kumar',
        email: `recruiter_${Date.now()}@tcs.com`,
        phone: '9876543210',
        company: 'TCS',
        contactPreferences: ['email'],
      };

      const response = await axios.post(`${API_BASE}/api/recruiters`, recruiterData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Recruiter created: ${recruiterData.name}`);
      log.info(`Recruiter ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error) {
      log.error(`Create recruiter failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testCreateLead() {
    log.section('9. Create Lead');
    try {
      const leadData = {
        name: 'Rahul Sharma',
        email: `lead_${Date.now()}@example.com`,
        phone: '9876543210',
        experience: 5,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        location: 'Bangalore',
      };

      const response = await axios.post(`${API_BASE}/api/leads`, leadData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Lead created: ${leadData.name}`);
      log.info(`Lead ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error) {
      log.error(`Create lead failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testScoreLead(leadId) {
    log.section('10. Score Lead');
    try {
      const response = await axios.post(`${API_BASE}/api/leads/${leadId}/score`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Lead scored: ${response.data.data.score}/100`);
      log.info(`Quality: ${response.data.data.quality}`);
      return response.data.data.score;
    } catch (error) {
      log.error(`Score lead failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testGetAllLeads() {
    log.section('11. Get All Leads');
    try {
      const response = await axios.get(`${API_BASE}/api/leads?page=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Leads fetched: ${response.data.data.length} found`);
      log.info(`Total leads: ${response.data.data.length}`);
      return response.data.data;
    } catch (error) {
      log.error(`Get all leads failed: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async testCreateDeal(jobId, recruiterId, leadId) {
    log.section('12. Create Deal');
    try {
      const dealData = {
        jobId,
        recruiterId,
        leadId,
        value: 45000,
      };

      const response = await axios.post(`${API_BASE}/api/deals`, dealData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Deal created: ₹${dealData.value}`);
      log.info(`Deal ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error) {
      log.error(`Create deal failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testCloseDeal(dealId) {
    log.section('13. Close Deal');
    try {
      const response = await axios.post(`${API_BASE}/api/deals/${dealId}/close`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Deal closed: Stage ${response.data.data.stage}`);
      return true;
    } catch (error) {
      log.error(`Close deal failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testCreatePayment(dealId, recruiterId) {
    log.section('14. Create Payment');
    try {
      const paymentData = {
        dealId,
        recruiterId,
        amount: 45000,
        type: 'pay_per_lead',
      };

      const response = await axios.post(`${API_BASE}/api/payments`, paymentData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Payment created: ₹${paymentData.amount}`);
      log.info(`Payment ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error) {
      log.error(`Create payment failed: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async testRecordPayment(paymentId) {
    log.section('15. Record Payment');
    try {
      const response = await axios.post(`${API_BASE}/api/payments/${paymentId}/record`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Payment recorded: Status ${response.data.data.status}`);
      return true;
    } catch (error) {
      log.error(`Record payment failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testGetAllDeals() {
    log.section('16. Get All Deals');
    try {
      const response = await axios.get(`${API_BASE}/api/deals?page=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Deals fetched: ${response.data.data.length} found`);
      log.info(`Total deals: ${response.data.data.length}`);
      return response.data.data;
    } catch (error) {
      log.error(`Get all deals failed: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async testGetAllPayments() {
    log.section('17. Get All Payments');
    try {
      const response = await axios.get(`${API_BASE}/api/payments?page=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      log.success(`Payments fetched: ${response.data.data.length} found`);
      log.info(`Total payments: ${response.data.data.length}`);
      return response.data.data;
    } catch (error) {
      log.error(`Get all payments failed: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async run() {
    console.log(`${colors.bold}${colors.cyan}`);
    console.log(`
╔════════════════════════════════════════════════════════════╗
║    RECRUITE AI - Frontend Integration Test Suite         ║
║    Testing: Backend API + Frontend Components            ║
╚════════════════════════════════════════════════════════════╝
    `);
    console.log(colors.reset);

    const results = [];

    // Test backend connectivity
    results.push({ name: 'Health Check', passed: await this.testHealthCheck() });
    results.push({ name: 'Root Endpoint', passed: await this.testRootEndpoint() });

    // Test auth flow
    const email = await this.testUserRegistration();
    if (!email) {
      log.error('Cannot continue without registration');
      return;
    }
    results.push({ name: 'User Registration', passed: !!email });

    results.push({ name: 'User Login', passed: await this.testUserLogin(email) });
    results.push({ name: 'Get Current User', passed: await this.testGetCurrentUser() });

    // Test CRUD operations
    const jobId = await this.testCreateJob();
    results.push({ name: 'Create Job', passed: !!jobId });

    const jobs = await this.testGetAllJobs();
    results.push({ name: 'Get All Jobs', passed: jobs.length > 0 });

    const recruiterId = await this.testCreateRecruiter();
    results.push({ name: 'Create Recruiter', passed: !!recruiterId });

    const leadId = await this.testCreateLead();
    results.push({ name: 'Create Lead', passed: !!leadId });

    // Test lead scoring
    if (leadId) {
      const score = await this.testScoreLead(leadId);
      results.push({ name: 'Score Lead', passed: score !== null });
    }

    const leads = await this.testGetAllLeads();
    results.push({ name: 'Get All Leads', passed: leads.length > 0 });

    // Test deal flow
    if (jobId && recruiterId && leadId) {
      const dealId = await this.testCreateDeal(jobId, recruiterId, leadId);
      results.push({ name: 'Create Deal', passed: !!dealId });

      if (dealId) {
        results.push({ name: 'Close Deal', passed: await this.testCloseDeal(dealId) });

        const paymentId = await this.testCreatePayment(dealId, recruiterId);
        results.push({ name: 'Create Payment', passed: !!paymentId });

        if (paymentId) {
          results.push({ name: 'Record Payment', passed: await this.testRecordPayment(paymentId) });
        }
      }
    }

    const deals = await this.testGetAllDeals();
    results.push({ name: 'Get All Deals', passed: deals.length > 0 });

    const payments = await this.testGetAllPayments();
    results.push({ name: 'Get All Payments', passed: payments.length > 0 });

    // Print summary
    this.printSummary(results);
  }

  printSummary(results) {
    log.section('Test Summary');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
      if (result.passed) {
        log.success(result.name);
      } else {
        log.error(result.name);
      }
    });

    console.log(`\n${colors.bold}`);
    if (passed === total) {
      console.log(`${colors.green}🎉 All ${total} tests passed!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  ${passed}/${total} tests passed${colors.reset}`);
    }
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  }
}

// Run tests
const tester = new APITester();
tester.run().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});
