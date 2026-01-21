'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserProfile, WeeklyPlan, User } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CheckIcon } from '../components/Icons';

type View = 'home' | 'history' | 'profile' | 'pricing' | 'payment' | 'nutrition' | 'contact';

interface TokenPack {
  tokens: number;
  price: string;
  priceId: string;
  label: string;
  icon: string;
  popular?: boolean;
}

const TOKEN_PACKS: TokenPack[] = [
  { tokens: 5, price: '$4.99', priceId: 'price_snack', label: 'Snack Pack', icon: '⚡' },
  { tokens: 15, price: '$9.99', priceId: 'price_bundle', label: 'Bento Bundle', icon: '🍱', popular: true },
  { tokens: 50, price: '$24.99', priceId: 'price_chef', label: 'Master Chef', icon: '🏆' }
];

function PageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [history, setHistory] = useState<WeeklyPlan[]>([]);
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPack, setSelectedPack] = useState<TokenPack | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const loadUser = () => {
      const savedUser = localStorage.getItem('bento_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    
    loadUser();

    // Handle payment success redirect
    const viewParam = searchParams.get('view') as View;
    const paymentParam = searchParams.get('payment');
    
    if (viewParam) setView(viewParam);
    if (paymentParam === 'success') {
      loadUser(); // Reload user to get updated tokens
      setToast({ message: "Credits updated successfully!", type: 'success' });
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted && user) localStorage.setItem('bento_user', JSON.stringify(user));
  }, [user, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('bento_history', JSON.stringify(history));
  }, [history, mounted]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!mounted) return null;

  const handleLogin = (email: string, pass: string) => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Bento Parent',
      email: email,
      tokens: 10,
      isLoggedIn: true,
      savedPlans: [],
      defaultSettings: { childAge: 6, dietType: 'Omnivore' },
      stats: { totalPlansGenerated: 0, joinedDate: new Date().toLocaleDateString() }
    };
    setUser(mockUser);
  };

  const handleSignup = (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name, email: email, tokens: 5, isLoggedIn: true, savedPlans: [],
      defaultSettings: { childAge: 6, dietType: 'Omnivore' },
      stats: { totalPlansGenerated: 0, joinedDate: new Date().toLocaleDateString() }
    };
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bento_user');
    setPlan(null);
    setView('home');
  };

  const handleGenerate = async (profile: UserProfile) => {
    if (!user || user.tokens <= 0) {
      setError("Insufficient tokens.");
      setView('pricing');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error("Generation failed.");
      const rawPlan = await response.json();
      const generatedPlan: WeeklyPlan = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        weekLabel: profile.targetWeek,
        profile: profile,
        ...rawPlan
      };
      setPlan(generatedPlan);
      setHistory(prev => [generatedPlan, ...prev]);
      setUser(prev => prev ? ({ ...prev, tokens: prev.tokens - 1 }) : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderHome = () => (
    <div className="space-y-12 md:space-y-24 px-4">
      <header className="text-center no-print">
        <h1 className="text-6xl md:text-8xl font-black text-navy mb-12 tracking-tighter">Healthy Kids Lunch Plans</h1>
        <p className="text-navy/40 font-bold tracking-widest text-xs uppercase">Wholesome ideas tailored for growing kids.</p>
      </header>
      <section className="max-w-4xl mx-auto">
        {!user ? <AuthForm onLogin={handleLogin} onSignup={handleSignup} /> : <InputForm onSubmit={handleGenerate} isLoading={loading} />}
        {error && <div className="mt-8 p-6 bg-primary/10 text-primary-dark rounded-2xl text-center font-black">{error}</div>}
      </section>
      {loading && <div className="py-24 text-center space-y-4"><div className="w-16 h-16 border-4 border-navy/5 border-t-primary rounded-full animate-spin mx-auto"></div><p className="text-navy/40 font-black uppercase text-xs">Generating Plan...</p></div>}
      {plan && !loading && (
        <div className="flex flex-col gap-12 md:gap-24 pb-20 max-w-6xl mx-auto">
          {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
            <LunchCard key={day} day={day} data={plan[day]} />
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-12">
      <h2 className="text-5xl font-black text-navy text-left">Your History</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {history.map(h => (
          <div key={h.id} className="bg-white p-8 rounded-[2rem] border-4 border-navy/5 cursor-pointer hover:border-primary/20 transition-all" onClick={() => { setPlan(h); setView('home'); }}>
            <span className="text-[10px] font-black text-primary uppercase">{h.weekLabel}</span>
            <h4 className="text-xl font-black mt-2">{h.Monday.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl text-left space-y-8">
        <div className="flex items-center gap-8 border-b-4 border-bg-cool pb-8">
          <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"><UserIcon className="w-10 h-10" /></div>
          <div>
            <h2 className="text-4xl font-black text-navy">{user?.name}</h2>
            <p className="text-navy/40 font-black uppercase text-[10px]">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-bg-cool p-8 rounded-2xl">
            <p className="text-[10px] font-black text-navy/40 uppercase mb-2">Available Credits</p>
            <p className="text-4xl font-black text-navy">{user?.tokens} Tokens</p>
          </div>
          <button onClick={() => navigateTo('pricing')} className="bg-navy text-white p-8 rounded-2xl font-black uppercase text-xs hover:bg-primary transition-all">Buy More Credits</button>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-20">
      <h2 className="text-6xl font-black text-navy text-center">Fuel Your Planning</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TOKEN_PACKS.map(pack => (
          <div key={pack.priceId} className={`bg-white p-12 rounded-[3rem] border-4 text-center space-y-8 ${pack.popular ? 'border-primary shadow-2xl scale-105' : 'border-navy/5'}`}>
            <div className="text-6xl">{pack.icon}</div>
            <h3 className="text-2xl font-black">{pack.label}</h3>
            <div className="text-4xl font-black text-primary">{pack.price}</div>
            <button onClick={() => { setSelectedPack(pack); setView('payment'); }} className="w-full bg-navy text-white py-4 rounded-2xl font-black uppercase tracking-widest">Select</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-cool">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 rounded-3xl shadow-2xl font-black bg-white border-4 border-primary text-primary">
          {toast.message}
        </div>
      )}
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-3xl border-b-4 border-navy/5 h-24 flex items-center justify-between px-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="p-3 bg-primary text-white rounded-2xl shadow-xl"><AppleIcon /></div>
          <span className="text-2xl font-black text-navy">BentoMagic</span>
        </div>
        <div className="flex items-center gap-6 md:gap-8 font-black text-[10px] uppercase tracking-widest text-navy/40">
          <button onClick={() => navigateTo('home')} className={view === 'home' ? 'text-primary' : ''}>Home</button>
          <button onClick={() => navigateTo('pricing')} className={view === 'pricing' ? 'text-primary' : ''}>Pricing</button>
          {user && (
            <>
              <button onClick={() => navigateTo('history')} className={view === 'history' ? 'text-primary' : ''}>History</button>
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all border-2 ${view === 'profile' ? 'bg-primary text-white border-primary' : 'bg-bg-cool text-navy border-transparent hover:border-primary/20'}`}>
                <UserIcon className="w-6 h-6" />
              </div>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </nav>
      <main className="flex-1 pb-32 pt-12">
        {view === 'home' && renderHome()}
        {view === 'history' && renderHistory()}
        {view === 'profile' && renderProfile()}
        {view === 'pricing' && renderPricing()}
        {view === 'payment' && selectedPack && (
          <StripeCheckout tokens={selectedPack.tokens} amount={selectedPack.price} label={selectedPack.label} onCancel={() => setView('pricing')} />
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-cool" />}>
      <PageContent />
    </Suspense>
  );
}