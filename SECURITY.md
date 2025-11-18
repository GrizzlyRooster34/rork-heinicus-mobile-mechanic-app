# Security Policy

## HEI-128: Credential Rotation Completed

### Date: 2025-11-18

### Summary
All compromised credentials have been removed from the codebase and replaced with placeholder development credentials.

### What Was Changed

**Old Compromised Credentials:**
- Email: `matthew.heinen.2014@gmail.com`
- Email: `cody@heinicus.com`
- Password: `RoosTer669072!@` ⚠️ **COMPROMISED - DO NOT USE**

**New Development Credentials:**
- Admin: `admin@dev.local` / `DevAdminPass123!@`
- Mechanic: `mechanic@dev.local` / `DevMechanicPass123!@`
- Customer: `customer@dev.local` / `DevCustomerPass123!@`

### Files Updated
1. `utils/dev.ts` - DEV_CREDENTIALS object
2. `components/AdminDualLoginToggle.tsx` - Quick login handlers
3. `backend/trpc/routes/auth/route.ts` - Authentication logic
4. `stores/auth-store.ts` - Production users constant
5. `backend/trpc/routes/admin/route.ts` - Mock user data
6. `app/auth/index.tsx` - Quick access buttons

### Required Manual Actions

#### 1. Password Manager Updates
- [ ] Update password manager entries for `matthew.heinen.2014@gmail.com`
- [ ] Update password manager entries for `cody@heinicus.com`
- [ ] Generate strong unique passwords (recommended: 16+ characters, mixed case, numbers, symbols)
- [ ] Document new passwords securely in password manager

#### 2. External Account Password Changes
For each service using the compromised password `RoosTer669072!@`:
- [ ] GitHub account
- [ ] Email accounts (Gmail, work email)
- [ ] Cloud services (AWS, Google Cloud, Azure, etc.)
- [ ] Firebase/Supabase/other backend services
- [ ] Domain registrars
- [ ] Payment processors
- [ ] Any other services

#### 3. Session Invalidation
- [ ] Log out all active sessions on affected accounts
- [ ] Revoke any API tokens or access tokens associated with these accounts
- [ ] Check for any OAuth applications that may have been granted access

#### 4. Security Monitoring
- [ ] Enable 2FA on all accounts if not already enabled
- [ ] Review recent login activity on all affected accounts
- [ ] Check for any suspicious activity or unauthorized access
- [ ] Review git commit history for any unauthorized commits

#### 5. Team Notification
- [ ] Notify all team members about the credential leak
- [ ] Ensure no team member is using the compromised password
- [ ] Update team security best practices documentation

### Credential Rotation Checklist

#### High Priority (Complete Immediately)
- [ ] **Email accounts** - matthew.heinen.2014@gmail.com
- [ ] **GitHub** - Check for any API tokens or SSH keys
- [ ] **Firebase/Backend Services** - Rotate service account credentials
- [ ] **Production hosting** - AWS/GCP/Azure credentials
- [ ] **Domain/DNS providers** - Check account access

#### Medium Priority (Complete within 24 hours)
- [ ] **Development tools** - npm, yarn registry credentials
- [ ] **CI/CD services** - GitHub Actions, CircleCI, etc.
- [ ] **Monitoring services** - Sentry, LogRocket, etc.
- [ ] **Analytics** - Google Analytics, Mixpanel, etc.

#### Low Priority (Complete within 1 week)
- [ ] **Testing services** - BrowserStack, etc.
- [ ] **Documentation platforms** - Notion, Confluence, etc.
- [ ] **Communication tools** - Slack, Discord, etc.

### Best Practices Going Forward

1. **Never commit credentials to source control**
   - Use environment variables for all secrets
   - Use `.env.local` files (gitignored) for local development
   - Use secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.) for production

2. **Use unique passwords for each service**
   - Never reuse passwords across services
   - Use a password manager to generate and store unique passwords

3. **Enable 2FA everywhere**
   - Enable two-factor authentication on all services
   - Prefer authenticator apps over SMS

4. **Regular security audits**
   - Scan codebase for secrets using git-secrets or gitleaks (see HEI-130)
   - Review access logs regularly
   - Rotate credentials periodically

5. **Development vs Production**
   - Use obviously fake credentials in development (e.g., `admin@dev.local`)
   - Never use production credentials in development environments
   - Keep development and production databases separate

### Prevention Tools

See `CONTRIBUTING.md` for information about git-secrets/gitleaks setup (HEI-130).

### Incident Response Contact

If you discover any security issues or suspect the credentials have been misused:
1. Immediately notify the security team
2. Document what you found
3. Do not share details publicly
4. Follow responsible disclosure practices

---

**Status**: ⚠️ **ACTION REQUIRED** - Manual password rotation must be completed by authorized personnel.

**Next Steps**: Complete HEI-130 (git-secrets) to prevent future credential leaks.
