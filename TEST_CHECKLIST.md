# Quick Testing Checklist

## 🧪 Automated Test Suite

Run this to verify all API integration:
```bash
cd /workspaces/recruite-ai
npx tsx test-frontend-integration.ts
```

**Last Run Result:** ✅ **17/17 Tests Passed** ✅

---

## 📋 Component Testing Checklist

### 1. CRM Dashboard
- [ ] Navigate to CRM Dashboard
- [ ] View shows real statistics from database
- [ ] Jobs count: ___
- [ ] Leads count: ___
- [ ] Recruiters count: ___
- [ ] Deals count: ___
- [ ] Revenue chart displays
- [ ] Conversion funnel shows data
- [ ] Refresh button works
- [ ] Click Analytics tab - works fine
- [ ] Click Activity tab - works fine
- [ ] Click API Keys tab - works fine

### 2. Lead Scoring
- [ ] Navigate to Lead Scoring
- [ ] Leads list loads (count: ___)
- [ ] Select a lead - details show
- [ ] Click "Score Lead" button
- [ ] Loading spinner appears
- [ ] Score updates after 1-2 seconds
- [ ] Quality badge updates (High/Medium/Low)
- [ ] Priority badge updates
- [ ] Toast notification shows success
- [ ] Refresh leads - latest data loads
- [ ] Multiple leads can be scored

### 3. Deal Automation
- [ ] Navigate to Deal Automation
- [ ] Deals list shows count: ___
- [ ] Total value displays
- [ ] Active deals shows correct count
- [ ] Closed deals shows correct count
- [ ] Select a deal with status "active"
- [ ] Click "Close Deal" button
- [ ] Loading spinner appears
- [ ] Deal stage changes to 5
- [ ] Status badge shows "Closed"
- [ ] Toast notification shows success
- [ ] Deal pipeline stages visible
- [ ] AI Capabilities toggles work

### 4. Payment System
- [ ] Navigate to Payment System
- [ ] Payments list loads (count: ___)
- [ ] Total revenue shows ₹ amount
- [ ] Pending amount shows correctly
- [ ] Paid amount shows correctly
- [ ] Overdue amount shows correctly
- [ ] Find payment with "pending" status
- [ ] Click "Record Payment" button
- [ ] Loading spinner appears
- [ ] Payment status changes to "paid"
- [ ] Toast notification shows success
- [ ] Revenue chart displays
- [ ] Payment options toggles work

### 5. Job Intelligence
- [ ] Navigate to Job Intelligence
- [ ] Jobs list loads (count: ___)
- [ ] Job titles display correctly
- [ ] Job companies display correctly
- [ ] Job locations display correctly
- [ ] Job status badges show correct colors
- [ ] Click "Sources" tab
- [ ] Source metrics show (LinkedIn, Indeed, etc.)
- [ ] Click "Start Scraping" button
- [ ] Loading state shows "Scraping..."
- [ ] Completes after 2-3 seconds
- [ ] Success notification appears

---

## 🔐 Authentication Testing

- [ ] Can register new account
- [ ] Can login with registered account
- [ ] Can logout (redirects to login)
- [ ] Cannot access protected pages without login
- [ ] Login persists after page refresh (session works)
- [ ] Token appears in Authorization header (check DevTools)
- [ ] Token format: `Bearer eyJhb...` (JWT format)

---

## 🔄 API Integration Testing

For each component, verify in DevTools Network tab:

### CRM Dashboard
- [ ] GET `/api/jobs?page=1&pageSize=1` returns data
- [ ] GET `/api/leads?page=1&pageSize=1` returns data
- [ ] GET `/api/recruiters?page=1&pageSize=1` returns data
- [ ] GET `/api/deals?page=1&pageSize=1` returns data
- [ ] GET `/api/payments?page=1&pageSize=1` returns data

### Lead Scoring
- [ ] GET `/api/leads?page=1&pageSize=10` returns list
- [ ] POST `/api/leads/{id}/score` returns score object
- [ ] Score field updates to numeric value (0-100)
- [ ] Quality field updates to response value

### Deal Automation
- [ ] GET `/api/deals?page=1&pageSize=20` returns list
- [ ] POST `/api/deals/{id}/close` returns updated deal
- [ ] Stage field updates to 5
- [ ] Status field updates to "closed"

### Payment System
- [ ] GET `/api/payments?page=1&pageSize=20` returns list
- [ ] POST `/api/payments/{id}/record` returns updated payment
- [ ] Status field updates to "paid"
- [ ] paidDate field updates to today's date

### Job Intelligence
- [ ] GET `/api/jobs?page=1&pageSize=20` returns list
- [ ] Jobs display title, company, location, status

---

## 🌐 Browser Compatibility

Test on different browsers:

- [ ] Chrome/Edge - Works (Windows/Mac/Linux)
- [ ] Firefox - Works (Windows/Mac/Linux)
- [ ] Safari - Works (Mac/iOS)
- [ ] Mobile Safari - Works (iPhone/iPad)
- [ ] Chrome Mobile - Works (Android)

---

## 📱 Responsive Design

Test on different screen sizes:

- [ ] Desktop (1920px) - All layouts work
- [ ] Laptop (1366px) - Tables responsive
- [ ] Tablet (768px) - Sidebar shows mobile menu
- [ ] Mobile (375px) - All content accessible without horizontal scroll
- [ ] Tables scroll horizontally on mobile
- [ ] Forms stack vertically on mobile
- [ ] Charts are sized responsively

---

## ⚡ Performance Checklist

- [ ] Components load in < 2 seconds
- [ ] API requests return in < 500ms
- [ ] No console errors or warnings
- [ ] No memory leaks (DevTools Memory tab)
- [ ] Smooth animations (60fps)
- [ ] No UI jank when navigating between sections
- [ ] Rapid clicks don't cause issues
- [ ] Page refresh doesn't cause console errors

---

## 🎨 UI/UX Checklist

- [ ] All buttons have hover effects
- [ ] Loading spinners show during data fetch
- [ ] Error messages are clear and visible
- [ ] Success messages show as toast notifications
- [ ] Colors are consistent with design
- [ ] Typography is readable
- [ ] Icons are properly aligned
- [ ] Badges have correct colors
- [ ] Tables are sortable (if applicable)
- [ ] Empty states show helpful messages

---

## 📊 Data Accuracy Checklist

- [ ] Jobs count matches actual jobs in database
- [ ] Leads count matches actual leads in database
- [ ] Recruiters count matches actual recruiters
- [ ] Deals count matches actual deals
- [ ] Payments count matches actual payments
- [ ] Revenue sum is correct (all payments added)
- [ ] Conversion rate calculation is accurate
- [ ] Lead scores are calculated correctly
- [ ] Deal stages are correct
- [ ] Payment statuses are accurate

---

## 🔒 Security Checklist

- [ ] JWT token is sent in Authorization header
- [ ] Plaintext passwords never appear in network requests
- [ ] API calls require valid token (test with invalid token)
- [ ] Cannot access other users' data
- [ ] Session expires after token expiry
- [ ] No sensitive data in localStorage besides token
- [ ] CORS headers are correct
- [ ] No XSS vulnerabilities (test script injection)
- [ ] No SQL injection in API (tested via test suite)

---

## 📝 Test Sign-off

| Component | Status | Date | Tester |
|-----------|--------|------|--------|
| Automated Tests | ✅ Pass | 3/21/2026 | Copilot |
| CRM Dashboard | ⬜ | - | - |
| Lead Scoring | ⬜ | - | - |
| Deal Automation | ⬜ | - | - |
| Payment System | ⬜ | - | - |
| Job Intelligence | ⬜ | - | - |
| Authentication | ⬜ | - | - |
| Responsive Design | ⬜ | - | - |
| Performance | ⬜ | - | - |
| Security | ⬜ | - | - |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Warning | ⬜ Not Tested

---

## 📞 Issue Tracking

If you find any issues during testing, document them:

| Issue | Component | Steps to Reproduce | Expected | Actual | Status |
|-------|-----------|-------------------|----------|--------|--------|
| | | | | | |
| | | | | | |
| | | | | | |

---

**Testing Date:** ___________  
**Tested By:** ___________  
**Environment:** Development (localhost)  
**Browser:** ___________  
**OS:** ___________

**Overall Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ✅ How to Use This Checklist

1. **Print or screenshot** this checklist
2. **Work through each section** systematically
3. **Check off items** as you test them
4. **Document any issues** in the tracking table
5. **Sign off** when all tests complete
6. **Attach to test result report**

For detailed instructions, see [TESTING_GUIDE.md](TESTING_GUIDE.md)
