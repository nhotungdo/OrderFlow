import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/authApi';

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('alice@orderflow.dev');
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
    if (email.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/products');
    }
  };

  const mockUsers = authApi.getMockUsers();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isRegister ? 'Create OrderFlow Account' : 'Sign in to OrderFlow'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Demo testing suite with pre-configured role profiles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="you@domain.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              defaultValue="password123"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
        >
          <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Test Role Switcher for Interviewers */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Login for Demo / Interview:</span>
        </div>
        <div className="space-y-2">
          {mockUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setEmail(u.email);
                login(u.email);
                if (u.role === 'Admin') navigate('/admin');
                else navigate('/products');
              }}
              className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
                <div>
                  <div className="text-xs font-medium text-slate-200">{u.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  u.role === 'Admin'
                    ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50'
                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                }`}
              >
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-xs text-slate-400 hover:text-white transition"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};
