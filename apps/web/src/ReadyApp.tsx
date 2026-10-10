import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type {
  AiAnalysis,
  Comment,
  FailureCluster,
  Project,
  Requirement,
  ReviewStatus,
  RunSummary,
  TestCase,
  TestResult,
  TestRun,
  User
} from "@regression/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type Screen = "dashboard" | "requirements" | "review" | "runs" | "coverage" | "reports" | "comments" | "admin";
type RunListItem = TestRun & { summary: RunSummary };
type RunDetail = {
  run?: TestRun;
  results: TestResult[];
  analyses: AiAnalysis[];
  clusters: FailureCluster[];
  summary: RunSummary;
};

const emptySummary: RunSummary = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  passRate: 0
};

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "requirements", label: "Requirements", icon: FileText },
  { id: "review", label: "Review", icon: Sparkles },
  { id: "runs", label: "Runs", icon: Play },
  { id: "coverage", label: "Coverage", icon: CheckCircle2 },
  { id: "reports", label: "Reports", icon: Download },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "admin", label: "Admin", icon: Users }
] satisfies Array<{ id: Screen; label: string; icon: typeof LayoutDashboard }>;

const demoUsers = [
  { name: "QA Lead", email: "qa@example.com", role: "qa" },
  { name: "Developer", email: "dev@example.com", role: "developer" },
  { name: "Admin", email: "admin@example.com", role: "admin" }
];

export function ReadyApp() {
  const [token, setToken] = useState(() => window.localStorage.getItem("regression_token") ?? "");
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("run-demo-1");
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [requirementForm, setRequirementForm] = useState({
    title: "",
    description: "",
    acceptanceCriteria: ""
  });
  const [runForm, setRunForm] = useState({
    environment: "staging",
    buildId: "local-demo"
  });
  const [commentBody, setCommentBody] = useState("");

  const fetchJson = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json() as Promise<T>;
    },
    [token]
  );

  const refreshData = useCallback(async () => {
    if (!token) {
      return;
    }

    const [projectData, requirementData, caseData, runData] = await Promise.all([
      fetchJson<Project[]>("/projects"),
      fetchJson<Requirement[]>("/requirements"),
      fetchJson<TestCase[]>("/test-cases"),
      fetchJson<RunListItem[]>("/runs")
    ]);

    const sortedRuns = [...runData].sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
    setProjects(projectData);
    setRequirements(requirementData);
    setTestCases(caseData);
    setRuns(sortedRuns);

    if (sortedRuns[0] && !selectedRunId) {
      setSelectedRunId(sortedRuns[0].id);
    }
  }, [fetchJson, selectedRunId, token]);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        return;
      }
      try {
        const current = await fetchJson<User>("/auth/me");
        setUser(current);
        await refreshData();
      } catch (loadError) {
        setError(readError(loadError));
        setToken("");
        window.localStorage.removeItem("regression_token");
      }
    }

    void loadUser();
  }, [fetchJson, refreshData, token]);

  useEffect(() => {
    async function loadRun() {
      if (!token || !selectedRunId) {
        return;
      }
      try {
        const detail = await fetchJson<RunDetail>(`/runs/${selectedRunId}`);
        setRunDetail(detail);
        const runComments = await fetchJson<Comment[]>(`/comments/run/${selectedRunId}`);
        setComments(runComments);
      } catch (loadError) {
        setError(readError(loadError));
      }
    }

    void loadRun();
  }, [fetchJson, selectedRunId, token]);

  const latestSummary = runDetail?.summary ?? runs[0]?.summary ?? emptySummary;
  const approvedCases = testCases.filter((testCase) => testCase.reviewStatus === "approved");
  const draftCases = testCases.filter((testCase) => testCase.reviewStatus === "draft");
  const coveredRequirementIds = new Set(approvedCases.map((testCase) => testCase.requirementId));
  const coverageRate = requirements.length ? Math.round((coveredRequirementIds.size / requirements.length) * 100) : 0;
  const selectedRun = runDetail?.run ?? runs.find((run) => run.id === selectedRunId);

  const trendData = runs.length
    ? runs
        .slice()
        .reverse()
        .map((run) => ({
          build: run.buildId ?? run.id.slice(0, 8),
          passRate: run.summary.passRate,
          failures: run.summary.failed
        }))
    : [{ build: "No runs", passRate: 0, failures: 0 }];

  async function handleLogin(email: string, password: string) {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { accessToken: string; user: User };
      window.localStorage.setItem("regression_token", data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } catch (loginError) {
      setError(readError(loginError));
    } finally {
      setIsBusy(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("regression_token");
    setToken("");
    setUser(null);
    setRunDetail(null);
  }

  async function runAction(action: () => Promise<void>) {
    setIsBusy(true);
    setError("");
    try {
      await action();
    } catch (actionError) {
      setError(readError(actionError));
    } finally {
      setIsBusy(false);
    }
  }

  async function createRequirement(event: FormEvent) {
    event.preventDefault();
    const projectId = projects[0]?.id;
    if (!projectId) {
      setError("Project missing. Create a project first.");
      return;
    }

    await runAction(async () => {
      await fetchJson<Requirement>("/requirements", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          title: requirementForm.title,
          description: requirementForm.description,
          acceptanceCriteria: requirementForm.acceptanceCriteria
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        })
      });
      setRequirementForm({ title: "", description: "", acceptanceCriteria: "" });
      await refreshData();
    });
  }

  async function generateTests(requirementId: string) {
    await runAction(async () => {
      await fetchJson(`/requirements/${requirementId}/generate-tests`, {
        method: "POST",
        body: JSON.stringify({ suiteId: "suite-demo" })
      });
      await refreshData();
      setScreen("review");
    });
  }

  async function reviewCase(id: string, reviewStatus: ReviewStatus) {
    await runAction(async () => {
      await fetchJson(`/test-cases/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ reviewStatus })
      });
      await refreshData();
    });
  }

  async function triggerRun(event?: FormEvent) {
    event?.preventDefault();
    const projectId = projects[0]?.id;
    if (!projectId) {
      setError("Project missing. Create a project first.");
      return;
    }

    await runAction(async () => {
      const response = await fetchJson<{ run: TestRun }>("/runs", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          environment: runForm.environment,
          buildId: runForm.buildId
        })
      });
      setSelectedRunId(response.run.id);
      await refreshData();
      setScreen("runs");
    });
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!selectedRunId || !commentBody.trim()) {
      return;
    }

    await runAction(async () => {
      await fetchJson<Comment>("/comments", {
        method: "POST",
        body: JSON.stringify({
          targetType: "run",
          targetId: selectedRunId,
          body: commentBody.trim()
        })
      });
      setCommentBody("");
      setComments(await fetchJson<Comment[]>(`/comments/run/${selectedRunId}`));
    });
  }

  async function downloadExcel() {
    if (!selectedRunId) {
      return;
    }

    await runAction(async () => {
      const response = await fetch(`${API_BASE}/reports/runs/${selectedRunId}/export.xlsx`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `run-${selectedRunId}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    });
  }

  if (!token || !user) {
    return <LoginScreen error={error} isBusy={isBusy} onLogin={handleLogin} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={26} />
          <div>
            <strong>Regression AI</strong>
            <span>QA control center</span>
          </div>
        </div>

        <nav>
          {nav.map((item) => (
            <button
              className={screen === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setScreen(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{titleForScreen(screen)}</h1>
            <p>AI-assisted regression test management with human QA approval.</p>
          </div>
          <div className="topbar-actions">
            {isBusy ? (
              <span className="busy-pill">
                <Loader2 size={15} />
                Working
              </span>
            ) : null}
            <div className="user-pill">
              <span>{user.name}</span>
              <strong>{user.role.toUpperCase()}</strong>
            </div>
            <button className="icon-button" onClick={handleLogout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {screen === "dashboard" ? (
          <DashboardScreen
            analyses={runDetail?.analyses ?? []}
            clusters={runDetail?.clusters ?? []}
            coverageRate={coverageRate}
            draftCount={draftCases.length}
            latestRun={selectedRun}
            onDownload={downloadExcel}
            onTriggerRun={() => void triggerRun()}
            summary={latestSummary}
            trendData={trendData}
          />
        ) : null}

        {screen === "requirements" ? (
          <RequirementsScreen
            coveredRequirementIds={coveredRequirementIds}
            form={requirementForm}
            onChange={setRequirementForm}
            onCreate={(event) => void createRequirement(event)}
            onGenerate={(id) => void generateTests(id)}
            requirements={requirements}
            testCases={testCases}
          />
        ) : null}

        {screen === "review" ? (
          <ReviewScreen onReview={(id, status) => void reviewCase(id, status)} requirements={requirements} testCases={testCases} />
        ) : null}

        {screen === "runs" ? (
          <RunsScreen
            analyses={runDetail?.analyses ?? []}
            clusters={runDetail?.clusters ?? []}
            detail={runDetail}
            form={runForm}
            onDownload={() => void downloadExcel()}
            onFormChange={setRunForm}
            onSelectRun={setSelectedRunId}
            onTrigger={(event) => void triggerRun(event)}
            results={runDetail?.results ?? []}
            runs={runs}
            selectedRunId={selectedRunId}
            testCases={testCases}
          />
        ) : null}

        {screen === "coverage" ? (
          <CoverageScreen coveredRequirementIds={coveredRequirementIds} requirements={requirements} testCases={testCases} />
        ) : null}

        {screen === "reports" ? (
          <ReportsScreen
            analyses={runDetail?.analyses ?? []}
            clusters={runDetail?.clusters ?? []}
            coverageRate={coverageRate}
            latestRun={selectedRun}
            onDownload={() => void downloadExcel()}
            summary={latestSummary}
          />
        ) : null}

        {screen === "comments" ? (
          <CommentsScreen
            body={commentBody}
            comments={comments}
            onBodyChange={setCommentBody}
            onCreate={(event) => void addComment(event)}
            selectedRun={selectedRun}
          />
        ) : null}

        {screen === "admin" ? <AdminScreen projects={projects} user={user} /> : null}
      </section>
    </main>
  );
}

function LoginScreen({
  error,
  isBusy,
  onLogin
}: {
  error: string;
  isBusy: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("qa@example.com");
  const [password, setPassword] = useState("demo");

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand login-brand">
          <ShieldCheck size={30} />
          <div>
            <strong>Regression AI</strong>
            <span>QA-first release confidence</span>
          </div>
        </div>
        <h1>Sign in</h1>
        <p>Use a demo account below. The scaffold accepts any password for seed users.</p>
        {error ? <div className="error-banner compact">{error}</div> : null}
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void onLogin(email, password);
          }}
        >
          <label>
            Email
            <select value={email} onChange={(event) => setEmail(event.target.value)}>
              {demoUsers.map((candidate) => (
                <option key={candidate.email} value={candidate.email}>
                  {candidate.name} - {candidate.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          <button className="primary-action" disabled={isBusy} type="submit">
            <ShieldCheck size={18} />
            {isBusy ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function DashboardScreen({
  analyses,
  clusters,
  coverageRate,
  draftCount,
  latestRun,
  onDownload,
  onTriggerRun,
  summary,
  trendData
}: {
  analyses: AiAnalysis[];
  clusters: FailureCluster[];
  coverageRate: number;
  draftCount: number;
  latestRun?: TestRun;
  onDownload: () => Promise<void>;
  onTriggerRun: () => void;
  summary: RunSummary;
  trendData: Array<{ build: string; passRate: number; failures: number }>;
}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="Pass rate" value={`${summary.passRate}%`} tone="success" />
        <Metric title="Failed" value={summary.failed.toString()} tone={summary.failed ? "danger" : "success"} />
        <Metric title="Coverage" value={`${coverageRate}%`} tone="neutral" />
        <Metric title="Draft cases" value={draftCount.toString()} tone="neutral" />
      </section>

      <section className="dashboard-grid">
        <article className="panel wide">
          <PanelHeader
            title="Quality trend"
            subtitle="Pass rate across recent regression runs."
            action={
              <button className="secondary-action" onClick={onTriggerRun}>
                <Play size={18} />
                Run suite
              </button>
            }
          />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="passRate" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e6e8ec" vertical={false} />
                <XAxis dataKey="build" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="passRate" stroke="#0f766e" fill="url(#passRate)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeader title="Latest run" subtitle={latestRun ? `${latestRun.buildId ?? "Build"} on ${latestRun.environment}` : "No run selected"} />
          <div className="run-list">
            <RunRow label="Total" value={summary.total} />
            <RunRow label="Passed" value={summary.passed} />
            <RunRow label="Failed" value={summary.failed} danger={summary.failed > 0} />
            <RunRow label="Skipped" value={summary.skipped} />
          </div>
          <button className="primary-action" onClick={() => void onDownload()}>
            <Download size={18} />
            Export Excel
          </button>
        </article>

        <article className="panel">
          <PanelHeader title="AI analysis" subtitle="Suggestions stay review-only." icon={<FlaskConical size={20} />} />
          <div className="stack">
            {analyses.length ? (
              analyses.map((analysis) => <AnalysisCard analysis={analysis} key={analysis.id} />)
            ) : (
              <EmptyState text="No failed result has AI analysis yet." />
            )}
          </div>
        </article>

        <article className="panel">
          <PanelHeader title="Failure clusters" subtitle="Duplicate failures by signature." icon={<AlertTriangle size={20} />} />
          <div className="stack">
            {clusters.length ? (
              clusters.map((cluster) => (
                <div className="cluster" key={cluster.id}>
                  <strong>{cluster.summary}</strong>
                  <span>{cluster.size} affected tests</span>
                </div>
              ))
            ) : (
              <EmptyState text="No clusters for the selected run." />
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function RequirementsScreen({
  coveredRequirementIds,
  form,
  onChange,
  onCreate,
  onGenerate,
  requirements,
  testCases
}: {
  coveredRequirementIds: Set<string>;
  form: { title: string; description: string; acceptanceCriteria: string };
  onChange: (value: { title: string; description: string; acceptanceCriteria: string }) => void;
  onCreate: (event: FormEvent) => void;
  onGenerate: (id: string) => void;
  requirements: Requirement[];
  testCases: TestCase[];
}) {
  return (
    <section className="two-column">
      <article className="panel">
        <PanelHeader title="Add requirement" subtitle="Each line in criteria becomes a test-generation signal." />
        <form className="stack" onSubmit={onCreate}>
          <label>
            Title
            <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} required />
          </label>
          <label>
            Acceptance criteria
            <textarea
              value={form.acceptanceCriteria}
              onChange={(event) => onChange({ ...form, acceptanceCriteria: event.target.value })}
              placeholder="One criterion per line"
              required
            />
          </label>
          <button className="primary-action" type="submit">
            <Plus size={18} />
            Save requirement
          </button>
        </form>
      </article>

      <article className="panel wide-list">
        <PanelHeader title="Requirements" subtitle="Generate AI draft cases, then review them before execution." />
        <div className="table-list">
          {requirements.map((requirement) => {
            const mapped = testCases.filter((testCase) => testCase.requirementId === requirement.id);
            return (
              <div className="requirement-row" key={requirement.id}>
                <div>
                  <strong>{requirement.title}</strong>
                  <p>{requirement.description}</p>
                  <span>
                    {mapped.length} cases - {coveredRequirementIds.has(requirement.id) ? "covered" : "uncovered"}
                  </span>
                </div>
                <button className="secondary-action" onClick={() => onGenerate(requirement.id)}>
                  <Sparkles size={18} />
                  Generate tests
                </button>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function ReviewScreen({
  onReview,
  requirements,
  testCases
}: {
  onReview: (id: string, status: ReviewStatus) => void;
  requirements: Requirement[];
  testCases: TestCase[];
}) {
  const requirementById = useMemo(() => new Map(requirements.map((requirement) => [requirement.id, requirement.title])), [requirements]);

  return (
    <article className="panel">
      <PanelHeader title="Test case review" subtitle="AI cases stay draft until QA approves them." />
      <div className="data-table">
        <div className="table-head five">
          <span>Test case</span>
          <span>Requirement</span>
          <span>Risk</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {testCases.map((testCase) => (
          <div className="table-row five" key={testCase.id}>
            <div>
              <strong>{testCase.title}</strong>
              <small>{testCase.steps.length} steps - {testCase.source}</small>
            </div>
            <span>{requirementById.get(testCase.requirementId) ?? "Unknown"}</span>
            <span>
              {testCase.type} / {testCase.priority}
            </span>
            <span className={`status ${testCase.reviewStatus}`}>{testCase.reviewStatus}</span>
            <div className="row-actions">
              <button onClick={() => onReview(testCase.id, "rejected")}>Reject</button>
              <button className="approve" onClick={() => onReview(testCase.id, "approved")}>
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RunsScreen({
  analyses,
  clusters,
  detail,
  form,
  onDownload,
  onFormChange,
  onSelectRun,
  onTrigger,
  results,
  runs,
  selectedRunId,
  testCases
}: {
  analyses: AiAnalysis[];
  clusters: FailureCluster[];
  detail: RunDetail | null;
  form: { environment: string; buildId: string };
  onDownload: () => void;
  onFormChange: (value: { environment: string; buildId: string }) => void;
  onSelectRun: (id: string) => void;
  onTrigger: (event: FormEvent) => void;
  results: TestResult[];
  runs: RunListItem[];
  selectedRunId: string;
  testCases: TestCase[];
}) {
  const testCaseById = useMemo(() => new Map(testCases.map((testCase) => [testCase.id, testCase])), [testCases]);

  return (
    <section className="runs-layout">
      <article className="panel">
        <PanelHeader title="Trigger run" subtitle="Runs use approved cases in this scaffold." />
        <form className="stack" onSubmit={onTrigger}>
          <label>
            Environment
            <select value={form.environment} onChange={(event) => onFormChange({ ...form, environment: event.target.value })}>
              <option value="staging">staging</option>
              <option value="qa">qa</option>
              <option value="local">local</option>
            </select>
          </label>
          <label>
            Build ID
            <input value={form.buildId} onChange={(event) => onFormChange({ ...form, buildId: event.target.value })} />
          </label>
          <button className="primary-action" type="submit">
            <Play size={18} />
            Run approved suite
          </button>
        </form>

        <div className="run-history">
          {runs.map((run) => (
            <button className={run.id === selectedRunId ? "history-item active" : "history-item"} key={run.id} onClick={() => onSelectRun(run.id)}>
              <strong>{run.buildId ?? run.id.slice(0, 8)}</strong>
              <span>
                {run.summary.passRate}% pass - {run.summary.failed} failed
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className="panel run-detail">
        <PanelHeader
          title="Run details"
          subtitle={detail?.run ? `${detail.run.environment} - ${formatDate(detail.run.startedAt)}` : "Select a run"}
          action={
            <button className="secondary-action" onClick={onDownload}>
              <Download size={18} />
              Excel
            </button>
          }
        />
        <div className="metrics-grid compact-grid">
          <Metric title="Total" value={(detail?.summary.total ?? 0).toString()} tone="neutral" />
          <Metric title="Passed" value={(detail?.summary.passed ?? 0).toString()} tone="success" />
          <Metric title="Failed" value={(detail?.summary.failed ?? 0).toString()} tone={(detail?.summary.failed ?? 0) ? "danger" : "success"} />
          <Metric title="Pass rate" value={`${detail?.summary.passRate ?? 0}%`} tone="neutral" />
        </div>

        <div className="data-table">
          <div className="table-head four">
            <span>Case</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Error</span>
          </div>
          {results.map((result) => {
            const testCase = testCaseById.get(result.testCaseId);
            return (
              <div className="table-row four" key={result.id}>
                <strong>{testCase?.title ?? result.testCaseId}</strong>
                <span className={`status ${result.status}`}>{result.status}</span>
                <span>{result.durationMs} ms</span>
                <span>{result.errorMessage ?? "-"}</span>
              </div>
            );
          })}
        </div>

        <section className="sub-grid">
          <div>
            <h3>Failure clusters</h3>
            <div className="stack">
              {clusters.length ? (
                clusters.map((cluster) => (
                  <div className="cluster" key={cluster.id}>
                    <strong>{cluster.summary}</strong>
                    <span>{cluster.size} failures</span>
                  </div>
                ))
              ) : (
                <EmptyState text="No clusters." />
              )}
            </div>
          </div>
          <div>
            <h3>AI analysis</h3>
            <div className="stack">
              {analyses.length ? analyses.map((analysis) => <AnalysisCard analysis={analysis} key={analysis.id} />) : <EmptyState text="No analysis." />}
            </div>
          </div>
        </section>
      </article>
    </section>
  );
}

function CoverageScreen({
  coveredRequirementIds,
  requirements,
  testCases
}: {
  coveredRequirementIds: Set<string>;
  requirements: Requirement[];
  testCases: TestCase[];
}) {
  const approvedByRequirement = useMemo(() => {
    const counts = new Map<string, number>();
    for (const testCase of testCases) {
      if (testCase.reviewStatus === "approved") {
        counts.set(testCase.requirementId, (counts.get(testCase.requirementId) ?? 0) + 1);
      }
    }
    return counts;
  }, [testCases]);

  return (
    <article className="panel">
      <PanelHeader title="Coverage matrix" subtitle="Requirements without approved tests are release risks." icon={<CheckCircle2 size={20} />} />
      <div className="data-table">
        <div className="table-head four">
          <span>Requirement</span>
          <span>Status</span>
          <span>Approved tests</span>
          <span>Risk</span>
        </div>
        {requirements.map((requirement) => {
          const approvedCount = approvedByRequirement.get(requirement.id) ?? 0;
          const covered = coveredRequirementIds.has(requirement.id);
          return (
            <div className="table-row four" key={requirement.id}>
              <strong>{requirement.title}</strong>
              <span className={`status ${covered ? "approved" : "rejected"}`}>{covered ? "covered" : "uncovered"}</span>
              <span>{approvedCount}</span>
              <span>{covered ? "Ready for regression" : "Needs QA review"}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ReportsScreen({
  analyses,
  clusters,
  coverageRate,
  latestRun,
  onDownload,
  summary
}: {
  analyses: AiAnalysis[];
  clusters: FailureCluster[];
  coverageRate: number;
  latestRun?: TestRun;
  onDownload: () => void;
  summary: RunSummary;
}) {
  const recommendation = summary.failed === 0 && coverageRate >= 90 ? "Go suggestion" : "Review required";

  return (
    <section className="dashboard-grid">
      <article className="panel">
        <PanelHeader title="Release report" subtitle={latestRun ? `${latestRun.buildId ?? "Build"} on ${latestRun.environment}` : "No run selected"} />
        <div className="run-list">
          <RunText label="Recommendation" value={recommendation} />
          <RunText label="Pass rate" value={`${summary.passRate}%`} />
          <RunText label="Coverage" value={`${coverageRate}%`} />
          <RunText label="Open clusters" value={clusters.length.toString()} />
        </div>
        <button className="primary-action" onClick={onDownload}>
          <Download size={18} />
          Download Excel
        </button>
      </article>

      <article className="panel">
        <PanelHeader title="Top risks" subtitle="AI summarizes the main reasons to pause release." icon={<AlertTriangle size={20} />} />
        <div className="stack">
          {clusters.length ? (
            clusters.map((cluster) => (
              <div className="cluster" key={cluster.id}>
                <strong>{cluster.summary}</strong>
                <span>{cluster.size} affected tests</span>
              </div>
            ))
          ) : (
            <EmptyState text="No failure clusters for this run." />
          )}
        </div>
      </article>

      <article className="panel wide">
        <PanelHeader title="AI release summary" subtitle="This is advisory only; final decision stays human-controlled." icon={<FlaskConical size={20} />} />
        <div className="stack">
          {analyses.length ? (
            analyses.map((analysis) => <AnalysisCard analysis={analysis} key={analysis.id} />)
          ) : (
            <EmptyState text="No failure analysis available." />
          )}
        </div>
      </article>
    </section>
  );
}

function CommentsScreen({
  body,
  comments,
  onBodyChange,
  onCreate,
  selectedRun
}: {
  body: string;
  comments: Comment[];
  onBodyChange: (value: string) => void;
  onCreate: (event: FormEvent) => void;
  selectedRun?: TestRun;
}) {
  return (
    <section className="two-column">
      <article className="panel">
        <PanelHeader title="Run thread" subtitle={selectedRun ? selectedRun.id : "No run selected"} />
        <form className="stack" onSubmit={onCreate}>
          <label>
            Comment
            <textarea value={body} onChange={(event) => onBodyChange(event.target.value)} placeholder="@developer please check this failure" />
          </label>
          <button className="primary-action" type="submit">
            <MessageSquare size={18} />
            Add comment
          </button>
        </form>
      </article>

      <article className="panel wide-list">
        <PanelHeader title="Comments" subtitle="Developers and QA can collaborate on runs and failures." />
        <div className="comment-list">
          {comments.length ? (
            comments.map((comment) => (
              <div className="comment" key={comment.id}>
                <strong>{comment.userId}</strong>
                <p>{comment.body}</p>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
            ))
          ) : (
            <EmptyState text="No comments yet." />
          )}
        </div>
      </article>
    </section>
  );
}

function AdminScreen({ projects, user }: { projects: Project[]; user: User }) {
  return (
    <section className="dashboard-grid">
      <article className="panel">
        <PanelHeader title="Current user" subtitle="Role controls available actions." icon={<Users size={20} />} />
        <div className="run-list">
          <RunText label="Name" value={user.name} />
          <RunText label="Email" value={user.email} />
          <RunText label="Role" value={user.role} />
        </div>
      </article>
      <article className="panel">
        <PanelHeader title="Demo users" subtitle="Seeded accounts for role testing." />
        <div className="run-list">
          {demoUsers.map((demoUser) => (
            <RunText key={demoUser.email} label={demoUser.role} value={demoUser.email} />
          ))}
        </div>
      </article>
      <article className="panel wide">
        <PanelHeader title="Projects" subtitle="Target applications for regression execution." />
        <div className="table-list">
          {projects.map((project) => (
            <div className="requirement-row" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.baseUrl}</p>
              </div>
              <span className="status approved">active</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function PanelHeader({ action, icon, subtitle, title }: { action?: ReactNode; icon?: ReactNode; subtitle: string; title: string }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action ?? icon}
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: "success" | "danger" | "neutral" }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RunRow({ danger, label, value }: { danger?: boolean; label: string; value: number }) {
  return (
    <div className={danger ? "run-row danger" : "run-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RunText({ label, value }: { label: string; value: string }) {
  return (
    <div className="run-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: AiAnalysis }) {
  return (
    <div className="analysis-card">
      <span className="category">{analysis.category}</span>
      <h3>{analysis.likelyCause}</h3>
      <p>Confidence: {Math.round(analysis.confidence * 100)}%</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function titleForScreen(screen: Screen) {
  const match = nav.find((item) => item.id === screen);
  return match?.label ?? "Dashboard";
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function readError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}
