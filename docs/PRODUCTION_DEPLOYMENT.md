# LIVYA production deployment

## Vercel projects

Create three separate Vercel projects from the same GitHub repository:

| Project | Root Directory | Domain |
|---|---|---|
| `livya-client` | `apps/client` | `app.livyacurehub.com` |
| `livya-admin` | `apps/admin` | `admin.livyacurehub.com` |
| `livya-api` | `services/api` | `api.livyacurehub.com` |

Do not attach these to the existing `gearsmotortune` Vercel project.

## Client/Admin variables

`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
`NEXT_PUBLIC_API_URL`

Only the public Supabase URL and publishable key belong in browser environments. Never add a service-role key, database password, Razorpay secret, RevenueCat webhook secret, or AI token to either web app.

## API variables

`APP_ENV=production`
`SUPABASE_URL`
`SUPABASE_PUBLISHABLE_KEY`
`DATABASE_URL`
`CORS_ORIGINS=["https://app.livyacurehub.com","https://admin.livyacurehub.com"]`
`AI_SERVICE_URL=https://<private-ai-service>`
`AI_SERVICE_TOKEN=<secret>`
`REQUIRE_HTTPS=true`

Configure payment webhook secrets only in the API project.

## AI

Vercel should not host the Ollama/Whisper runtime. Deploy `services/ai-worker` on private compute, expose it only to the API, and require bearer authentication. The current worker is a secure boundary stub, not a completed model runtime.

## Database

Run all Supabase migrations against the production project before enabling production traffic. The repository cannot verify remote migration state when the connected Supabase integration lacks SQL permissions.
