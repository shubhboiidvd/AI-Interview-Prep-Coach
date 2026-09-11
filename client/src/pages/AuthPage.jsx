import { useState } from "react";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../features/auth/authSlice";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, status, error } = useSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    const action =
      mode === "login" ?
        loginUser({ email: form.email, password: form.password })
      : registerUser(form);
    const result = await dispatch(action);
    if (!result.error) navigate("/dashboard");
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#102a2b] px-5 py-10 text-slate-100">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl md:grid-cols-[1fr_1.1fr]">
        <section className="hidden bg-emerald-300 p-10 md:block">
          <BrainCircuit size={38} />
          <p className="mt-20 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-950">
            Interview practice, made useful
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight">
            Turn nerves into next steps.
          </h1>
          <p className="mt-6 max-w-xs text-emerald-950/70">
            Practice with an adaptive coach, get specific feedback, and watch
            your confidence compound.
          </p>
        </section>
        <section className="p-7 sm:p-10">
          <div className="mb-10">
            <span className="text-sm font-semibold text-emerald-600">
              PREPWISE
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your coach"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "login" ?
                "Your next strong answer starts here."
              : "A focused practice loop for your next interview."}
            </p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "register" && (
              <label className="block text-sm font-medium">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="field"
                  placeholder="Jordan Lee"
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="field"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                required
                minLength="8"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                className="field"
                placeholder="8+ characters"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}
            <button
              disabled={status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {status === "loading" ?
                "Working..."
              : mode === "login" ?
                "Sign in"
              : "Create account"}
              <ArrowRight size={17} />
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-6 text-sm text-slate-500 hover:text-slate-900"
          >
            {mode === "login" ?
              "New here? Create an account"
            : "Already have an account? Sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}
