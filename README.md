# LIVYA Smart App

Step 1 initializes the cross-platform mobile + backend foundation.

## Stack
- Expo SDK 51 + React Native + TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- TanStack Query v5
- FastAPI + Pydantic v2
- PostgreSQL + SQLAlchemy 2 async
- Docker Compose
- Supabase project integration via environment variables

## Layout

```text
livya-smart-app/
├── apps/mobile/              # iOS / Android / web client
│   ├── app/                  # Expo Router routes
│   ├── components/
│   ├── lib/
│   ├── assets/
│   ├── app.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── nativewind-env.d.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── services/api/             # FastAPI service
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── docs/
├── docker-compose.yml
└── package.json
```

## Environment

### Mobile
```bash
cd apps/mobile
cp .env.example .env
npm install
npx expo start
```

Use Expo Go for the first device test, or `npm run android` / `npm run ios` when native tooling is installed.

### Backend
```bash
cd services/api
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Full local stack
From repository root:
```bash
docker compose up --build
```

API health check: `http://localhost:8000/health`
