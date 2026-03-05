import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENT_USER } from '../data/mockData';
import Icons from '../components/Icons';
import { Badge, Btn, Input, Toast, PageHeader } from '../components/UI';

const ForgotPasswordPage = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#F8FAFA" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}>
            <Icons.Activity />
          </div>
          <span className="text-xl font-bold" style={{ color: "#0E6C68" }}>ClinicOS</span>
        </div>
        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h2>
            <p className="text-slate-500 mb-8">We'll send a reset link to your email address</p>
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="your@clinic.com" />
            <button
              onClick={() => setSent(true)}
              className="w-full py-3.5 rounded-xl font-semibold text-white mt-4 transition-all"
              style={{ background: "linear-gradient(135deg, #0E6C68, #14A3A0)" }}
              disabled={!email}
            >
              Send Reset Link
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icons.Check />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Email Sent!</h2>
            <p className="text-slate-500">We've sent a password reset link to <strong>{email}</strong></p>
          </div>
        )}
        <button onClick={onBack} className="w-full text-center text-sm mt-4 font-medium" style={{ color: "#0E6C68" }}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EMPLOYEE PROFILE PAGE
// ============================================================


export default ForgotPasswordPage;
