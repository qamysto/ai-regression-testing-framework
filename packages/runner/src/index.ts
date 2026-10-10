import { TestResult } from "@regression/shared";

export interface RunnerOptions {
  runId: string;
  projectDir: string;
  grep?: string;
  workers?: number;
}

export interface RunnerOutput {
  results: TestResult[];
  artifactDir: string;
}

export async function runPlaywrightSuite(options: RunnerOptions): Promise<RunnerOutput> {
  // The real Playwright process runner will be wired in after the API contract is stable.
  return {
    artifactDir: `${options.projectDir}/artifacts/${options.runId}`,
    results: []
  };
}
