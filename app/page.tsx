'use client';

import React, { useState, useEffect } from 'react';
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
  };

  return (
    <div className="min-h-screen bg-bg-cool">
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
        <div className="flex items-center gap-8 font-black text-[10px] uppercase tracking-widest text-navy/40">
          <button onClick={() => navigateTo('home')} className={view === 'home' ? 'text-primary' : ''}>Home</button>
          <button onClick={() => navigateTo('pricing')} className={view === 'pricing' ? 'text-primary' : ''}>Pricing</button>
          {user && <span className="bg-navy text-white px-4 py-2 rounded-xl">{user.tokens} Tokens</span>}
          {user && <button onClick={handleLogout}>Logout</button>}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-20">
        {view === 'home' && (
          <div className="space-y-20">
            <header className="text-center space-y-4">
              <h1 className="text-7xl font-black text-navy tracking-tighter">Healthy Kids Lunch Plans</h1>
              <p className="text-navy/40 font-bold uppercase tracking-widest text-sm">Wholesome and easy-to-prep ideas.</p>
            </header>
            <div className="max-w-4xl mx-auto">
              {user ? <InputForm onSubmit={handleGenerate} isLoading={loading} /> : <AuthForm onLogin={handleLogin} onSignup={handleSignup} />}
            </div>
            {plan && (
              <div className="space-y-20">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
                  <LunchCard key={day} day={day} data={plan[day]} />
                ))}
              </div>
            )}
          </div>
        )}
        {view === 'pricing' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10">
            {TOKEN_PACKS.map(pack => (
              <div key={pack.priceId} className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 text-center space-y-8">
                <div className="text-6xl">{pack.icon}</div>
                <h3 className="text-2xl font-black">{pack.label}</h3>
                <div className="text-4xl font-black text-primary">{pack.price}</div>
                <button onClick={() => { setSelectedPack(pack); setView('payment'); }} className="w-full bg-navy text-white py-4 rounded-2xl font-black uppercase tracking-widest">Select</button>
              </div>
            ))}
          </div>
        )}
        {view === 'payment' && selectedPack && (
          <StripeCheckout tokens={selectedPack.tokens} amount={selectedPack.price} label={selectedPack.label} onCancel={() => setView('pricing')} />
        )}
      </main>
    </div>
  );
}