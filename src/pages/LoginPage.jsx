import { useState,useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icons from '../components/Icons';
 
const API_BASE = process.env.REACT_APP_API_BASE_URL || '';
 
const LoginPage = ({ onLogin, onForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  // First-login password change state
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState("");


  useEffect(() => {
  const storedUser = sessionStorage.getItem("user");

  if (storedUser) {
    const user = JSON.parse(storedUser);
    onLogin(user);   // go directly to dashboard
  }
}, [onLogin]);
 
  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and Password are required');
      return;
    }
 
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth_login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
 
      if (res.ok && data?.ok) {
 const user = data.user;

// Create session object
const sessionUser = {
  id: user.id,
  clinic_id: user.clinic_id,
  clinic_name: user.clinic_name,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  last_login: user.last_login
};

// Save in session
sessionStorage.setItem("user", JSON.stringify(sessionUser));
        // First login — last_login is null → force password change
        if (!user.last_login) {
          setPendingUser(user);
          setShowSetPassword(true);
          setPassword('');
        } else {
          setPassword('');
          onLogin(user);
        }
      } else {
        setPassword('');
        setError(data?.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error', err);
      setPassword('');
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  
 
  const handleSetPassword = async () => {
    setPassError('');
    if (!newPass || !confirmPass) {
      setPassError('Both fields are required');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match');
      return;
    }
 
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth_set_password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: pendingUser.id, new_password: newPass }),
      });
      const data = await res.json();
 
     if (res.ok && data?.ok) {

  // ✅ Save session
  const sessionUser = {
  id: pendingUser.id,
  clinic_id: pendingUser.clinic_id,
  clinic_name: pendingUser.clinic_name,
  full_name: pendingUser.full_name,
  email: pendingUser.email,
  role: pendingUser.role,
  last_login: pendingUser.last_login
};

sessionStorage.setItem("user", JSON.stringify(sessionUser));

  setShowSetPassword(false);
  setNewPass('');
  setConfirmPass('');
  onLogin(pendingUser);

      } else {
        setPassError(data?.detail || 'Failed to set password. Try again.');
      }
    } catch (err) {
      console.error('Set password error', err);
      setPassError('Server error. Please try again.');
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
 
      {/* ── Set Password Modal (first login) ────────────────────────── */}
      {showSetPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}>
                <Icons.Settings />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Set Your Password</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Welcome, <strong>{pendingUser?.full_name}</strong>! Since this is your first login, please set a new password.
            </p>
 
            {passError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <Icons.AlertTriangle />{passError}
              </div>
            )}
 
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all pr-12"
                  />
                  <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPass ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all pr-12"
                  />
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPass ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleSetPassword}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm flex items-center justify-center gap-2"
                style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #0E6C68, #14A3A0)" }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Setting password...</>
                ) : "Set Password & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
 
    </div>
  );
};
 
 
 
export default LoginPage;
 