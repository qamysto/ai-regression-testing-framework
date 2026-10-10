# Architecture

Browser clients use the React app in `apps/web`. The app calls the NestJS API in `apps/api`.

The API owns authentication, role checks, project data, requirements, test case review, run orchestration, comments, and report export.

Background execution is planned through Redis and BullMQ. The runner package will execute Playwright suites, collect JSON results, store artifacts, and return normalized result objects to the API.

AI features live behind `packages/ai`. All model responses are treated as draft suggestions. QA approval is required before generated tests become approved regression coverage.

## Main Data Flow

1. QA creates a requirement.
2. API calls AI helper to generate draft test cases.
3. QA approves or rejects generated cases.
4. QA or CI triggers a run.
5. Runner executes Playwright tests and stores results.
6. Failed results are analyzed and clustered.
7. Dashboard, comments, coverage, Excel reports, and release summary use saved run data.
