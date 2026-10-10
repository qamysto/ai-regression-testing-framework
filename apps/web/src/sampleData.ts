import type { AiAnalysis, FailureCluster, Requirement, RunSummary, TestCase, TestRun, User } from "@regression/shared";

export const currentUser: User = {
  id: "u-qa",
  name: "QA Lead",
  email: "qa@example.com",
  role: "qa"
};

export const summary: RunSummary = {
  total: 18,
  passed: 14,
  failed: 3,
  skipped: 1,
  flaky: 1,
  passRate: 77.78
};

export const trends = [
  { build: "1.0.1", passRate: 94, failures: 2 },
  { build: "1.0.2", passRate: 91, failures: 4 },
  { build: "1.0.3", passRate: 96, failures: 1 },
  { build: "1.0.4", passRate: 88, failures: 5 },
  { build: "1.0.5", passRate: 78, failures: 3 }
];

export const requirements: Requirement[] = [
  {
    id: "req-evidence",
    projectId: "project-demo",
    title: "Partner evidence submission",
    description: "Partners must upload required evidence and submit it for review.",
    acceptanceCriteria: [
      "Supported evidence files can be uploaded.",
      "Unsupported files are rejected with a clear message.",
      "Submitted evidence appears in the reviewer queue."
    ],
    status: "ready"
  },
  {
    id: "req-review",
    projectId: "project-demo",
    title: "Reviewer approval queue",
    description: "Internal reviewers can approve or reject submitted partner evidence.",
    acceptanceCriteria: ["Reviewer can see pending evidence.", "Decision history is retained."],
    status: "draft"
  }
];

export const draftCases: TestCase[] = [
  {
    id: "tc-1",
    suiteId: "suite-demo",
    requirementId: "req-evidence",
    title: "Happy path: Partner evidence submission",
    type: "positive",
    priority: "P0",
    source: "ai",
    reviewStatus: "draft",
    steps: [
      { order: 1, action: "Open partner portal" },
      { order: 2, action: "Upload a supported PDF evidence file" },
      { order: 3, action: "Submit evidence for review" }
    ],
    expectedResult: "Evidence is submitted and visible in the reviewer queue."
  },
  {
    id: "tc-2",
    suiteId: "suite-demo",
    requirementId: "req-evidence",
    title: "Validation failure: unsupported evidence type",
    type: "negative",
    priority: "P1",
    source: "ai",
    reviewStatus: "draft",
    steps: [
      { order: 1, action: "Open partner portal" },
      { order: 2, action: "Upload an unsupported executable file" }
    ],
    expectedResult: "The upload is rejected with a clear validation message."
  }
];

export const latestRun: TestRun = {
  id: "run-2026-10-09-demo",
  projectId: "project-demo",
  trigger: "manual",
  environment: "staging",
  buildId: "1.0.5",
  status: "completed",
  startedAt: "2026-10-09T08:30:00.000Z",
  finishedAt: "2026-10-09T08:38:00.000Z"
};

export const clusters: FailureCluster[] = [
  {
    id: "cluster-1",
    runId: latestRun.id,
    signature: "expected evidence status {number} but received {number}",
    summary: "Evidence submission returns server error",
    size: 3
  }
];

export const analyses: AiAnalysis[] = [
  {
    id: "analysis-1",
    resultId: "result-2",
    category: "app-bug",
    likelyCause: "Evidence submission endpoint is returning a server error after upload validation.",
    confidence: 0.72,
    suggestedChecks: [
      "Check backend logs for the submission endpoint.",
      "Confirm uploaded file metadata is saved before reviewer queue insertion.",
      "Compare this build with the previous passing build."
    ],
    model: "mock-ai",
    createdAt: "2026-10-09T08:39:00.000Z"
  }
];
