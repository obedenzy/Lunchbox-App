import React, { useState } from 'react';
import { AppleIcon, LoadingIcon } from './Icons';

interface AuthFormProps {
  onSendOTP: (email: string, name?: string, mode?: 'login' | 'signup') => Promise<boolean>;
  onVerifyOTP: (otp: string) => void;
  isLoading: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSendOTP, onVerifyOTP, isLoading }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSendOTP(email, mode === 'signup' ? name : undefined, mode);
    if (success) {
      setStep('verify');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerifyOTP(otp);
    }
  };

  return (
    <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border-4 border-navy/5 w-full max-w-xl mx-auto animate-in fade-in zoom-in duration-500 text-left">
      <div className="text-center mb-12">
        <div className="inline-block p-5 bg-primary text-white rounded-3xl mb-8 shadow-2xl shadow-primary/20 hover:rotate-6 transition-transform">
          <AppleIcon />
        </div>
        <h2 className="text-5xl font-black text-navy tracking-tight">
          {step === 'request' ? (mode === 'login' ? 'Welcome Back' : 'Create Account') : 'Verify Code'}
        </h2>
        <p className="text-navy/40 font-black tracking-widest mt-4 text-xs uppercase">
          {step === 'request' 
            ? (mode === 'login' ? 'Enter email to receive your login code.' : 'Join BentoMagic for stress-free meal planning.')
            : `We've sent a 6-digit code to ${email}`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleSendRequest} className="space-y-8">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2 uppercase">Full Name</label>
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
            <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2 uppercase">Email Address</label>
            <input
              required
              type="email"
              placeholder="parent@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy placeholder-navy/20 font-black"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-navy text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-navy/20 hover:bg-primary hover:translate-y-[-4px] text-xl tracking-tight mt-6 flex justify-center items-center"
          >
            {isLoading ? <LoadingIcon /> : 'Send 6-Digit Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-navy/40 tracking-widest block mb-3 ml-2 uppercase">6-Digit Verification Code</label>
            <input
              required
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy placeholder-navy/20 font-black text-center text-4xl tracking-[0.5em]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-primary text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-primary/20 hover:bg-primary-dark hover:translate-y-[-4px] text-xl tracking-tight mt-6 flex justify-center items-center"
          >
            {isLoading ? <LoadingIcon /> : 'Verify & Continue'}
          </button>

          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full text-xs font-black text-navy/30 hover:text-primary transition-colors tracking-widest uppercase"
          >
            Change Email
          </button>
        </form>
      )}

      {step === 'request' && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs font-black text-navy/30 hover:text-primary transition-colors tracking-widest underline underline-offset-8 decoration-navy/10 uppercase"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      )}
    </div>
  );
};