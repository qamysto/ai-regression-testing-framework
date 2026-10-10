import type {
  AiAnalysis,
  Priority,
  Requirement,
  TestCase,
  TestCaseType,
  TestResult
} from "@regression/shared";

const secretPatterns = [
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /api[_-]?key\s*[:=]\s*[A-Za-z0-9._-]+/gi,
  /password\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*[A-Za-z0-9._-]+/gi
];

export function maskSecrets(input = ""): string {
  return secretPatterns.reduce((value, pattern) => value.replace(pattern, "[masked-secret]"), input);
}

export function normalizeErrorSignature(message = ""): string {
  return message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, "{uuid}")
    .replace(/\d{4}-\d{2}-\d{2}[t\s]\d{2}:\d{2}:\d{2}(\.\d+)?z?/g, "{timestamp}")
    .replace(/\d+/g, "{number}")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDraftTestCases(requirement: Requirement): Omit<TestCase, "id" | "suiteId">[] {
  const criteria = requirement.acceptanceCriteria.length
    ? requirement.acceptanceCriteria
    : ["The user can complete the described workflow"];

  const templates: Array<{ type: TestCaseType; priority: Priority; titlePrefix: string }> = [
    { type: "positive", priority: "P0", titlePrefix: "Happy path" },
    { type: "negative", priority: "P1", titlePrefix: "Validation failure" },
    { type: "boundary", priority: "P1", titlePrefix: "Boundary data" },
    { type: "permission", priority: "P0", titlePrefix: "Unauthorized access" },
    { type: "edge", priority: "P2", titlePrefix: "Interrupted flow" }
  ];

  return templates.map((template, index) => ({
    requirementId: requirement.id,
    title: `${template.titlePrefix}: ${requirement.title}`,
    type: template.type,
    priority: template.priority,
    steps: [
      { order: 1, action: "Open the target application for the selected environment" },
      { order: 2, action: `Prepare data for: ${criteria[index % criteria.length]}` },
      { order: 3, action: `Execute the ${template.type} scenario for ${requirement.title}` }
    ],
    expectedResult: `System behavior satisfies: ${criteria[index % criteria.length]}`,
    source: "ai",
    reviewStatus: "draft"
  }));
}

export function analyzeFailure(result: TestResult, model = "mock-ai"): Omit<AiAnalysis, "id" | "createdAt"> {
  const safeError = maskSecrets(result.errorMessage ?? "");
  const safeLog = maskSecrets(result.log ?? "");
  const signature = normalizeErrorSignature(`${safeError} ${safeLog}`);

  const category: AiAnalysis["category"] =
    /timeout|network|connection|dns/.test(signature)
      ? "environment"
      : /selector|locator|expect/.test(signature)
        ? "test-bug"
        : /500|exception|constraint|database/.test(signature)
          ? "app-bug"
          : "unknown";

  return {
    resultId: result.id,
    category,
    likelyCause: signature || "Failure details were not available.",
    confidence: category === "unknown" ? 0.45 : 0.72,
    suggestedChecks: [
      "Review the last failing step and attached trace.",
      "Compare the failed build with the previous passing build.",
      "Confirm test data and environment configuration."
    ],
    model
  };
}
