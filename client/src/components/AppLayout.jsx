import { BarChart3, LogOut, Sparkles } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function AppLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const signOut = () => {
    dispatch(logout());
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-[#f6f7f2] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950">
              <Sparkles size={18} />
            </span>
            Prepwise
          </NavLink>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              to="/dashboard"
            >
              Dashboard
            </NavLink>
            <NavLink
              className="rounded-lg bg-slate-950 px-3 py-2 text-white hover:bg-slate-800"
              to="/setup"
            >
              New interview
            </NavLink>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
              className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <LogOut size={17} />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Welcome back, {user?.name || "candidate"}
            </p>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
