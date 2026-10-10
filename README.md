# AI-Powered Automated Regression Testing Framework

This repository is the starter implementation for the QA-first regression platform described in the plan.

## Structure

```text
apps/
  api/      NestJS API, auth, RBAC, orchestration, reports
  web/      React dashboard and review UI
packages/
  ai/       Prompt-safe AI helpers and fallback analysis
  runner/   Playwright runner entry points
  shared/   Shared TypeScript domain types
docs/       Architecture and demo notes
```

## First Run

1. Copy `.env.example` to `.env`.
2. Start infrastructure:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Build shared packages once before starting dev servers:

```bash
npm run build:packages
```

5. Start API and web apps in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

## Demo Users

The API seed data includes:

- `qa@example.com` as QA Lead
- `dev@example.com` as Developer
- `admin@example.com` as Admin

For this first scaffold, the API accepts any password for those seed emails. Replace this with persistent password hashing before production use.
