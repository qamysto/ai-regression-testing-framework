import type {
  AiAnalysis,
  Comment,
  FailureCluster,
  Project,
  Requirement,
  TestCase,
  TestResult,
  TestRun,
  User
} from "@regression/shared";

export interface AppStore {
  users: User[];
  projects: Project[];
  requirements: Requirement[];
  testCases: TestCase[];
  runs: TestRun[];
  results: TestResult[];
  analyses: AiAnalysis[];
  clusters: FailureCluster[];
  comments: Comment[];
}

export const store: AppStore = {
  users: [
    { id: "u-qa", name: "QA Lead", email: "qa@example.com", role: "qa" },
    { id: "u-dev", name: "Developer", email: "dev@example.com", role: "developer" },
    { id: "u-admin", name: "Admin", email: "admin@example.com", role: "admin" }
  ],
  projects: [
    {
      id: "project-demo",
      name: "Partner Evidence Submission",
      baseUrl: "https://demo.example.test",
      environmentConfig: { staging: "https://staging.example.test" }
    }
  ],
  requirements: [
    {
      id: "req-evidence",
      projectId: "project-demo",
      title: "Partner evidence submission",
      description: "Partners must upload required evidence and submit it for review.",
      acceptanceCriteria: [
        "A partner can upload supported evidence files.",
        "Unsupported files are rejected with a clear message.",
        "Submitted evidence appears in the reviewer queue."
      ],
      status: "ready"
    }
  ],
  testCases: [
    {
      id: "tc-happy-path",
      suiteId: "suite-demo",
      requirementId: "req-evidence",
      title: "Happy path: Partner evidence submission",
      type: "positive",
      priority: "P0",
      steps: [
        { order: 1, action: "Open the partner portal" },
        { order: 2, action: "Upload a supported PDF evidence file" },
        { order: 3, action: "Submit evidence for review" }
      ],
      expectedResult: "Evidence is submitted and appears in the reviewer queue.",
      source: "manual",
      reviewStatus: "approved"
    },
    {
      id: "tc-unsupported-file",
      suiteId: "suite-demo",
      requirementId: "req-evidence",
      title: "Validation failure: unsupported evidence type",
      type: "negative",
      priority: "P1",
      steps: [
        { order: 1, action: "Open the partner portal" },
        { order: 2, action: "Upload an unsupported executable file" }
      ],
      expectedResult: "The upload is rejected with a clear validation message.",
      source: "ai",
      reviewStatus: "draft"
    },
    {
      id: "tc-permission",
      suiteId: "suite-demo",
      requirementId: "req-evidence",
      title: "Permission: unauthenticated partner cannot submit evidence",
      type: "permission",
      priority: "P0",
      steps: [
        { order: 1, action: "Open evidence submission without a valid session" },
        { order: 2, action: "Attempt to submit evidence" }
      ],
      expectedResult: "The user is redirected to login and no evidence is submitted.",
      source: "ai",
      reviewStatus: "approved"
    }
  ],
  runs: [
    {
      id: "run-demo-1",
      projectId: "project-demo",
      trigger: "manual",
      environment: "staging",
      buildId: "1.0.5",
      status: "completed",
      startedAt: "2026-10-09T08:30:00.000Z",
      finishedAt: "2026-10-09T08:38:00.000Z"
    }
  ],
  results: [
    {
      id: "result-pass-1",
      runId: "run-demo-1",
      testCaseId: "tc-happy-path",
      status: "pass",
      durationMs: 1320,
      retries: 0
    },
    {
      id: "result-fail-1",
      runId: "run-demo-1",
      testCaseId: "tc-permission",
      status: "fail",
      durationMs: 1580,
      errorMessage: "Expected evidence status 200 but received 500 for submission id 9342",
      errorSignature: "expected evidence status {number} but received {number} for submission id {number}",
      log: "POST /evidence returned 500. token=abc123 was masked before AI analysis.",
      retries: 1
    }
  ],
  analyses: [
    {
      id: "analysis-demo-1",
      resultId: "result-fail-1",
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
  ],
  clusters: [
    {
      id: "cluster-demo-1",
      runId: "run-demo-1",
      signature: "expected evidence status {number} but received {number} for submission id {number}",
      summary: "Evidence submission returns server error",
      size: 1
    }
  ],
  comments: [
    {
      id: "comment-demo-1",
      targetType: "run",
      targetId: "run-demo-1",
      userId: "u-dev",
      body: "Backend team should check the evidence submission API before release approval.",
      createdAt: "2026-10-09T08:45:00.000Z"
    }
  ]
};
