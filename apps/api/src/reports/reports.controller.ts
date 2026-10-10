import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import ExcelJS from "exceljs";
import { AuthGuard } from "../common/auth.guard";
import { store } from "../common/in-memory.store";

@UseGuards(AuthGuard)
@Controller("reports")
export class ReportsController {
  @Get("runs/:id/export.xlsx")
  async exportRun(@Param("id") id: string, @Res() response: Response) {
    const run = store.runs.find((candidate) => candidate.id === id);
    const results = store.results.filter((candidate) => candidate.runId === id);
    const workbook = new ExcelJS.Workbook();
    const summary = workbook.addWorksheet("Summary");
    const resultSheet = workbook.addWorksheet("Results");
    const failureSheet = workbook.addWorksheet("Failures");
    const commentSheet = workbook.addWorksheet("Comments");

    summary.addRows([
      ["Run ID", run?.id ?? id],
      ["Build", run?.buildId ?? ""],
      ["Environment", run?.environment ?? ""],
      ["Status", run?.status ?? "unknown"],
      ["Total", results.length],
      ["Passed", results.filter((result) => result.status === "pass").length],
      ["Failed", results.filter((result) => result.status === "fail").length]
    ]);

    resultSheet.columns = [
      { header: "Result ID", key: "id", width: 38 },
      { header: "Test Case", key: "testCaseId", width: 38 },
      { header: "Status", key: "status", width: 12 },
      { header: "Duration", key: "durationMs", width: 14 },
      { header: "Error", key: "errorMessage", width: 60 },
      { header: "Cluster", key: "errorSignature", width: 40 }
    ];
    resultSheet.addRows(results);

    failureSheet.columns = [
      { header: "Result ID", key: "resultId", width: 38 },
      { header: "Category", key: "category", width: 18 },
      { header: "Likely Cause", key: "likelyCause", width: 70 },
      { header: "Confidence", key: "confidence", width: 14 },
      { header: "Suggested Checks", key: "suggestedChecks", width: 70 }
    ];
    failureSheet.addRows(
      store.analyses
        .filter((analysis) => results.some((result) => result.id === analysis.resultId))
        .map((analysis) => ({
          ...analysis,
          suggestedChecks: analysis.suggestedChecks.join("; ")
        }))
    );

    commentSheet.columns = [
      { header: "Target", key: "targetId", width: 38 },
      { header: "User", key: "userId", width: 20 },
      { header: "Comment", key: "body", width: 70 },
      { header: "Time", key: "createdAt", width: 28 }
    ];
    commentSheet.addRows(store.comments.filter((comment) => comment.targetId === id));

    response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", `attachment; filename="run-${id}.xlsx"`);
    await workbook.xlsx.write(response);
    response.end();
  }
}
