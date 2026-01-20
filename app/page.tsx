'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyPlan, User } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CheckIcon, CreditCardIcon } from '../components/Icons';

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

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [currentProfileDraft, setCurrentProfileDraft] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WeeklyPlan[]>([]);
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'saved'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPack, setSelectedPack] = useState<TokenPack | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedUser = localStorage.getItem('bento_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('bento_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bento_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    setToast({ message: "Welcome back!", type: 'success' });
  };

  const handleSignup = (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      tokens: 5,
      isLoggedIn: true,
      savedPlans: [],
      defaultSettings: { childAge: 6, dietType: 'Omnivore' },
      stats: { totalPlansGenerated: 0, joinedDate: new Date().toLocaleDateString() }
    };
    setUser(newUser);
    setToast({ message: "Welcome to BentoMagic!", type: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bento_user');
    setPlan(null);
    setView('home');
    setToast({ message: "Signed out.", type: 'success' });
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
      setToast({ message: "Plan generated!", type: 'success' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (v: View) => {
    setView(v);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSavePlan = (planId: string) => {
    if (!user) return;
    const currentSaved = user.savedPlans || [];
    const isSaved = currentSaved.includes(planId);
    const newSaved = isSaved ? currentSaved.filter(id => id !== planId) : [...currentSaved, planId];
    setUser({ ...user, savedPlans: newSaved });
  };

  const isPlanSaved = (planId: string) => user?.savedPlans?.includes(planId) || false;

  const renderHome = () => (
    <div className="space-y-12 md:space-y-24 px-4">
      <section className="max-w-4xl mx-auto no-print">
        {user ? (
          <InputForm onSubmit={handleGenerate} isLoading={loading} initialProfile={currentProfileDraft} />
        ) : (
          <AuthForm onLogin={handleLogin} onSignup={handleSignup} />
        )}
        {error && (
          <div className="mt-8 p-6 bg-primary/10 border border-primary/20 text-primary-dark rounded-2xl text-center text-sm font-black animate-pulse">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <div className="max-w-4xl mx-auto py-24 flex flex-col items-center animate-pulse">
          <div className="w-20 h-20 border-8 border-navy/5 border-t-primary rounded-full animate-spin mb-8"></div>
          <h3 className="text-2xl font-black text-navy mb-2">Designing Your Child's Next Favorite Lunch</h3>
          <p className="text-navy/40 font-black tracking-widest text-xs uppercase">Curating ingredients & generating AI photography...</p>
        </div>
      )}

      {plan && !loading && (
        <section className="space-y-12 md:space-y-16 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 no-print border-b-8 border-navy/5 pb-12">
            <div className="space-y-2 text-left">
              <p className="text-primary font-black text-xs tracking-widest uppercase">{plan.weekLabel}</p>
              <h2 className="text-4xl md:text-6xl font-black text-navy tracking-tight">Your Weekly Menu</h2>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={() => toggleSavePlan(plan.id)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all text-sm tracking-wide border-4 ${
                  isPlanSaved(plan.id) 
                    ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30' 
                    : 'bg-white border-navy text-navy hover:bg-navy hover:text-white'
                }`}
              >
                {isPlanSaved(plan.id) ? 'Saved' : 'Save Plan'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-navy text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wide hover:bg-navy/90 transition-all shadow-xl"
              >
                <PrintIcon />
                Print
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-12 md:gap-24 pb-20">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
              <LunchCard key={day} day={day} data={plan[day]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-6xl mx-auto space-y-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-navy/5 pb-10">
        <div className="space-y-2 text-left">
          <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tight">Your History</h2>
          <p className="text-navy/40 font-black text-xs uppercase tracking-widest">Access your past lunch plans</p>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-navy/5">
          <h3 className="text-2xl font-black text-navy mb-4">No plans yet</h3>
          <button onClick={() => navigateTo('home')} className="mt-10 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase">Go Home</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {history.map(h => (
            <div key={h.id} className="bg-white p-8 rounded-[2rem] border-4 border-navy/5 hover:border-primary/20 transition-all cursor-pointer" onClick={() => { setPlan(h); navigateTo('home'); }}>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{h.weekLabel}</span>
              <h4 className="text-xl font-black text-navy mt-4 mb-4">{h.Monday.name}</h4>
              <div className="text-navy/40 text-[10px] font-black uppercase tracking-widest">
                {h.profile.age} Years • {h.profile.dietType}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto space-y-24 px-4">
      <div className="text-center space-y-6">
        <h2 className="text-5xl md:text-7xl font-black text-navy tracking-tight">Fuel Your Planning</h2>
        <p className="text-navy/40 font-bold max-w-xl mx-auto uppercase tracking-widest text-xs">Credits are only consumed on successful generation.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TOKEN_PACKS.map(pack => (
          <div key={pack.priceId} className={`bg-white p-12 rounded-[3rem] border-4 text-center space-y-8 ${pack.popular ? 'border-primary shadow-2xl scale-105' : 'border-navy/5'}`}>
            <div className="text-6xl">{pack.icon}</div>
            <h3 className="text-2xl font-black text-navy">{pack.label}</h3>
            <div className="text-4xl font-black text-primary">{pack.price}</div>
            <button onClick={() => { setSelectedPack(pack); setView('payment'); }} className="w-full bg-navy text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all">Select</button>
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

      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-3xl border-b-4 border-navy/5 h-24 flex items-center justify-between px-10 no-print">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="p-3 bg-primary text-white rounded-2xl shadow-xl"><AppleIcon /></div>
          <span className="text-2xl font-black text-navy">BentoMagic</span>
        </div>
        <div className="flex items-center gap-8 font-black text-[10px] uppercase tracking-widest text-navy/40">
          <button onClick={() => navigateTo('home')} className={view === 'home' ? 'text-primary' : ''}>Home</button>
          <button onClick={() => navigateTo('pricing')} className={view === 'pricing' ? 'text-primary' : ''}>Pricing</button>
          {user && <button onClick={() => navigateTo('history')} className={view === 'history' ? 'text-primary' : ''}>History</button>}
          {user && <span className="bg-navy text-white px-4 py-2 rounded-xl">{user.tokens} Tokens</span>}
          {user && <button onClick={handleLogout}>Logout</button>}
        </div>
      </nav>

      <header className="max-w-7xl mx-auto pt-20 md:pt-40 pb-16 md:pb-32 text-center no-print px-6">
        <div className="inline-block px-8 py-3 bg-secondary/10 text-secondary-dark rounded-full text-[10px] font-black tracking-[0.3em] mb-12 border-4 border-secondary/20 uppercase">
          BentoMagic Magic AI Engine
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-navy mb-12 tracking-tighter">
          Healthy Kids Lunch Plans
        </h1>
        <p className="text-navy/40 font-bold tracking-widest text-xs md:text-sm max-w-xl mx-auto uppercase leading-loose">
          Wholesome, delicious, and easy-to-prep lunch box ideas tailored for growing kids.
        </p>
      </header>

      <main className="flex-1 pb-32">
        {view === 'home' && renderHome()}
        {view === 'history' && renderHistory()}
        {view === 'pricing' && renderPricing()}
        {view === 'payment' && selectedPack && (
          <StripeCheckout tokens={selectedPack.tokens} amount={selectedPack.price} label={selectedPack.label} onCancel={() => setView('pricing')} />
        )}
      </main>
    </div>
  );
}