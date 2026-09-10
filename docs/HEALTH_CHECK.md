# LIVYA Full-Stack Health Check

Principal QA / integration audit commands and expected results.

## 1. React Native / Expo

From the repository root:

```powershell
npm install
npm --workspace apps/mobile run typecheck
npx expo-doctor
npx expo config --type public
```

The public Expo configuration must contain a non-empty Supabase URL and public/publishable key. Never paste the key into tickets or logs.

The mobile Supabase client explicitly binds its session storage to AsyncStorage. The client accepts `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and falls back to `EXPO_PUBLIC_SUPABASE_ANON_KEY` during migration.

To run the UI diagnostic, temporarily render `<SupabaseHealthCheck />` on an internal diagnostics screen. It checks configuration, `supabase.auth.getSession()`, a `profiles` read, and logs request latency. An anonymous `profiles` read being denied by RLS is a **warning/pass condition**, not a defect, when the table is intentionally private.

For a physical device, `localhost` means the device itself. Set `EXPO_PUBLIC_API_BASE_URL` to the development machine's LAN address, for example `http://192.168.1.20:8000/api/v1`, and allow that address through the local firewall.

## 2. Supabase / Postgres

Install and authenticate the Supabase CLI, then link the intended project:

```powershell
supabase login
supabase link --project-ref tiywppbtsuwtxhoxjrgj
supabase db diff
supabase migration list
```

Do not run `supabase db push` as part of a diagnostic. Use the SQL Editor to execute:

```text
supabase/diagnostics/verify_schema_rls.sql
```

Expected:
- application tables have RLS enabled;
- expected `user_id` foreign keys reference `auth.users(id)`;
- `auth.users` has enabled trigger `on_auth_user_created`;
- that trigger calls `public.handle_new_user()`;
- final summary reports `PASS`, or `REVIEW` with the offending rows above it.

## 3. FastAPI

From `services/api`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m pytest -q tests/test_backend.py
python -m uvicorn app.main:app --reload --port 8000
```

Then verify the public health endpoint:

```powershell
curl.exe -i http://127.0.0.1:8000/health
```

Expected: HTTP 200 and `{"status":"ok","service":"livya-api"}`.

The backend JWT test exercises RS256/JWKS verification with a generated key. It does not use a production secret. A live environment check should additionally verify that `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` point to the same project and that the backend can reach `auth/v1/.well-known/jwks.json`.

## 4. Privacy sandbox checks

The AI endpoint is designed to return validated metrics rather than raw input. The backend test sends a unique sentinel string and asserts that it is not echoed in the HTTP response and that no files appear in the test sandbox.

This is not a proof of zero persistence at OS/container level. Production verification should additionally audit:
- application logs;
- reverse-proxy access/error logs;
- APM/request-body capture;
- crash reporting;
- temporary upload directories;
- swap/pagefile policy where PHI confidentiality requires it.

Do not log request bodies, bearer tokens, report contents, prompts, audio, or model payloads.

## 5. CORS and mobile networking

FastAPI currently allows the development web origins configured by `CORS_ORIGINS`. Native iOS/Android requests normally do not use browser CORS, so a native device failure is usually an API URL, firewall, TLS, DNS, or certificate issue rather than CORS.

For Expo Web, add the exact origin used by the browser. Avoid `*` when `allow_credentials=True`.

## 6. Release gate

- [ ] `npm --workspace apps/mobile run typecheck` passes
- [ ] `npx expo-doctor` passes or every warning is reviewed
- [ ] `supabase db diff` is empty after applying intended migrations
- [ ] SQL RLS verification returns no unexpected RLS-disabled tables
- [ ] profile bootstrap trigger is enabled and points to `public.handle_new_user()`
- [ ] FastAPI diagnostic tests pass
- [ ] `/health` returns 200
- [ ] real Supabase JWKS is reachable from the deployed API
- [ ] production CORS contains only intended origins
- [ ] production HTTPS/TLS 1.3 is enforced at the edge
- [ ] no secrets are committed to Git
- [ ] RevenueCat/Razorpay webhook secrets exist only in backend environment variables
- [ ] native builds use development/preview builds for native modules rather than relying on Expo Go

## Common failure points and immediate fixes

| Symptom | Likely cause | Immediate fix |
|---|---|---|
| Supabase client says URL/key missing | Expo env not loaded | Restart Expo with `npx expo start -c`; verify `.env`/EAS environment variables |
| Session disappears after reload | Storage not configured | Confirm `auth.storage: AsyncStorage` and rebuild the native app |
| `profiles` anonymous read fails | RLS is working | Test authenticated session; do not disable RLS |
| Profile missing after signup | Trigger absent/disabled | Run the trigger section of the SQL diagnostic and inspect `handle_new_user()` |
| Device cannot reach FastAPI | API points at localhost | Use the computer LAN IP and open port 8000 in the firewall |
| Expo Web CORS failure | Browser origin absent | Add the exact origin to `CORS_ORIGINS` |
| Native iOS/Android CORS confusion | CORS blamed for a native networking problem | Check API URL, DNS, TLS, firewall, certificate first |
| JWT 401 in API | Wrong Supabase project, issuer/audience, stale JWKS, or invalid token | Verify `SUPABASE_URL`, issuer `/auth/v1`, audience `authenticated`, and JWKS reachability |
| AI endpoint rejects large payload | 9 MB request limit / 6 MB audio limit | Compress/chunk audio or raise limits deliberately after security review |
| `supabase db diff` shows unexpected changes | Remote/local migration drift | Inspect diff before pushing; create a migration for intentional changes |
| TypeScript errors after dependency changes | Expo/RN package mismatch | Run `npx expo-doctor`; align packages with the installed Expo SDK |
| Push notifications work in Expo Go but fail in build | Native credentials/config missing | Use an EAS development/preview build and configure APNs/FCM |
| IAP unavailable | RevenueCat products/entitlements or native capability not configured | Configure App Store/Play products, RevenueCat offerings, credentials and native IAP capability |
| Webhook retries/duplicates | At-least-once delivery | Persist provider event IDs and make processing idempotent |
| PHI appears in logs | Request/exception logging too verbose | Remove body logging and sanitize exception paths; rotate affected logs if already exposed |
