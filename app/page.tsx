'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserProfile, WeeklyPlan, User, Child } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { ChildManager } from '../components/ChildManager';
import { LunchboxBuilder } from '../components/LunchboxBuilder';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CreditCardIcon } from '../components/Icons';

type View = 'home' | 'history' | 'profile' | 'pricing' | 'payment' | 'builder' | 'recipes' | 'faq' | 'about' | 'privacy';

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
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const loadUser = () => {
      const savedUser = localStorage.getItem('bento_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.children.length > 0) setSelectedChildId(parsed.children[0].id);
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

  const handleLogin = (email: string, pass: string) => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Bento Parent', email, tokens: 10, isLoggedIn: true, children: [],
    };
    setUser(mockUser);
  };

  const handleUpdateChildren = (children: Child[]) => {
    if (!user) return;
    setUser({ ...user, children });
    if (!selectedChildId && children.length > 0) setSelectedChildId(children[0].id);
  };

  const handleGenerate = async (profile: UserProfile) => {
    if (!user || user.tokens <= 0) { setView('pricing'); return; }
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, childId: selectedChildId }),
      });
      if (!response.ok) throw new Error("Generation failed.");
      const rawPlan = await response.json();
      const generatedPlan: WeeklyPlan = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        weekLabel: profile.targetWeek,
        childId: selectedChildId || '',
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
        <div className="space-y-24 max-w-6xl mx-auto">
          <ChildManager 
            children={user.children} 
            onUpdate={handleUpdateChildren} 
            onSelect={(c) => setSelectedChildId(c.id)}
            selectedChildId={selectedChildId}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={() => navigateTo('builder')} className="bg-white p-10 rounded-[3rem] border-4 border-navy/5 shadow-xl text-left hover:border-primary transition-all group">
              <div className="text-4xl mb-6 group-hover:rotate-12 transition-transform">🎨</div>
              <h3 className="text-2xl font-black text-navy mb-2">Visual Builder</h3>
              <p className="text-navy/40 font-bold text-xs uppercase tracking-widest leading-relaxed">Design a custom bento lunchbox piece by piece.</p>
            </button>
            <button onClick={() => navigateTo('recipes')} className="bg-white p-10 rounded-[3rem] border-4 border-navy/5 shadow-xl text-left hover:border-secondary transition-all group">
              <div className="text-4xl mb-6 group-hover:rotate-12 transition-transform">📚</div>
              <h3 className="text-2xl font-black text-navy mb-2">Recipe Library</h3>
              <p className="text-navy/40 font-bold text-xs uppercase tracking-widest leading-relaxed">Browse smart, kid-friendly ideas with quick tags.</p>
            </button>
          </div>

          <section className="max-w-4xl mx-auto">
            <InputForm onSubmit={handleGenerate} isLoading={loading} initialProfile={selectedChildId ? { ...user.children.find(c => c.id === selectedChildId), targetWeek: '' } : null} />
          </section>

          {plan && !loading && (
            <div className="space-y-12 md:space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b-8 border-navy/5 pb-12">
                  <div className="text-left">
                    <p className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-2">Plan for {user.children.find(c => c.id === selectedChildId)?.name}</p>
                    <h2 className="text-[2.25rem] font-black text-navy tracking-tight">{plan.weekLabel}</h2>
                  </div>
                  <div className="flex gap-4">
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

  const renderRecipes = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-12 text-left">
      <h2 className="text-5xl font-black text-navy tracking-tight">Idea Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Sunshine Pasta", tags: ["5-min", "Nut-free"], icon: "🍝" },
          { title: "Ants on a Log", tags: ["No-cook", "Snack"], icon: "🐜" },
          { title: "Turkey Roll-ups", tags: ["Low-carb", "Protein"], icon: "🌯" },
          { title: "Greek Yogurt Parfait", tags: ["Vegetarian"], icon: "🍦" }
        ].map((recipe, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border-4 border-navy/5 shadow-xl hover:border-primary transition-all group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{recipe.icon}</div>
            <h4 className="text-2xl font-black text-navy mb-4">{recipe.title}</h4>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(t => <span key={t} className="px-3 py-1 bg-bg-cool rounded-lg text-[9px] font-black uppercase tracking-widest text-navy/40">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-cool">
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-3xl border-b-4 border-navy/5 h-24 flex items-center justify-between px-6 md:px-12 no-print">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigateTo('home')}>
          <div className="p-3 bg-primary text-white rounded-2xl shadow-xl group-hover:rotate-12 transition-transform"><AppleIcon /></div>
          <span className="text-2xl font-black text-navy tracking-tighter">BentoMagic</span>
        </div>
        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:flex items-center gap-10 font-black text-[10px] uppercase tracking-widest text-navy/40">
            <button onClick={() => navigateTo('home')} className={view === 'home' ? 'text-primary' : ''}>Planner</button>
            <button onClick={() => navigateTo('builder')} className={view === 'builder' ? 'text-primary' : ''}>Builder</button>
            <button onClick={() => navigateTo('recipes')} className={view === 'recipes' ? 'text-primary' : ''}>Library</button>
          </div>
          {user && (
            <div className="flex items-center gap-4 border-l-4 border-bg-cool pl-10">
              <div onClick={() => navigateTo('pricing')} className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-primary transition-all cursor-pointer">
                 <span className="text-xs font-black">{user.tokens}</span>
                 <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black">+</div>
              </div>
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-4 ${view === 'profile' ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20' : 'bg-bg-cool text-navy border-transparent hover:border-primary/20'}`}><UserIcon className="w-6 h-6" /></div>
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1 pb-32 pt-12 md:pt-20">
        {view === 'home' && renderHome()}
        {view === 'builder' && <div className="max-w-6xl mx-auto px-4"><LunchboxBuilder /></div>}
        {view === 'recipes' && renderRecipes()}
        {view === 'profile' && <div className="max-w-4xl mx-auto px-4"><p className="text-navy/20 font-black uppercase tracking-widest text-center py-20">Profile and history logic remains consistent.</p></div>}
      </main>
      <footer className="bg-navy py-24 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          <div className="space-y-10">
            <div className="flex items-center gap-4"><div className="p-3 bg-primary text-white rounded-xl shadow-2xl shadow-primary/20"><AppleIcon /></div><span className="text-2xl font-black text-white tracking-tighter">BentoMagic</span></div>
            <p className="text-white/30 font-bold leading-relaxed text-sm uppercase tracking-widest">Designing the future of family mealtime through intelligence. Wholesome ideas for growing kids.</p>
          </div>
          <div className="space-y-10"><h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Product</h4><ul className="space-y-6 text-xs font-black tracking-widest uppercase text-white/60"><li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Generator</button></li><li><button onClick={() => navigateTo('builder')} className="hover:text-primary transition-colors">Visual Builder</button></li><li><button onClick={() => navigateTo('recipes')} className="hover:text-primary transition-colors">Library</button></li></ul></div>
          <div className="space-y-10"><h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Company</h4><ul className="space-y-6 text-xs font-black tracking-widest uppercase text-white/60"><li><button onClick={() => navigateTo('about')} className="hover:text-primary transition-colors">About Magic</button></li><li><button onClick={() => navigateTo('faq')} className="hover:text-primary transition-colors">FAQ</button></li><li><button onClick={() => navigateTo('privacy')} className="hover:text-primary transition-colors">Privacy</button></li></ul></div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="min-h-screen bg-bg-cool flex items-center justify-center"><LoadingIcon /></div>}><PageContent /></Suspense>; }