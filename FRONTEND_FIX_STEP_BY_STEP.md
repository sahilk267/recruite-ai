# 🛠️ FRONTEND FIX PLAN - STEP BY STEP WITH CODE

**Status:** Ready to implement  
**Time Estimate:** 15 days full-time  
**Difficulty:** Medium  
**Start:** Immediately after backend Phase 1 done

---

## 🎯 PHASE 1: CRITICAL FIXES (Days 1-5)

### STEP 1: Install Missing Dependencies

```bash
cd /workspaces/recruite-ai

# Install required packages
npm install axios react-router-dom zustand
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install jwt-decode
npm install @hookform/resolvers  # Already have react-hook-form

# For better types
npm install --save-dev @types/node
```

**Verification:**
```bash
npm list axios react-router-dom zustand
```

---

### STEP 2: Create API Service Wrapper

**File:** `src/services/api.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

const clearToken = () => {
  localStorage.removeItem('token');
};

// Add token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data),
    logout: () => {
      clearToken();
      return Promise.resolve();
    },
  },

  // Jobs
  jobs: {
    getAll: (params?: any) => api.get('/jobs', { params }),
    getById: (id: string) => api.get(`/jobs/${id}`),
    create: (data: any) => api.post('/jobs', data),
    update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
    delete: (id: string) => api.delete(`/jobs/${id}`),
  },

  // Leads
  leads: {
    getAll: (params?: any) => api.get('/leads', { params }),
    getById: (id: string) => api.get(`/leads/${id}`),
    create: (data: any) => api.post('/leads', data),
    update: (id: string, data: any) => api.put(`/leads/${id}`, data),
    delete: (id: string) => api.delete(`/leads/${id}`),
  },

  // Recruiters
  recruiters: {
    getAll: (params?: any) => api.get('/recruiters', { params }),
    getById: (id: string) => api.get(`/recruiters/${id}`),
    create: (data: any) => api.post('/recruiters', data),
    update: (id: string, data: any) => api.put(`/recruiters/${id}`, data),
    delete: (id: string) => api.delete(`/recruiters/${id}`),
  },

  // Deals
  deals: {
    getAll: (params?: any) => api.get('/deals', { params }),
    getById: (id: string) => api.get(`/deals/${id}`),
    create: (data: any) => api.post('/deals', data),
    update: (id: string, data: any) => api.put(`/deals/${id}`, data),
    delete: (id: string) => api.delete(`/deals/${id}`),
  },

  // Payments
  payments: {
    getAll: (params?: any) => api.get('/payments', { params }),
    getById: (id: string) => api.get(`/payments/${id}`),
    create: (data: any) => api.post('/payments', data),
    update: (id: string, data: any) => api.put(`/payments/${id}`, data),
    delete: (id: string) => api.delete(`/payments/${id}`),
  },

  // AI
  ai: {
    rewriteJob: (data: any) => api.post('/ai/rewrite-job', data),
    extractSkills: (data: any) => api.post('/ai/extract-skills', data),
    estimateSalary: (data: any) => api.post('/ai/estimate-salary', data),
    scoreLead: (data: any) => api.post('/ai/score-lead', data),
  },
};

// Helper to get decoded token
export const getDecodedToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

export { setToken, getToken, clearToken };
```

---

### STEP 3: Create Auth Context

**File:** `src/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, setToken, getToken, getDecodedToken } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = getDecodedToken();
      if (decoded) {
        setUser(decoded as User);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.auth.login({ email, password });
      const { token, user: userData } = response.data;

      setToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const response = await apiService.auth.register({ email, password, name });
      const { token, user: userData } = response.data;

      setToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### STEP 4: Create Protected Route

**File:** `src/components/ProtectedRoute.tsx`

```typescript
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

### STEP 5: Create Login Page

**File:** `src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-white/10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Recruite AI</CardTitle>
          <p className="text-sm text-zinc-400">Sign in to your account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-black/50 border-white/10"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 border-white/10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-zinc-400">
              Demo: use any email/password for testing
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### STEP 6: Update App.tsx to Use Routing

**File:** `src/App.tsx` (REPLACE ENTIRE FILE)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';

// Sections (lazy load these later)
import { DashboardOverview } from '@/sections/DashboardOverview';
import { TrafficEngine } from '@/sections/TrafficEngine';
import { JobIntelligence } from '@/sections/JobIntelligence';
import { AIProcessing } from '@/sections/AIProcessing';
import { LeadCapture } from '@/sections/LeadCapture';
import { LeadScoring } from '@/sections/LeadScoring';
import { RecruiterAcquisition } from '@/sections/RecruiterAcquisition';
import { FollowUpEngine } from '@/sections/FollowUpEngine';
import { DealAutomation } from '@/sections/DealAutomation';
import { LeadDistribution } from '@/sections/LeadDistribution';
import { PaymentSystem } from '@/sections/PaymentSystem';
import { CRMDashboard } from '@/sections/CRMDashboard';
import { AutomationFlow } from '@/sections/AutomationFlow';
import { RiskControl } from '@/sections/RiskControl';
import { PhaseExecution } from '@/sections/PhaseExecution';
import { RevenueEngine } from '@/sections/RevenueEngine';
import { AutomationTable } from '@/sections/AutomationTable';

// Main Layout
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useState } from 'react';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardOverview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/traffic"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TrafficEngine />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobIntelligence />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIProcessing />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads-capture"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadCapture />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads-scoring"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadScoring />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiters"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RecruiterAcquisition />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/followup"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FollowUpEngine />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deals"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DealAutomation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/distribution"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadDistribution />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentSystem />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CRMDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/automation-flow"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AutomationFlow />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RiskControl />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/phases"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PhaseExecution />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RevenueEngine />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/automation-levels"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AutomationTable />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

### STEP 7: Update Main.tsx

**File:** `src/main.tsx` (No changes usually needed, but verify)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### STEP 8: Update Vite Config

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001'),
  },
})
```

---

### STEP 9: Create .env File

**File:** `.env`

```
VITE_API_URL=http://localhost:3001
```

---

## ✅ TESTING

After making these changes:

```bash
# Install deps
npm install

# Start dev server
npm run dev

# In browser:
# 1. Go to http://localhost:5173/login
# 2. Try to login (will fail - backend not ready)
# 3. Check console for API errors - should see 404 or 422

# This is GOOD - it means the frontend is trying to call the API!
```

---

## 📋 PROGRESS CHECKLIST

- [ ] npm install new packages
- [ ] Create src/services/api.ts
- [ ] Create src/context/AuthContext.tsx
- [ ] Create src/components/ProtectedRoute.tsx
- [ ] Create src/pages/LoginPage.tsx
- [ ] Update src/App.tsx
- [ ] Update vite.config.ts
- [ ] Create .env file
- [ ] Run npm run dev
- [ ] Verify no compile errors
- [ ] Test at http://localhost:5173/login

---

## 🎯 RESULT

After this phase:
- ✅ Frontend connects to backend
- ✅ Login page works
- ✅ Protected routes work
- ✅ Token management works
- ✅ Axios interceptor adds auth header
- ✅ Proper routing with URLs

---

## ⏭️ NEXT PHASE

After Phase 1 complete, start Phase 2:
- Form validation
- Error handling
- Data fetching from APIs
- Global state

