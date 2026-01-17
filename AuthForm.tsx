
import React, { useState } from 'react';
import { AppleIcon } from './components/Icons';

interface AuthFormProps {
  onLogin: (email: string, pass: string) => void;
  onSignup: (name: string, email: string, pass: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onSignup }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(email, password);
    } else {
      onSignup(name, email, password);
    }
  };

  return (
    <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border-4 border-navy/5 w-full max-w-xl mx-auto animate-in fade-in zoom-in duration-500 text-left">
      <div className="text-center mb-12">
        <div className="inline-block p-5 bg-primary text-white rounded-3xl mb-8 shadow-2xl shadow-primary/20 hover:rotate-6 transition-transform">
          <AppleIcon />
        </div>
        <h2 className="text-5xl font-black text-navy tracking-tight">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-navy/40 font-black tracking-widest mt-4 text-xs">
          {mode === 'login' ? 'Sign in to access your saved lunchbox plans.' : 'Join BentoMagic for stress-free meal planning.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {mode === 'signup' && (
          <div>
            <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2">Full Name</label>
            <input
              required
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy placeholder-navy/20 font-black"
            />
          </div>
        )}
        <div>
          <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2">Email Address</label>
          <input
            required
            type="email"
            placeholder="parent@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy placeholder-navy/20 font-black"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2">Secure Password</label>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy placeholder-navy/20 font-black"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-navy text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-navy/20 hover:bg-primary hover:translate-y-[-4px] text-xl tracking-tight mt-6"
        >
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-12 text-center">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-xs font-black text-navy/30 hover:text-primary transition-colors tracking-widest underline underline-offset-8 decoration-navy/10"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};
