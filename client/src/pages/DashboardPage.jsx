import { useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Target } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetDashboardStatsQuery,
  useGetSessionsQuery,
} from "../features/dashboard/dashboardApiSlice";

function formatDateTime(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status) {
  return status === "in-progress" ? "In progress" : "Completed";
}

export default function DashboardPage() {
  const [role, setRole] = useState("All roles");
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useGetSessionsQuery();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const roles = [
    "All roles",
    ...new Set(sessions.map((session) => session.role)),
  ];
  const filtered = sessions.filter(
    (session) => role === "All roles" || session.role === role,
  );
  const trend =
    stats?.scoreTrend?.map((item) => ({
      ...item,
      label: new Date(item.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      fullDate: formatDateTime(item.date),
    })) || [];
  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">
            <Activity size={14} /> Your progress
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Practice with a little more signal.
          </h1>
          <p className="mt-3 text-slate-500">
            Small improvements become obvious when you keep the loop moving.
          </p>
        </div>
        <Link
          to="/setup"
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
        >
          New interview
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <span>
            <Target size={15} /> Average score
          </span>
          <strong>
            {statsLoading ? "—" : `${stats?.averageScore || 0}/10`}
          </strong>
        </div>
        <div className="stat-card">
          <span>
            <CalendarDays size={15} /> Total sessions
          </span>
          <strong>{statsLoading ? "—" : stats?.totalSessions}</strong>
        </div>
        <div className="stat-card">
          <span>Completed rounds</span>
          <strong>{statsLoading ? "—" : stats?.completedSessions}</strong>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Score trend</h2>
              <p className="text-sm text-slate-500">
                Average score per completed round
              </p>
            </div>
          </div>
          <div className="h-64">
            {trend.length ?
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.fullDate || _label
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            : <div className="grid h-full place-items-center text-sm text-slate-400">
                Complete a session to see your trend.
              </div>
            }
          </div>
        </div>
        <div className="rounded-3xl bg-[#102a2b] p-6 text-white">
          <h2 className="font-semibold">Keep the momentum</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            The best practice session is the one you can describe clearly
            afterward.
          </p>
          <Link
            to="/setup"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-300"
          >
            Start a round <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-semibold">Recent sessions</h2>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {roles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {sessionsLoading ?
          <p className="text-sm text-slate-500">Loading sessions...</p>
        : sessionsError ?
          <p className="text-sm text-rose-600">
            Could not load session history.
          </p>
        : filtered.length ?
          <div className="divide-y divide-slate-100">
            {filtered.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium">{session.role}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {session.difficulty} · {session.interviewType}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Started {formatDateTime(session.createdAt)}
                    {session.completedAt &&
                      ` · Finished ${formatDateTime(session.completedAt)}`}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {(
                    session.summary?.averageScore !== null &&
                    session.summary?.averageScore !== undefined
                  ) ?
                    `${session.summary.averageScore}/10`
                  : formatStatus(session.status)}
                </span>
              </div>
            ))}
          </div>
        : <p className="text-sm text-slate-500">
            Your first practice round is waiting.
          </p>
        }
      </div>
    </section>
  );
}
