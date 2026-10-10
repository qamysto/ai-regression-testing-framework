import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { analyzeFailure, normalizeErrorSignature } from "@regression/ai";
import type { FailureCluster, RunSummary, TestResult, TestRun } from "@regression/shared";
import { v4 as uuid } from "uuid";
import { AuthGuard } from "../common/auth.guard";
import { store } from "../common/in-memory.store";

@UseGuards(AuthGuard)
@Controller("runs")
export class RunsController {
  @Get()
  list() {
    return store.runs.map((run) => ({
      ...run,
      summary: summarizeRun(run.id)
    }));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    const results = store.results.filter((candidate) => candidate.runId === id);
    const resultIds = new Set(results.map((result) => result.id));

    return {
      run: store.runs.find((candidate) => candidate.id === id),
      results,
      analyses: store.analyses.filter((analysis) => resultIds.has(analysis.resultId)),
      clusters: store.clusters.filter((candidate) => candidate.runId === id),
      summary: summarizeRun(id)
    };
  }

  @Post()
  trigger(@Body() body: { projectId: string; environment: string; buildId?: string }) {
    const now = new Date().toISOString();
    const run: TestRun = {
      id: uuid(),
      projectId: body.projectId,
      trigger: "manual",
      environment: body.environment,
      buildId: body.buildId,
      status: "completed",
      startedAt: now,
      finishedAt: now
    };

    store.runs.push(run);
    const approved = store.testCases.filter((testCase) => testCase.reviewStatus === "approved");
    const selectedCases = approved.length ? approved : store.testCases.slice(0, 3);

    const results: TestResult[] = selectedCases.map((testCase, index) => {
      const failed = index === 1;
      const errorMessage = failed ? "Expected evidence status 200 but received 500 for submission id 9342" : undefined;
      return {
        id: uuid(),
        runId: run.id,
        testCaseId: testCase.id,
        status: failed ? "fail" : "pass",
        durationMs: 1200 + index * 230,
        retries: failed ? 1 : 0,
        errorMessage,
        errorSignature: errorMessage ? normalizeErrorSignature(errorMessage) : undefined,
        log: failed ? "POST /evidence returned 500. token=abc123 was masked before AI analysis." : undefined
      };
    });

    store.results.push(...results);
    const failedResults = results.filter((result) => result.status === "fail");
    store.analyses.push(
      ...failedResults.map((result) => ({
        ...analyzeFailure(result),
        id: uuid(),
        createdAt: new Date().toISOString()
      }))
    );

    const clusters = new Map<string, FailureCluster>();
    for (const result of failedResults) {
      const signature = result.errorSignature ?? "unknown";
      const existing = clusters.get(signature);
      if (existing) {
        existing.size += 1;
      } else {
        clusters.set(signature, {
          id: uuid(),
          runId: run.id,
          signature,
          summary: result.errorMessage ?? "Unknown failure",
          size: 1
        });
      }
    }
    store.clusters.push(...clusters.values());

    return { run, results, summary: summarizeRun(run.id) };
  }
}

function summarizeRun(runId: string): RunSummary {
  const results = store.results.filter((candidate) => candidate.runId === runId);
  const total = results.length;
  const passed = results.filter((result) => result.status === "pass").length;
  const failed = results.filter((result) => result.status === "fail").length;
  const skipped = results.filter((result) => result.status === "skip").length;
  const flaky = results.filter((result) => result.status === "flaky").length;

  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    passRate: total ? Math.round((passed / total) * 10000) / 100 : 0
  };
}
