import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENT_USER } from '../data/mockData';
import Icons from '../components/Icons';
import { Badge, Btn, Input, Toast, PageHeader } from '../components/UI';

const LoginPage = ({ onLogin, onForgot }) => {
  const [email, setEmail] = useState("admin@clinicos.com");
  const [password, setPassword] = useState("password123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_BASE_URL = "http://127.0.0.1:5020";

 const handleLogin = async () => {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(`${API_BASE_URL}/auth_login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed");
    }

    // store user info
    localStorage.setItem("user", JSON.stringify(data.user));

    // call parent login handler
    onLogin(data.user);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFA" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ background: "linear-gradient(145deg, #0A5955 0%, #0E6C68 40%, #14A3A0 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Icons.Activity />
          </div>
          <span className="text-2xl font-bold text-white">ClinicOS</span>
        </div>
        <div>
          <div className="w-20 h-1 bg-white/30 rounded-full mb-8"></div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Modern Healthcare<br />Management Platform
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Manage patients, appointments, billing, and revenue — all in one intelligent clinic platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[["1,842", "Patients"], ["24", "Daily Apts"], ["₹2.1L", "Monthly Rev"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-white/50 text-sm">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {["HIPAA Compliant", "256-bit Encrypted", "99.9% Uptime"].map(t => (
            <span key={t} className="px-3 py-1.5 bg-white/10 rounded-full text-white/70 text-xs font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}>
              <Icons.Activity />
            </div>
            <span className="text-xl font-bold" style={{ color: "#0E6C68" }}>ClinicOS</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to your clinic dashboard</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <Icons.AlertTriangle />{error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@clinic.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <button onClick={onForgot} className="text-xs font-medium" style={{ color: "#0E6C68" }}>Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all pr-12"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded" defaultChecked />
              <label htmlFor="remember" className="text-sm text-slate-600">Remember me for 30 days</label>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm flex items-center justify-center gap-2"
              style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #0E6C68, #14A3A0)" }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Signing in...</>
              ) : "Sign in to ClinicOS"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">Don't have access? </span>
            <button className="text-sm font-semibold" style={{ color: "#0E6C68" }}>Request access →</button>
          </div>
        </div>
      </div>
    </div>
  );
};



export default LoginPage;
