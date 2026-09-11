import { useState } from "react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { startSession } from "../features/session/sessionSlice";

const options = {
  difficulty: ["Junior", "Mid", "Senior"],
  interviewType: ["Technical", "Behavioral", "Mixed"],
  questionCount: [5, 10, 15],
  provider: ["openai", "anthropic", "gemini"],
};
export default function SetupPage() {
  const [form, setForm] = useState({
    role: "Frontend Engineer",
    customRole: "",
    difficulty: "Mid",
    interviewType: "Mixed",
    questionCount: 5,
    provider: "openai",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.session);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(
      startSession({
        ...form,
        role: form.customRole.trim() || form.role,
        questionCount: Number(form.questionCount),
      }),
    );
    if (!result.error) navigate("/interview");
  };
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8">
        <span className="eyebrow">
          <SlidersHorizontal size={14} /> Session setup
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Make the practice round yours.
        </h1>
        <p className="mt-3 max-w-xl text-slate-500">
          Choose a role, tune the difficulty, and let your coach build the
          questions around your goals.
        </p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="label sm:col-span-2">
            Role
            <select
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              className="field"
            >
              {[
                "Frontend Engineer",
                "Backend Engineer",
                "Product Manager",
                "Data Scientist",
                "UX Designer",
                "Engineering Manager",
              ].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="label sm:col-span-2">
            Custom role
            <input
              value={form.customRole}
              onChange={(event) => update("customRole", event.target.value)}
              className="field"
              placeholder="Optional: e.g. AI Platform Engineer"
            />
          </label>
          <label className="label">
            Difficulty
            <select
              value={form.difficulty}
              onChange={(event) => update("difficulty", event.target.value)}
              className="field"
            >
              {options.difficulty.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Interview type
            <select
              value={form.interviewType}
              onChange={(event) => update("interviewType", event.target.value)}
              className="field"
            >
              {options.interviewType.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <p className="label">Number of questions</p>
          <div className="grid grid-cols-3 gap-3">
            {options.questionCount.map((count) => (
              <button
                type="button"
                key={count}
                onClick={() => update("questionCount", count)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${form.questionCount === count ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 hover:border-slate-400"}`}
              >
                {count} questions
              </button>
            ))}
          </div>
        </div>
        <label className="label">
          Coach model
          <select
            value={form.provider}
            onChange={(event) => update("provider", event.target.value)}
            className="field"
          >
            {options.provider.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {status === "loading" ? "Building your round..." : "Start interview"}
          <ChevronRight size={18} />
        </button>
      </form>
    </section>
  );
}
