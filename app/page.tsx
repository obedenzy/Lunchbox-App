'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserProfile, WeeklyPlan, User } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CheckIcon, CreditCardIcon } from '../components/Icons';

type View = 'home' | 'history' | 'profile' | 'pricing' | 'payment' | 'faq' | 'about' | 'privacy' | 'status' | 'api';

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
  const [historyFilter, setHistoryFilter] = useState<'all' | 'saved'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPack, setSelectedPack] = useState<TokenPack | null>(null);
  const [currentFormState, setCurrentFormState] = useState<UserProfile | null>(null);

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [defaultAge, setDefaultAge] = useState(6);
  const [defaultDiet, setDefaultDiet] = useState<'Omnivore' | 'Vegetarian' | 'Vegan'>('Omnivore');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const loadUser = () => {
      const savedUser = localStorage.getItem('bento_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setEditName(parsedUser.name);
        setDefaultAge(parsedUser.defaultSettings?.childAge || 6);
        setDefaultDiet(parsedUser.defaultSettings?.dietType || 'Omnivore');
        if (!currentFormState) {
          setCurrentFormState({
            age: parsedUser.defaultSettings?.childAge || 6,
            dietType: parsedUser.defaultSettings?.dietType || 'Omnivore',
            allergies: [],
            preferences: '',
            targetWeek: ''
          });
        }
      }
    };
    
    loadUser();

    const viewParam = searchParams.get('view') as View;
    const paymentParam = searchParams.get('payment');
    
    if (viewParam) setView(viewParam);
    if (paymentParam === 'success') {
      loadUser();
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
    setEditName(mockUser.name);
    setToast({ message: "Welcome back!", type: 'success' });
  };

  const handleSignup = (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name, email: email, tokens: 5, isLoggedIn: true, savedPlans: [],
      defaultSettings: { childAge: 6, dietType: 'Omnivore' },
      stats: { totalPlansGenerated: 0, joinedDate: new Date().toLocaleDateString() }
    };
    setUser(newUser);
    setEditName(newUser.name);
    setToast({ message: "Welcome to BentoMagic!", type: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bento_user');
    setPlan(null);
    setView('home');
    setToast({ message: "Logged out successfully", type: 'success' });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUser({ 
      ...user, 
      name: editName,
      defaultSettings: { childAge: defaultAge, dietType: defaultDiet }
    });
    setToast({ message: "Profile and settings updated!", type: 'success' });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: "Passwords do not match!", type: 'error' });
      return;
    }
    setToast({ message: "Password updated successfully!", type: 'success' });
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleSavePlan = (planId: string) => {
    if (!user) return;
    const currentSaved = user.savedPlans || [];
    const isSaved = currentSaved.includes(planId);
    const newSaved = isSaved ? currentSaved.filter(id => id !== planId) : [...currentSaved, planId];
    setUser({ ...user, savedPlans: newSaved });
    setToast({ 
      message: isSaved ? "Plan removed from profile" : "Plan saved to profile!", 
      type: 'success' 
    });
  };

  const isPlanSaved = (planId: string) => user?.savedPlans?.includes(planId) || false;

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
      setToast({ message: "New plan generated successfully!", type: 'success' });
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

  const loadHistoryPlan = (h: WeeklyPlan) => {
    setPlan(h);
    setCurrentFormState(h.profile);
    navigateTo('home');
    setToast({ message: "Loaded plan settings into form", type: 'success' });
  };

  const filteredHistory = historyFilter === 'all' 
    ? history 
    : history.filter(h => isPlanSaved(h.id));

  const renderHome = () => (
    <div className="space-y-12 md:space-y-24 px-4">
      <header className="text-center no-print">
        <h1 className="text-6xl md:text-8xl font-black text-navy mb-12 tracking-tighter">Healthy Kids Lunch Plans</h1>
        <p className="text-navy/40 font-bold tracking-widest text-xs uppercase">Wholesome ideas tailored for growing kids.</p>
      </header>
      <section className="max-w-4xl mx-auto">
        {!user ? <AuthForm onLogin={handleLogin} onSignup={handleSignup} /> : <InputForm onSubmit={handleGenerate} isLoading={loading} initialProfile={currentFormState} />}
        {error && <div className="mt-8 p-6 bg-primary/10 text-primary-dark rounded-2xl text-center font-black">{error}</div>}
      </section>
      {loading && (
        <div className="py-24 text-center space-y-6">
          <div className="w-16 h-16 border-8 border-navy/5 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-navy/40 font-black uppercase text-xs tracking-[0.2em]">Crafting your magical menu...</p>
        </div>
      )}
      {plan && !loading && (
        <div className="space-y-12 md:space-y-24 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 no-print border-b-8 border-navy/5 pb-12">
            <div className="text-left">
              <p className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-2">Selected Schedule</p>
              <h2 className="text-[2.25rem] font-black text-navy tracking-tight leading-tight">{plan.weekLabel}</h2>
              <p className="text-navy/30 font-bold text-xs mt-3 uppercase tracking-widest">
                Generated {new Date(plan.timestamp).toLocaleDateString()} for {plan.profile.age} Year Old
              </p>
            </div>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <button onClick={() => toggleSavePlan(plan.id)} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all text-xs tracking-widest uppercase border-4 ${isPlanSaved(plan.id) ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30' : 'bg-white border-navy text-navy hover:bg-navy hover:text-white'}`}>{isPlanSaved(plan.id) ? 'Saved' : 'Save to Profile'}</button>
              <button onClick={() => handleGenerate(plan.profile)} className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-secondary text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-secondary-dark transition-all shadow-2xl shadow-secondary/30">Regenerate</button>
              <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-navy text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-navy/90 transition-all shadow-xl"><PrintIcon /> Print</button>
            </div>
          </div>
          <div className="flex flex-col gap-12 md:gap-24 pb-20">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (<LunchCard key={day} day={day} data={plan[day]} />))}
          </div>
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
      {filteredHistory.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[3rem] border-4 border-navy/5">
          <p className="text-navy/20 font-black uppercase tracking-[0.3em] text-sm">{historyFilter === 'saved' ? 'No saved lunchboxes yet.' : 'No magic lunchboxes found.'}</p>
          <button onClick={() => navigateTo('home')} className="mt-8 bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary transition-all shadow-xl">Start Planning</button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredHistory.map(h => (
            <div key={h.id} className={`bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 transition-all shadow-2xl shadow-navy/5 group cursor-pointer text-left relative overflow-hidden ${isPlanSaved(h.id) ? 'border-primary' : 'border-navy/5 hover:border-primary/20'}`} onClick={() => loadHistoryPlan(h)}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                <div className="lg:col-span-4 space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{h.weekLabel}</span>
                    {isPlanSaved(h.id) && <div className="bg-primary text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Saved Plan</div>}
                  </div>
                  <h4 className="text-3xl font-black text-navy group-hover:text-primary transition-colors leading-tight">Weekly Overview</h4>
                  <div className="space-y-4 pt-4 border-t-2 border-bg-cool">
                     <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest">Profile Configuration</p>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-navy text-white rounded-lg text-[9px] font-black uppercase tracking-wide">{h.profile.age} Years</span>
                        <span className="px-3 py-1 bg-secondary text-white rounded-lg text-[9px] font-black uppercase tracking-wide">{h.profile.dietType}</span>
                        {h.profile.allergies.map(a => (<span key={a} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-wide">{a}</span>))}
                     </div>
                  </div>
                </div>
                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
                    <div key={day} className="bg-bg-cool/50 p-4 rounded-2xl border-2 border-transparent group-hover:border-white transition-all">
                       <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1">{day}</p>
                       <p className="text-xs font-black text-navy line-clamp-2">{h[day].name}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-center p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"><span className="text-[10px] font-black uppercase tracking-widest">Load View</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto px-4 space-y-12">
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl text-left space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b-4 border-bg-cool pb-12">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"><UserIcon className="w-12 h-12" /></div>
            <div>
              <h2 className="text-4xl font-black text-navy tracking-tight">{user?.name}</h2>
              <p className="text-navy/40 font-black uppercase tracking-widest text-[10px]">{user?.email}</p>
            </div>
          </div>
          <div className="bg-navy px-8 py-6 rounded-3xl shadow-2xl shadow-navy/20 text-center md:text-right">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Available Credits</p>
             <p className="text-3xl font-black text-white">{user?.tokens} <span className="text-sm text-primary">Tokens</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-10">
            <h3 className="text-xl font-black text-navy tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-primary rounded-full" />Account Settings</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div><label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Display Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Default Age</label><select value={defaultAge} onChange={(e) => setDefaultAge(parseInt(e.target.value))} className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy appearance-none">{Array.from({length: 17}, (_, i) => i + 2).map(v => <option key={v} value={v}>{v}y</option>)}</select></div>
                <div><label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Default Diet</label><select value={defaultDiet} onChange={(e) => setDefaultDiet(e.target.value as any)} className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy appearance-none"><option value="Omnivore">Omnivore</option><option value="Vegetarian">Vegetarian</option><option value="Vegan">Vegan</option></select></div>
              </div>
              <button type="submit" className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary transition-all shadow-xl">Update Settings</button>
            </form>
          </div>
          <div className="space-y-10">
            <h3 className="text-xl font-black text-navy tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-secondary rounded-full" />Security</h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div><label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">New Password</label><input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy" /></div>
              <div><label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Confirm New Password</label><input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy" /></div>
              <button type="submit" className="w-full border-4 border-navy/5 text-navy py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-primary transition-all">Update Password</button>
            </form>
          </div>
        </div>
        <div className="pt-12 border-t-4 border-bg-cool flex flex-col md:flex-row gap-6">
           <button onClick={() => navigateTo('pricing')} className="flex-1 bg-primary text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-dark transition-all shadow-2xl shadow-primary/20">Buy Tokens</button>
           <button onClick={handleLogout} className="flex-1 border-4 border-primary text-primary py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all">Sign Out</button>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-20">
      <h2 className="text-6xl md:text-7xl font-black text-navy text-center tracking-tight leading-none">Fuel Your<br/>Planning</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TOKEN_PACKS.map(pack => (
          <div key={pack.priceId} className={`bg-white p-12 rounded-[3rem] border-4 text-center space-y-8 transition-all ${pack.popular ? 'border-primary shadow-2xl scale-105 z-10' : 'border-navy/5 hover:border-primary/20 shadow-xl'}`}>
            <div className="text-7xl">{pack.icon}</div>
            <h3 className="text-2xl font-black text-navy">{pack.label}</h3>
            <div className="text-5xl font-black text-primary tracking-tight">{pack.price}</div>
            <p className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">{pack.tokens} Generation Credits</p>
            <button onClick={() => { setSelectedPack(pack); setView('payment'); }} className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl">Select Pack</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">FAQ</h2>
      <div className="space-y-8">
        {[
          { q: "How does BentoMagic work?", a: "We use advanced AI (Gemini 3 Pro) to generate customized meal plans based on your child's age, allergies, and preferences. Each plan includes recipes, nutritional data, and AI-generated visuals." },
          { q: "What are generation credits?", a: "Each credit (token) allows you to generate one full 7-day weekly plan. You get free tokens upon signup and can purchase more in our shop." },
          { q: "Can I save my favorite plans?", a: "Yes! Once a plan is generated, click 'Save to Profile'. It will be stored in your history forever for easy access." },
          { q: "Are the recipes healthy?", a: "Absolutely. Our AI is instructed to prioritize whole foods, balanced macros, and kid-friendly portions while respecting your dietary choices." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border-4 border-navy/5 shadow-xl">
            <h4 className="text-xl font-black text-navy mb-4">Q: {item.q}</h4>
            <p className="text-navy/60 font-bold leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">About Magic</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8">
        <p className="text-2xl font-black text-primary leading-tight">We believe that family mealtime should be a source of joy, not stress.</p>
        <p className="text-navy/60 font-bold leading-relaxed text-lg">BentoMagic was born from a simple observation: parents spend too much time worrying about what to pack for lunch. By combining culinary expertise with cutting-edge artificial intelligence, we've created a studio that handles the planning, so you can handle the parenting.</p>
        <div className="grid grid-cols-2 gap-8 pt-8">
          <div className="bg-bg-cool p-8 rounded-2xl">
             <p className="text-4xl mb-4">🥗</p>
             <h5 className="font-black text-navy mb-2 uppercase text-xs tracking-widest">Vision</h5>
             <p className="text-navy/40 text-[10px] font-black leading-relaxed">To become the global standard for smart, healthy family meal planning.</p>
          </div>
          <div className="bg-bg-cool p-8 rounded-2xl">
             <p className="text-4xl mb-4">🚀</p>
             <h5 className="font-black text-navy mb-2 uppercase text-xs tracking-widest">Mission</h5>
             <p className="text-navy/40 text-[10px] font-black leading-relaxed">Providing parents with the tools they need to fuel the next generation.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">Privacy</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-12">
        <section className="space-y-4">
          <h4 className="text-xl font-black text-navy uppercase tracking-widest">1. Data Collection</h4>
          <p className="text-navy/60 font-bold leading-relaxed">We collect minimal data: your email for account access, and your planning preferences to generate accurate meal suggestions. We never sell your data.</p>
        </section>
        <section className="space-y-4">
          <h4 className="text-xl font-black text-navy uppercase tracking-widest">2. Payments</h4>
          <p className="text-navy/60 font-bold leading-relaxed">All payments are handled securely via Stripe. BentoMagic does not store your credit card information on our servers.</p>
        </section>
        <section className="space-y-4">
          <h4 className="text-xl font-black text-navy uppercase tracking-widest">3. AI Processing</h4>
          <p className="text-navy/60 font-bold leading-relaxed">Your preferences are sent to Google Gemini for processing. This data is used only to generate your specific meal plan.</p>
        </section>
      </div>
    </div>
  );

  const renderStatus = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">Status</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8">
        <div className="flex items-center gap-6 p-8 bg-accent/10 border-2 border-accent/20 rounded-3xl">
           <div className="w-4 h-4 bg-accent rounded-full animate-pulse shadow-xl shadow-accent/40" />
           <p className="text-xl font-black text-accent-dark">All Systems Operational</p>
        </div>
        <div className="space-y-6 pt-8">
          {[
            { n: "API Engine", s: "Operational" },
            { n: "Visual Studio", s: "Operational" },
            { n: "Payments Gateway", s: "Operational" },
            { n: "Core Platform", s: "Operational" }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center pb-6 border-b-2 border-bg-cool">
               <span className="font-black text-navy/40 uppercase tracking-widest text-[10px]">{item.n}</span>
               <span className="font-black text-navy uppercase tracking-widest text-[10px]">{item.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAPI = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">API</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8">
        <p className="text-xl font-black text-navy">The BentoMagic Public API is currently in closed beta.</p>
        <p className="text-navy/60 font-bold leading-relaxed">Developers will soon be able to integrate our magical lunchbox generation engine into their own applications. Contact us to join the waiting list.</p>
        <div className="bg-navy p-8 rounded-3xl">
           <code className="text-primary font-black text-xs tracking-tighter">GET /v1/magic/generate?tokens=valid_key</code>
        </div>
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
            <button onClick={() => navigateTo('home')} className={`hover:text-primary transition-colors ${view === 'home' ? 'text-primary' : ''}`}>Home</button>
            <button onClick={() => navigateTo('pricing')} className={`hover:text-primary transition-colors ${view === 'pricing' ? 'text-primary' : ''}`}>Pricing</button>
            {user && <button onClick={() => navigateTo('history')} className={`hover:text-primary transition-colors ${view === 'history' ? 'text-primary' : ''}`}>History</button>}
          </div>
          {user && (
            <div className="flex items-center gap-3 md:gap-6 border-l-4 border-bg-cool pl-3 md:pl-10">
              <div onClick={() => navigateTo('pricing')} className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-primary transition-all cursor-pointer group">
                 <span className="text-xs font-black">{user.tokens}</span>
                 <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:rotate-90 transition-transform">+</div>
              </div>
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-4 ${view === 'profile' ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20' : 'bg-bg-cool text-navy border-transparent hover:border-primary/20'}`}><UserIcon className="w-6 h-6" /></div>
              <button onClick={handleLogout} className="hidden md:block text-[10px] font-black text-navy/30 hover:text-primary uppercase tracking-widest transition-colors">Sign Out</button>
            </div>
          )}
          {!user && <button onClick={() => navigateTo('home')} className="bg-navy text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl">Get Started</button>}
        </div>
      </nav>
      <main className="flex-1 pb-32 pt-12 md:pt-20">
        {view === 'home' && renderHome()}
        {view === 'history' && renderHistory()}
        {view === 'profile' && renderProfile()}
        {view === 'pricing' && renderPricing()}
        {view === 'faq' && renderFAQ()}
        {view === 'about' && renderAbout()}
        {view === 'privacy' && renderPrivacy()}
        {view === 'status' && renderStatus()}
        {view === 'api' && renderAPI()}
        {view === 'payment' && selectedPack && (
          <StripeCheckout tokens={selectedPack.tokens} amount={selectedPack.price} label={selectedPack.label} onCancel={() => setView('pricing')} />
        )}
      </main>
      <footer className="bg-navy py-24 md:py-40 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-white rounded-xl shadow-2xl shadow-primary/20"><AppleIcon /></div>
              <span className="text-2xl font-black text-white tracking-tighter">BentoMagic</span>
            </div>
            <p className="text-white/30 font-bold leading-relaxed text-sm uppercase tracking-widest">Designing the future of family mealtime through intelligence. Wholesome ideas for growing kids.</p>
          </div>
          <div className="space-y-10">
            <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Product</h4>
            <ul className="space-y-6 text-xs font-black tracking-widest uppercase text-white/60">
              <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Generator</button></li>
              <li><button onClick={() => navigateTo('pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              <li><button onClick={() => navigateTo('history')} className="hover:text-primary transition-colors">History</button></li>
            </ul>
          </div>
          <div className="space-y-10">
            <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Company</h4>
            <ul className="space-y-6 text-xs font-black tracking-widest uppercase text-white/60">
              <li><button onClick={() => navigateTo('about')} className="hover:text-primary transition-colors">About Magic</button></li>
              <li><button onClick={() => navigateTo('faq')} className="hover:text-primary transition-colors">FAQ</button></li>
              <li><button onClick={() => navigateTo('privacy')} className="hover:text-primary transition-colors">Privacy</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-10 border-t border-white/5 mt-32 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-white/10 text-[10px] font-black tracking-[0.3em] uppercase">© {new Date().getFullYear()} BentoMagic Intelligence Studio</p>
           <div className="flex gap-10 text-[10px] font-black tracking-[0.3em] uppercase text-white/10">
              <button onClick={() => navigateTo('status')} className="hover:text-white transition-colors">Status</button>
              <button onClick={() => navigateTo('api')} className="hover:text-white transition-colors">API</button>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-cool flex items-center justify-center"><LoadingIcon /></div>}>
      <PageContent />
    </Suspense>
  );
}