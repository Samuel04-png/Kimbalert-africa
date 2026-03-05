# KimbAlert Africa

Guardian and Admin web app for missing-child emergency response.

## Prerequisites
- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- Firebase project already initialized (this repo is set to `kimbalert-africa`)

## Setup
1. Install dependencies:
   - `npm install`
2. Copy env template:
   - `cp .env.example .env.local` (or create `.env.local` manually on Windows)
3. Fill required values in `.env.local`:
   - Firebase web config (`VITE_FIREBASE_*`)
   - `VITE_DEFAULT_COUNTRY=ZA`
   - Optional AI proxy values (`AI_PROXY_PORT`, `DEEPSEEK_API_KEY`, etc.)

## Run Frontend
- `npm run dev`

## Optional AI Proxy (recommended)
This avoids exposing DeepSeek keys in browser code.

1. Set in `.env.local`:
   - `VITE_AI_PROXY_URL=http://localhost:8787/api/ai/incident-summary`
   - `DEEPSEEK_API_KEY=...`
2. Start proxy:
   - `npm run dev:api`

If proxy is unavailable, the app falls back to heuristic incident summaries.

## Firebase Callable Function (Blaze-ready)
Use this for production-safe AI summaries once you switch to Blaze.

1. Install functions deps:
   - `cd functions && npm install`
2. Set DeepSeek secret:
   - `firebase functions:secrets:set DEEPSEEK_API_KEY --project kimbalert-africa`
3. Deploy function:
   - `firebase deploy --only functions --project kimbalert-africa`
4. Frontend env:
   - `VITE_AI_USE_FIREBASE_FUNCTIONS=true`
   - `VITE_AI_FIREBASE_FUNCTION_NAME=incidentSummary`
   - `VITE_FIREBASE_FUNCTIONS_REGION=africa-south1`
   - `VITE_ADMIN_OPS_USE_FIREBASE_FUNCTIONS=true`
   - `VITE_ADMIN_OPS_FUNCTION_NAME=adminOperation`

Current provider order in app:
1. Local proxy URL (`VITE_AI_PROXY_URL`)
2. Firebase callable function (when `VITE_AI_USE_FIREBASE_FUNCTIONS=true`)
3. Optional client DeepSeek (disabled by default)
4. Heuristic fallback

Admin operation callables available:
- `adminOperation` (broadcast, gateway tests, partner notify, export, backup)
- writes `adminActions`, fan-out `notifications`, and increments `analytics` counters

## Firebase Deploy
- Deploy rules + indexes:
  - `firebase deploy --only firestore:rules,firestore:indexes --project kimbalert-africa`

## Notes
- Spark-safe mode is supported.
- Firebase Functions deploy requires Blaze plan. Until Blaze is enabled, admin operations auto-fallback to local Firestore writes and UI toasts.
- `VITE_FIREBASE_SEED_ON_EMPTY` defaults to `false` and should remain off in production.
- Admin users must exist in `admins/{uid}` to access admin routes.
