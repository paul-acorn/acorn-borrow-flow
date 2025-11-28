# Pre-Launch Checklist for Acorn Finance CRM

## 🔴 CRITICAL - Must Fix Before Launch

### 1. **Invitation Code Security Vulnerability**
- **Issue**: Team invitation codes are publicly readable through RLS policy "Anyone can view unused invitations for validation"
- **Risk**: Attackers can monitor the table and steal valid invitation codes (BROKER01, BROKER02, CLIENT01, etc.) to gain unauthorized access as brokers or clients
- **Fix Required**: 
  - Remove public SELECT policy from `team_invitations` table
  - Create a secure edge function for invitation code validation during signup
  - Only validate invitation codes server-side, never expose them client-side
- **Status**: ❌ NOT FIXED

---

## 🟡 HIGH PRIORITY - Recommended Before Launch

### 2. **Enhanced User Profile Protection**
- **Issue**: No explicit deny policy for unauthenticated users on `profiles` table
- **Risk**: If RLS is bypassed or misconfigured, email addresses, phone numbers, and names could be exposed
- **Fix Required**: Add explicit policy denying anonymous access
- **Status**: ❌ NOT FIXED

### 3. **Two-Factor Authentication Secret Protection**
- **Issue**: TOTP secrets and SMS phone numbers stored in plain text in `two_factor_auth` table
- **Risk**: If policies are bypassed, attackers could steal secrets to bypass 2FA
- **Fix Required**: 
  - Encrypt `totp_secret` field at application level before storage
  - Ensure `sms_phone_number` is never exposed in logs or error messages
- **Status**: ❌ NOT FIXED

### 4. **Customer Contact Information Protection**
- **Issue**: `communication_logs` table stores phone numbers and email addresses in plain text
- **Risk**: Database of customer contact info could be stolen for spam/phishing/social engineering
- **Fix Required**: 
  - Store only hashed references to contact information OR
  - Implement field-level encryption for `phone_number` and `email_address` columns
- **Status**: ❌ NOT FIXED

### 5. **National Insurance Number Encryption**
- **Issue**: `client_personal_details` table stores NI numbers in plain text
- **Risk**: Highly sensitive identifiers used for identity theft
- **Fix Required**: Encrypt `ni_number` field at application level before storage
- **Status**: ❌ NOT FIXED

### 6. **Credit History Data Encryption**
- **Issue**: `client_credit_history` table contains extremely sensitive financial information (credit scores, bankruptcy, CCJs, IVAs)
- **Risk**: Could be used for financial fraud, discrimination, or blackmail if exposed
- **Fix Required**: 
  - Implement encryption for most sensitive fields
  - Add audit logging to track all access to this table
- **Status**: ❌ NOT FIXED

---

## 🟢 MEDIUM PRIORITY - Post-Launch Acceptable

### 7. **Document Storage Path Obfuscation**
- **Issue**: `client_documents` table stores file paths that reveal storage structure
- **Risk**: Attackers could guess other file paths to access unauthorized documents
- **Fix Required**: 
  - Store only opaque file identifiers in database
  - Resolve actual paths server-side
  - Ensure storage bucket has independent access controls
- **Status**: ❌ NOT FIXED

### 8. **Leaked Password Protection**
- **Issue**: Supabase leaked password protection is currently disabled
- **Risk**: Users can set passwords that have been compromised in data breaches
- **Fix Required**: Upgrade to Supabase Pro subscription and enable leaked password protection
- **Status**: ❌ NOT FIXED (User Acknowledged - Will resolve with Pro upgrade)

---

## ✅ Functional Completeness Checklist

### Client Portal
- [x] Personal details editing
- [x] ALIE (Assets, Liabilities, Income, Expenses) forms
- [x] Credit history editing
- [x] Document upload functionality
- [x] Deal progress tracking
- [x] Multi-deal carousel/navigation
- [x] Requirements management
- [x] Messaging with broker

### Broker Dashboard
- [x] Client management (registered + pending)
- [x] Deal creation for clients
- [x] Client invitation (email + SMS/WhatsApp)
- [x] Sales pipeline (Kanban board)
- [x] Analytics dashboard
- [x] Workflow automation
- [x] Document review
- [x] Call management
- [x] Callback scheduling
- [x] Unified inbox
- [x] Campaign sequences

### Admin/Super Admin Dashboard
- [x] User & role management
- [x] All deals view
- [x] System settings
- [x] Analytics (all brokers)
- [x] Workflow automation
- [x] Document review (all clients)

### Authentication & Security
- [x] Email/password authentication
- [x] Two-factor authentication (TOTP + SMS)
- [x] Biometric login
- [x] Role-based access control (Client, Broker, Admin, Super Admin)
- [ ] Invitation code security (CRITICAL FIX NEEDED)
- [ ] Sensitive data encryption (HIGH PRIORITY)

### Integrations
- [x] Google Drive (document storage)
- [x] Gmail (email sending)
- [x] Resend (transactional emails)
- [x] Twilio (SMS/WhatsApp)
- [x] Lovable AI (document verification)
- [ ] HubSpot integration (if required)

### Mobile Responsiveness
- [x] Client dashboard mobile layout
- [x] Broker dashboard mobile layout
- [x] Admin dashboard mobile layout
- [x] Form navigation on mobile (keyboard arrows)
- [x] Modal autofocus
- [x] Form submission with Enter key

---

## 🧪 Testing Requirements

### Security Testing
- [ ] Test RLS policies for all tables with different user roles
- [ ] Verify no data leakage between clients
- [ ] Verify brokers can only see their assigned clients
- [ ] Test authentication flows (login, signup, 2FA, biometric)
- [ ] Test invitation code validation process
- [ ] Test document access permissions

### Functional Testing
- [ ] Test all forms (validation, submission, error handling)
- [ ] Test deal creation and status changes
- [ ] Test workflow automation triggers
- [ ] Test email and SMS notifications
- [ ] Test document upload and retrieval
- [ ] Test call scheduling and reminders
- [ ] Test messaging system
- [ ] Test analytics data accuracy
- [ ] Test Google Drive integration
- [ ] Test AI document verification

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance Testing
- [ ] Test with large datasets (100+ deals, 50+ clients)
- [ ] Check page load times
- [ ] Verify query performance
- [ ] Check real-time update performance

---

## 📋 Pre-Launch Configuration

### Supabase Configuration
- [ ] Upgrade to Pro subscription (for leaked password protection)
- [ ] Enable leaked password protection in Auth settings
- [ ] Review and update all RLS policies (especially team_invitations)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review edge function configurations
- [ ] Audit all secrets and API keys

### Email Configuration
- [ ] Set up custom domain for emails (acorn.finance)
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Test all email templates
- [ ] Set up email bounce handling
- [ ] Configure unsubscribe mechanism

### Google Workspace Configuration
- [ ] Verify OAuth credentials are production-ready
- [ ] Confirm all necessary scopes are approved
- [ ] Test Google Drive folder creation
- [ ] Test Gmail integration
- [ ] Set up service account if needed

### Twilio Configuration
- [ ] Verify phone numbers are production-ready
- [ ] Test SMS delivery
- [ ] Test WhatsApp delivery
- [ ] Configure message delivery webhooks
- [ ] Set up usage alerts

---

## 🚀 Launch Day Checklist

### Final Checks
- [ ] Run full security scan
- [ ] Run database linter
- [ ] Check all console errors are resolved
- [ ] Verify all network requests succeed
- [ ] Test critical user flows end-to-end
- [ ] Review and clear test data
- [ ] Set up monitoring and alerting
- [ ] Prepare rollback plan

### Documentation
- [ ] User guides for clients
- [ ] User guides for brokers
- [ ] Admin documentation
- [ ] API documentation (if applicable)
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Post-Launch Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Create dashboard for key metrics
- [ ] Establish on-call rotation
- [ ] Prepare incident response plan

---

## 📞 Support Contacts

- **Supabase Support**: [Supabase Dashboard](https://supabase.com/dashboard)
- **Lovable Support**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Twilio Support**: [Twilio Console](https://www.twilio.com/console)

---

**Last Updated**: 2025-11-28  
**Review Before Launch**: Ensure all ❌ items in CRITICAL and HIGH PRIORITY sections are marked ✅
