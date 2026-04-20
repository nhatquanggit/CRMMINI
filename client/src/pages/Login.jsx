import { useState } from 'react';
import {
  ArrowLeft,
  AtSign,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginApi, registerApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const initialRegister = { name: '', email: '', password: '', role: 'SALES' };
const initialLogin = { email: '', password: '' };

const brandStats = [
  { icon: Users, label: '1,000+ Teams', sub: 'dang su dung' },
  { icon: BarChart3, label: '5,000+ Deals', sub: 'duoc quan ly' },
  { icon: ShieldCheck, label: '99.9% Uptime', sub: 'dam bao' },
];

function InputField({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, required, rightSlot }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon className="h-4 w-4" />
        </span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
        />
        {rightSlot && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const query = new URLSearchParams(location.search);
  const initialMode = query.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const targetPath = location.state?.from || '/app/dashboard';

  const onChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginApi(loginForm);
      setAuth(result);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Dang nhap that bai. Kiem tra lai email va mat khau.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await registerApi(registerForm);
      setAuth(result);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Dang ky that bai. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  const eyeButton = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPass((v) => !v)}
      className="text-slate-400 transition hover:text-slate-700"
    >
      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      {/* ── Left Brand Panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[55%]">
        <img
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=85"
          alt="CRM workspace"
          className="h-full w-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/92 via-slate-900/75 to-cyan-900/80" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg">
              <LayoutDashboard className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">CRM Mini</span>
          </Link>

          {/* Center headline */}
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Modern Sales Platform
            </p>
            <h2 className="max-w-sm text-3xl font-bold leading-snug tracking-tight text-white xl:text-4xl">
              Quan ly toan bo quy trinh ban hang trong mot he thong
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300/90">
              Tu lead generation den deal closing — CRM Mini giup team ban hang hoat dong thong minh hon, nhanh hon.
            </p>

            {/* Stats row */}
            <div className="mt-8 flex gap-5">
              {brandStats.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial quote */}
          <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <p className="text-sm leading-6 text-slate-300">
              "CRM Mini giup chung toi tang win rate len 40% chi sau 2 thang trien khai. Dashboard truc quan, de van hanh hon bao gio het."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src="https://i.pravatar.cc/40?img=57"
                alt="Hoang Nam"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
              <div>
                <p className="text-sm font-semibold text-white">Hoang Nam</p>
                <p className="text-xs text-slate-400">Founder, OrbitOps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex flex-1 flex-col bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgba(34,211,238,0.09),transparent),linear-gradient(180deg,#f8fafc,#ffffff)]">
        {/* Top bar mobile */}
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">CRM Mini</span>
          </Link>
        </div>

        {/* Back link (desktop) */}
        <div className="hidden lg:block px-10 pt-8 xl:px-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ve trang chu
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {mode === 'login' ? 'Chao mung tro lai 👋' : 'Tao tai khoan moi'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {mode === 'login'
                  ? 'Dang nhap de tiep tuc vao workspace cua ban'
                  : 'Bat dau mien phi, khong can the tin dung'}
              </p>
            </div>

            {/* Mode switcher */}
            <div className="mb-7 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100/80 p-1">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); }}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Dang nhap' : 'Dang ky'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form className="space-y-4" onSubmit={submitLogin}>
                <InputField
                  label="Email"
                  icon={AtSign}
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={onChange(setLoginForm)}
                  placeholder="ban@congty.com"
                  required
                />
                <InputField
                  label="Mat khau"
                  icon={KeyRound}
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={loginForm.password}
                  onChange={onChange(setLoginForm)}
                  placeholder="••••••••"
                  required
                  rightSlot={eyeButton}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Dang xu ly...</>
                  ) : (
                    'Dang nhap'
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form className="space-y-4" onSubmit={submitRegister}>
                <InputField
                  label="Ho ten"
                  icon={User}
                  name="name"
                  value={registerForm.name}
                  onChange={onChange(setRegisterForm)}
                  placeholder="Nguyen Van A"
                  required
                />
                <InputField
                  label="Email"
                  icon={AtSign}
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={onChange(setRegisterForm)}
                  placeholder="ban@congty.com"
                  required
                />
                <InputField
                  label="Mat khau"
                  icon={KeyRound}
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={registerForm.password}
                  onChange={onChange(setRegisterForm)}
                  placeholder="Toi thieu 8 ky tu"
                  required
                  rightSlot={eyeButton}
                />

                {/* Role selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Vai tro
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['SALES', 'ADMIN'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegisterForm((prev) => ({ ...prev, role: r }))}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          registerForm.role === r
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
                          registerForm.role === r ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'
                        }`}>
                          {registerForm.role === r && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </span>
                        {r === 'SALES' ? 'Sales' : 'Admin'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Dang xu ly...</>
                  ) : (
                    'Tao tai khoan'
                  )}
                </button>
              </form>
            )}

            {/* Switch mode hint */}
            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' ? 'Chua co tai khoan? ' : 'Da co tai khoan? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="font-semibold text-cyan-700 underline-offset-2 transition hover:underline"
              >
                {mode === 'login' ? 'Dang ky mien phi' : 'Dang nhap ngay'}
              </button>
            </p>

            {/* Back to home (mobile) */}
            <div className="mt-8 flex justify-center lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Ve trang chu
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="pb-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CRM Mini · Built for modern sales teams
        </p>
      </div>
    </div>
  );
}

export default Login;
