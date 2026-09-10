# LIVYA release QA

- [ ] `npm install`
- [ ] client typecheck
- [ ] admin typecheck
- [ ] mobile typecheck
- [ ] API pytest
- [ ] Supabase migrations applied and migration list verified
- [ ] RLS enabled on every patient/health table
- [ ] Patient A cannot read Patient B
- [ ] Non-staff cannot access admin routes
- [ ] Inactive staff cannot access admin routes
- [ ] Admin role can access staff operations
- [ ] Browser auth cookies persist across refresh
- [ ] Logout clears session and client-side cached health data
- [ ] No service-role or payment secrets appear in browser bundles
- [ ] CORS only permits production web origins
- [ ] HTTPS enforcement verified through the production proxy
- [ ] AI raw input is not logged or persisted
- [ ] AI worker is private and authenticated
- [ ] AI timeout/error behavior returns sanitized errors
- [ ] Razorpay and RevenueCat webhook signatures verified
- [ ] Health records storage bucket policies verified
- [ ] Backup/restore procedure tested
- [ ] Client web tested at desktop/tablet/mobile widths
- [ ] Admin tested on supported desktop browsers
- [ ] Production smoke test after each Vercel deployment

The remote Supabase checks and actual browser/device E2E must be executed with access to the production environment. They cannot be honestly marked passed from static repository inspection.
