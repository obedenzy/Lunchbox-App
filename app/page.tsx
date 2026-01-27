'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserProfile, WeeklyPlan, User, Child } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { ChildManager } from '../components/ChildManager';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CheckIcon, CreditCardIcon } from '../components/Icons';

type View = 'home' | 'history' | 'profile' | 'pricing' | 'payment' | 'faq' | 'about' | 'privacy' | 'status' | 'api';

function PageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [history, setHistory] = useState<WeeklyPlan[]>([]);
  const [view, setView] = useState<View>('home');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'saved'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [currentFormState, setCurrentFormState] = useState<UserProfile | null>(null);

  // Profile Edit States
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const loadUser = () => {
      const savedUser = localStorage.getItem('bento_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (!parsed.children) parsed.children = [];
        setUser(parsed);
        setEditName(parsed.name);
      }
    };
    loadUser();

    const viewParam = searchParams.get('view') as View;
    if (viewParam) setView(viewParam);
  }, [searchParams]);

  useEffect(() => {
    if (mounted && user) localStorage.setItem('bento_user', JSON.stringify(user));
  }, [user, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('bento_history', JSON.stringify(history));
  }, [history, mounted]);

  if (!mounted) return null;

  const handleLogin = (email: string, pass: string) => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Bento Parent', email, tokens: 10, isLoggedIn: true, children: [], savedPlans: [],
    };
    setUser(mockUser);
  };

  const toggleSavePlan = (planId: string) => {
    if (!user) return;
    const currentSaved = user.savedPlans || [];
    const isSaved = currentSaved.includes(planId);
    const newSaved = isSaved ? currentSaved.filter(id => id !== planId) : [...currentSaved, planId];
    setUser({ ...user, savedPlans: newSaved });
    setToast({ message: isSaved ? "Plan removed" : "Plan saved!", type: 'success' });
  };

  const isPlanSaved = (planId: string) => user?.savedPlans?.includes(planId) || false;

  const handleGenerate = async (profile: UserProfile) => {
    if (!user || user.tokens <= 0) { setView('pricing'); return; }
    setLoading(true); setError(null);
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
        childId: selectedChildId,
        profile: profile,
        ...rawPlan
      };
      setPlan(generatedPlan);
      setHistory(prev => [generatedPlan, ...prev]);
      setUser(prev => prev ? ({ ...prev, tokens: prev.tokens - 1 }) : null);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const navigateTo = (v: View) => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const renderHome = () => (
    <div className="space-y-12 md:space-y-24 px-4">
      <header className="text-center no-print">
        <h1 className="text-6xl md:text-8xl font-black text-navy mb-12 tracking-tighter">Healthy Kids Lunch Plans</h1>
        <p className="text-navy/40 font-bold tracking-widest text-xs uppercase">Wholesome ideas tailored for growing kids.</p>
      </header>
      
      {!user ? (
        <section className="max-w-4xl mx-auto"><AuthForm onLogin={handleLogin} onSignup={() => {}} /></section>
      ) : (
        <div className="space-y-12 md:space-y-24 max-w-6xl mx-auto">
          <ChildManager 
            children={user.children} 
            onUpdate={(children) => setUser({ ...user, children })} 
            onSelect={setSelectedChildId}
            selectedChildId={selectedChildId}
          />
          
          <section className="max-w-4xl mx-auto">
            <InputForm 
              onSubmit={handleGenerate} 
              isLoading={loading} 
              selectedChild={user.children.find(c => c.id === selectedChildId)}
              initialProfile={currentFormState}
            />
            {error && <div className="mt-8 p-6 bg-primary/10 text-primary-dark rounded-2xl text-center font-black">{error}</div>}
          </section>

          {plan && !loading && (
            <div className="space-y-12 md:space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b-8 border-navy/5 pb-12">
                  <div className="text-left">
                    <p className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-2">
                      Plan for {user.children.find(c => c.id === plan.childId)?.name || 'Child'}
                    </p>
                    <h2 className="text-[2.25rem] font-black text-navy tracking-tight">{plan.weekLabel}</h2>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => toggleSavePlan(plan.id)} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-4 ${isPlanSaved(plan.id) ? 'bg-primary text-white border-primary' : 'bg-white border-navy text-navy'}`}>
                      {isPlanSaved(plan.id) ? 'Saved' : 'Save to Profile'}
                    </button>
                    <button onClick={() => window.print()} className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"><PrintIcon /> Print</button>
                  </div>
               </div>
               <div className="flex flex-col gap-12 md:gap-24 pb-20">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (<LunchCard key={day} day={day} data={plan[day]} />))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-navy/5 pb-8">
        <h2 className="text-5xl font-black text-navy tracking-tight">Your History</h2>
        <div className="flex bg-white p-1.5 rounded-2xl border-2 border-navy/5">
          <button onClick={() => setHistoryFilter('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'all' ? 'bg-navy text-white shadow-xl' : 'text-navy/40 hover:text-navy'}`}>All Plans</button>
          <button onClick={() => setHistoryFilter('saved')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'saved' ? 'bg-primary text-white shadow-xl' : 'text-navy/40 hover:text-navy'}`}>Saved Only</button>
        </div>
      </div>
      
      <div className="space-y-8">
        {(historyFilter === 'all' ? history : history.filter(h => isPlanSaved(h.id))).map(h => (
          <div 
            key={h.id} 
            className={`bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 transition-all shadow-2xl relative ${isPlanSaved(h.id) ? 'border-primary' : 'border-navy/5'}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-6 text-left" onClick={() => { setPlan(h); navigateTo('home'); }}>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{h.weekLabel}</span>
                <h4 className="text-3xl font-black text-navy leading-tight">Plan for {user?.children.find(c => c.id === h.childId)?.name || 'Child'}</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-navy text-white rounded-lg text-[9px] font-black uppercase">{h.profile.age} Years</span>
                  <span className="px-3 py-1 bg-secondary text-white rounded-lg text-[9px] font-black uppercase">{h.profile.dietType}</span>
                </div>
              </div>
              
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (
                  <div key={day} className="bg-bg-cool/50 p-4 rounded-2xl border-2 border-transparent text-left">
                    <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1">{day}</p>
                    <p className="text-xs font-black text-navy line-clamp-2">{h[day].name}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => toggleSavePlan(h.id)}
              className={`absolute top-8 right-8 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-4 ${isPlanSaved(h.id) ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-navy/5 text-navy/20 hover:border-primary/20 hover:text-primary'}`}
            >
              {isPlanSaved(h.id) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-cool">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 rounded-3xl shadow-2xl font-black bg-white border-4 border-primary text-primary animate-in slide-in-from-top-12">
          {toast.message}
        </div>
      )}
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-3xl border-b-4 border-navy/5 h-24 flex items-center justify-between px-6 md:px-12 no-print">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigateTo('home')}>
          <div className="p-3 bg-primary text-white rounded-2xl shadow-xl group-hover:rotate-12 transition-transform"><AppleIcon /></div>
          <span className="text-2xl font-black text-navy tracking-tighter">BentoMagic</span>
        </div>
        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:flex items-center gap-10 font-black text-[10px] uppercase tracking-widest text-navy/40">
            <button onClick={() => navigateTo('home')} className={view === 'home' ? 'text-primary' : ''}>Planner</button>
            <button onClick={() => navigateTo('pricing')} className={view === 'pricing' ? 'text-primary' : ''}>Pricing</button>
            {user && <button onClick={() => navigateTo('history')} className={view === 'history' ? 'text-primary' : ''}>History</button>}
          </div>
          {user && (
            <div className="flex items-center gap-4 border-l-4 border-bg-cool pl-10">
              <div onClick={() => navigateTo('pricing')} className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-primary transition-all cursor-pointer group">
                 <span className="text-xs font-black">{user.tokens}</span>
                 <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:rotate-90 transition-transform">+</div>
              </div>
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-4 ${view === 'profile' ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20' : 'bg-bg-cool text-navy border-transparent hover:border-primary/20'}`}><UserIcon className="w-6 h-6" /></div>
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1 pb-32 pt-12 md:pt-20">
        {view === 'home' && renderHome()}
        {view === 'history' && renderHistory()}
        {view === 'pricing' && (
          <div className="max-w-6xl mx-auto px-4 space-y-20">
             <h2 className="text-6xl md:text-7xl font-black text-navy text-center tracking-tight leading-none">Fuel Your<br/>Planning</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { tokens: 5, price: '$4.99', label: 'Snack Pack', icon: '⚡' },
                 { tokens: 15, price: '$9.99', label: 'Bento Bundle', icon: '🍱', popular: true },
                 { tokens: 50, price: '$24.99', label: 'Master Chef', icon: '🏆' }
               ].map(pack => (
                 <div key={pack.label} className={`bg-white p-12 rounded-[3rem] border-4 text-center space-y-8 transition-all ${pack.popular ? 'border-primary shadow-2xl scale-105 z-10' : 'border-navy/5 shadow-xl'}`}>
                   <div className="text-7xl">{pack.icon}</div>
                   <h3 className="text-2xl font-black text-navy">{pack.label}</h3>
                   <div className="text-5xl font-black text-primary tracking-tight">{pack.price}</div>
                   <button className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all">Select</button>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>
      <footer className="bg-navy py-24 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          <div className="space-y-10">
            <div className="flex items-center gap-4"><div className="p-3 bg-primary text-white rounded-xl shadow-2xl shadow-primary/20"><AppleIcon /></div><span className="text-2xl font-black text-white tracking-tighter">BentoMagic</span></div>
            <p className="text-white/30 font-bold leading-relaxed text-sm uppercase tracking-widest">Designing the future of family mealtime through intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="min-h-screen bg-bg-cool flex items-center justify-center"><LoadingIcon /></div>}><PageContent /></Suspense>; }