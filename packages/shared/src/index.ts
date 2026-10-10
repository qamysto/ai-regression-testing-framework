export type UserRole = "admin" | "qa" | "developer" | "viewer";

export type TestCaseType =
  | "positive"
  | "negative"
  | "boundary"
  | "permission"
  | "edge";

export type Priority = "P0" | "P1" | "P2";
export type ReviewStatus = "draft" | "approved" | "rejected";
export type RunStatus = "queued" | "running" | "completed" | "failed";
export type TestStatus = "pass" | "fail" | "skip" | "flaky";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  baseUrl: string;
  environmentConfig: Record<string, string>;
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: "draft" | "ready" | "covered";
}

export interface TestCaseStep {
  order: number;
  action: string;
  data?: string;
}

export interface TestCase {
  id: string;
  suiteId: string;
  requirementId: string;
  title: string;
  type: TestCaseType;
  priority: Priority;
  steps: TestCaseStep[];
  expectedResult: string;
  source: "manual" | "ai";
  reviewStatus: ReviewStatus;
}

export interface TestRun {
  id: string;
  projectId: string;
  trigger: "manual" | "ci";
  environment: string;
  buildId?: string;
  status: RunStatus;
  startedAt?: string;
  finishedAt?: string;
}

export interface TestResult {
  id: string;
  runId: string;
  testCaseId: string;
  status: TestStatus;
  durationMs: number;
  errorMessage?: string;
  errorSignature?: string;
  log?: string;
  retries: number;
}

export interface AiAnalysis {
  id: string;
  resultId: string;
  category: "app-bug" | "test-bug" | "environment" | "data" | "unknown";
  likelyCause: string;
  confidence: number;
  suggestedChecks: string[];
  model: string;
  createdAt: string;
}

export interface FailureCluster {
  id: string;
  runId: string;
  signature: string;
  summary: string;
  size: number;
}

export interface Comment {
  id: string;
  targetType: "run" | "result";
  targetId: string;
  userId: string;
  body: string;
  createdAt: string;
  parentId?: string;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
}
