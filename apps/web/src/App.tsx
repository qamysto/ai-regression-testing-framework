import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Play,
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
import { analyses, clusters, currentUser, draftCases, latestRun, requirements, summary, trends } from "./sampleData";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Requirements", icon: FileText },
  { label: "Review", icon: Sparkles },
  { label: "Runs", icon: Play },
  { label: "Comments", icon: MessageSquare },
  { label: "Admin", icon: Users }
];

export function App() {
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
          {nav.map((item, index) => (
            <button className={index === 0 ? "nav-item active" : "nav-item"} key={item.label}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Regression Dashboard</h1>
            <p>AI-assisted test generation, failure analysis, coverage, and release reporting.</p>
          </div>
          <div className="user-pill">
            <span>{currentUser.name}</span>
            <strong>{currentUser.role.toUpperCase()}</strong>
          </div>
        </header>

        <section className="metrics-grid">
          <Metric title="Pass rate" value={`${summary.passRate}%`} tone="success" />
          <Metric title="Passed" value={summary.passed.toString()} tone="success" />
          <Metric title="Failed" value={summary.failed.toString()} tone="danger" />
          <Metric title="Coverage" value="68%" tone="neutral" />
        </section>

        <section className="dashboard-grid">
          <article className="panel wide">
            <div className="panel-header">
              <div>
                <h2>Quality trend</h2>
                <p>Latest builds against the staging regression suite.</p>
              </div>
              <button className="icon-button" aria-label="Run suite">
                <Play size={18} />
              </button>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="passRate" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e6e8ec" vertical={false} />
                  <XAxis dataKey="build" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[60, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="passRate" stroke="#0f766e" fill="url(#passRate)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Latest run</h2>
                <p>{latestRun.buildId} on {latestRun.environment}</p>
              </div>
              <span className="status complete">Completed</span>
            </div>
            <div className="run-list">
              <RunRow label="Total" value={summary.total} />
              <RunRow label="Passed" value={summary.passed} />
              <RunRow label="Failed" value={summary.failed} danger />
              <RunRow label="Skipped" value={summary.skipped} />
            </div>
            <button className="primary-action">
              <Download size={18} />
              Export Excel
            </button>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>AI analysis</h2>
                <p>Human review required before release decisions.</p>
              </div>
              <FlaskConical size={20} />
            </div>
            {analyses.map((analysis) => (
              <div className="analysis-card" key={analysis.id}>
                <span className="category">{analysis.category}</span>
                <h3>{analysis.likelyCause}</h3>
                <p>Confidence: {Math.round(analysis.confidence * 100)}%</p>
              </div>
            ))}
          </article>

          <article className="panel wide">
            <div className="panel-header">
              <div>
                <h2>AI draft test cases</h2>
                <p>Generated cases stay in draft until QA approves them.</p>
              </div>
              <button className="secondary-action">
                <Sparkles size={18} />
                Generate
              </button>
            </div>
            <div className="case-list">
              {draftCases.map((testCase) => (
                <div className="case-row" key={testCase.id}>
                  <div>
                    <strong>{testCase.title}</strong>
                    <span>{testCase.type} · {testCase.priority} · {testCase.reviewStatus}</span>
                  </div>
                  <div className="row-actions">
                    <button>Reject</button>
                    <button className="approve">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Failure clusters</h2>
                <p>Duplicate failures grouped by normalized signature.</p>
              </div>
              <AlertTriangle size={20} />
            </div>
            {clusters.map((cluster) => (
              <div className="cluster" key={cluster.id}>
                <strong>{cluster.summary}</strong>
                <span>{cluster.size} affected tests</span>
              </div>
            ))}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Coverage</h2>
                <p>Requirement to approved test mapping.</p>
              </div>
              <CheckCircle2 size={20} />
            </div>
            <div className="coverage-list">
              {requirements.map((requirement) => (
                <div className="coverage-row" key={requirement.id}>
                  <span>{requirement.title}</span>
                  <strong>{requirement.status === "ready" ? "Mapped" : "Uncovered"}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
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

function RunRow({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={danger ? "run-row danger" : "run-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
