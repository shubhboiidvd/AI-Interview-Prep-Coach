import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentSession } from "../features/session/selectors";
import { Link } from "react-router-dom";
export default function SummaryPage() {
  const session = useSelector(selectCurrentSession);
  const summary = session?.summary;
  if (!summary)
    return (
      <div className="rounded-2xl bg-white p-8">
        No completed session found.{" "}
        <Link className="text-emerald-700" to="/setup">
          Start a round
        </Link>
      </div>
    );
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8">
        <span className="eyebrow">
          <CheckCircle2 size={14} /> Session complete
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          A useful debrief, not just a score.
        </h1>
        <p className="mt-3 text-slate-500">
          Here is where your practice turned into a plan.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card sm:col-span-1">
          <span>Average score</span>
          <strong>
            {summary.averageScore}
            <small>/10</small>
          </strong>
        </div>
        <div className="stat-card">
          <span>Strongest area</span>
          <strong className="!text-xl">{summary.strongestArea}</strong>
        </div>
        <div className="stat-card">
          <span>Focus next</span>
          <strong className="!text-xl">{summary.weakestArea}</strong>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Your next reps</h2>
        <ul className="mt-4 space-y-3">
          {summary.improvementSuggestions.map((suggestion) => (
            <li key={suggestion} className="flex gap-3 text-sm text-slate-600">
              <CheckCircle2 className="shrink-0 text-emerald-500" size={18} />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
      <Link
        to="/setup"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
      >
        Practice again
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
