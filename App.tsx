'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyPlan, User } from './types';
import { generateLunchPlan } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { LunchCard } from './components/LunchCard';
import { AuthForm } from './components/AuthForm';
import { StripeCheckout } from './components/StripeCheckout';
import { AppleIcon, PrintIcon, UserIcon, CreditCardIcon, LoadingIcon, CheckIcon } from './components/Icons';

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

function App() {
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

  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [defaultAge, setDefaultAge] = useState(6);
  const [defaultDiet, setDefaultDiet] = useState<'Omnivore' | 'Vegetarian' | 'Vegan'>('Omnivore');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('bento_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedUser = localStorage.getItem('bento_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setEditName(parsedUser.name);
      setDefaultAge(parsedUser.defaultSettings?.childAge || 6);
      setDefaultDiet(parsedUser.defaultSettings?.dietType || 'Omnivore');
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
    setEditName(mockUser.name);
    setToast({ message: `Welcome back, ${mockUser.name}!`, type: 'success' });
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
    setEditName(newUser.name);
    setToast({ message: "Welcome to BentoMagic!", type: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bento_user');
    setView('home');
    setPlan(null);
    setToast({ message: "Signed out successfully.", type: 'success' });
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
    setToast({ message: "Password updated!", type: 'success' });
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure? This will delete all your history and saved plans forever.")) {
      localStorage.clear();
      setUser(null);
      setHistory([]);
      setPlan(null);
      setView('home');
      setToast({ message: "Account permanently closed.", type: 'success' });
    }
  };

  const toggleSavePlan = (planId: string) => {
    if (!user) return;
    const currentSaved = user.savedPlans || [];
    const isSaved = currentSaved.includes(planId);
    const newSaved = isSaved ? currentSaved.filter(id => id !== planId) : [...currentSaved, planId];
    setUser({ ...user, savedPlans: newSaved });
  };

  const handleGenerate = async (profile: UserProfile) => {
    if (!user || user.tokens <= 0) {
      setError("Insufficient tokens. Visit the pricing section to continue.");
      setView('pricing');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generatedPlan = await generateLunchPlan(profile);
      generatedPlan.profile = profile;
      setPlan(generatedPlan);
      setHistory(prev => [generatedPlan, ...prev]);
      
      setUser(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          tokens: prev.tokens - 1,
          stats: {
            ...prev.stats!,
            totalPlansGenerated: (prev.stats?.totalPlansGenerated || 0) + 1
          }
        };
      });
      
      setView('home');
      setToast({ message: "Weekly plan generated with images!", type: 'success' });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlanFromHistory = (h: WeeklyPlan) => {
    setPlan(h);
    setCurrentProfileDraft({ ...h.profile });
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (newView: View) => {
    setView(newView);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPlanSaved = (planId: string) => user?.savedPlans?.includes(planId) || false;

  const renderHome = () => (
    <div className="space-y-12 md:space-y-24 px-4">
      <section className="max-w-4xl mx-auto no-print">
        {user ? (
          <InputForm onSubmit={handleGenerate} isLoading={loading} initialProfile={currentProfileDraft || {
            age: user.defaultSettings?.childAge || 6,
            dietType: user.defaultSettings?.dietType || 'Omnivore',
            allergies: [],
            preferences: '',
            targetWeek: ''
          }} />
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
        <section className="space-y-12 md:space-y-16 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 no-print border-b-8 border-navy/5 pb-12">
            <div className="space-y-2">
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
                <svg className="w-5 h-5" fill={isPlanSaved(plan.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isPlanSaved(plan.id) ? 'Saved' : 'Save Plan'}
              </button>

              <button
                onClick={() => handleGenerate(plan.profile)}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-secondary text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wide hover:bg-secondary-dark transition-all shadow-2xl shadow-secondary/30"
              >
                Regenerate
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
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => (
              <LunchCard key={day} day={day} data={plan[day]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderHistory = () => {
    const filteredHistory = historyFilter === 'saved' 
      ? history.filter(h => isPlanSaved(h.id))
      : history;

    return (
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-navy/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tight">Your History</h2>
            <p className="text-navy/40 font-black text-xs uppercase tracking-widest">Access your past architectural lunch plans</p>
          </div>
          <div className="flex bg-bg-cool p-2 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setHistoryFilter('all')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'all' ? 'bg-white text-navy shadow-lg' : 'text-navy/40 hover:text-navy'}`}
            >
              All Plans
            </button>
            <button 
              onClick={() => setHistoryFilter('saved')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'saved' ? 'bg-white text-navy shadow-lg' : 'text-navy/40 hover:text-navy'}`}
            >
              Saved Only
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-navy/5">
            <div className="text-6xl mb-8">📚</div>
            <h3 className="text-2xl font-black text-navy mb-4">No plans found</h3>
            <p className="text-navy/40 font-bold max-w-xs mx-auto text-sm uppercase">Start creating to build your personal history.</p>
            <button onClick={() => navigateTo('home')} className="mt-10 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-2xl shadow-primary/30">Go Home</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHistory.map((h) => (
              <div key={h.id} className="bg-white p-8 rounded-[2rem] border-4 border-navy/5 hover:border-primary/20 transition-all group cursor-pointer" onClick={() => handleLoadPlanFromHistory(h)}>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{h.weekLabel}</span>
                  <div onClick={(e) => { e.stopPropagation(); toggleSavePlan(h.id); }} className="text-navy/20 hover:text-primary transition-colors">
                    <svg className="w-6 h-6" fill={isPlanSaved(h.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-black text-navy mb-4 group-hover:text-primary transition-colors line-clamp-2">{h.Monday.name}</h4>
                <div className="flex items-center gap-4 text-navy/40 text-[10px] font-black uppercase tracking-widest border-t border-navy/5 pt-6">
                  <span>{h.profile.age} Years</span>
                  <div className="w-1 h-1 rounded-full bg-navy/10" />
                  <span>{h.profile.dietType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    if (!user) return null;
    return (
      <div className="max-w-4xl mx-auto space-y-12 px-4">
        <div className="bg-white p-8 md:p-16 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-12 text-left">
          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center justify-between border-b-4 border-bg-cool pb-12">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20">
                <UserIcon className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-navy tracking-tight">{user.name}</h2>
                <p className="text-navy/40 font-black tracking-widest uppercase text-[10px] mt-1">{user.email}</p>
              </div>
            </div>
            <div className="bg-navy px-8 py-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Generated</p>
              <p className="text-2xl font-black text-white">{user.stats?.totalPlansGenerated || 0}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase ml-2">Display Name</label>
                 <input 
                   type="text" 
                   value={editName}
                   onChange={(e) => setEditName(e.target.value)}
                   className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black"
                 />
               </div>
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase ml-2">Default Child Age</label>
                 <select 
                   value={defaultAge}
                   onChange={(e) => setDefaultAge(parseInt(e.target.value))}
                   className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black"
                 >
                   {Array.from({ length: 17 }, (_, i) => i + 2).map(val => (
                     <option key={val} value={val}>{val} years old</option>
                   ))}
                 </select>
               </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase ml-2">Default Diet Type</label>
                <div className="flex flex-wrap gap-4">
                  {(['Omnivore', 'Vegetarian', 'Vegan'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDefaultDiet(type)}
                      className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black tracking-wide transition-all border-4 ${
                        defaultDiet === type 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-bg-cool text-navy/40 border-transparent hover:border-primary/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
             </div>
             <button type="submit" className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-2xl">Update Settings</button>
          </form>

          <div className="pt-12 border-t-4 border-bg-cool space-y-10">
            <h3 className="text-xl font-black text-navy uppercase tracking-widest">Security</h3>
            <form onSubmit={handleChangePassword} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <input 
                   type="password" 
                   placeholder="New Password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black"
                 />
                 <input 
                   type="password" 
                   placeholder="Confirm Password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black"
                 />
               </div>
               <button type="submit" className="px-10 py-5 bg-white border-4 border-navy/5 text-navy rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-primary/20 transition-all">Change Password</button>
            </form>
          </div>

          <div className="pt-12 border-t-4 border-bg-cool">
            <button 
              onClick={handleDeleteAccount}
              className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:underline"
            >
              Permanently Delete Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="text-center space-y-6">
        <h2 className="text-5xl md:text-7xl font-black text-navy tracking-tight">Fuel Your Planning</h2>
        <p className="text-navy/40 font-bold max-w-xl mx-auto uppercase tracking-widest text-xs md:text-sm">BentoMagic uses advanced intelligence to design your meals. Credits are only consumed on successful generation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {TOKEN_PACKS.map((pack) => (
          <div 
            key={pack.priceId} 
            className={`bg-white p-12 rounded-[3rem] border-4 transition-all flex flex-col items-center text-center relative ${pack.popular ? 'border-primary shadow-2xl shadow-primary/20 scale-105 z-10' : 'border-navy/5 shadow-xl hover:border-primary/20'}`}
          >
            {pack.popular && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Most Popular</div>
            )}
            <div className="text-6xl mb-8">{pack.icon}</div>
            <h3 className="text-2xl font-black text-navy mb-2">{pack.label}</h3>
            <p className="text-navy/40 font-black uppercase tracking-widest text-[10px] mb-8">{pack.tokens} Generation Credits</p>
            <div className="text-5xl font-black text-navy mb-12 tracking-tighter">{pack.price}</div>
            <button 
              onClick={() => { setSelectedPack(pack); setView('payment'); }}
              className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest transition-all ${pack.popular ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-navy text-white shadow-xl'}`}
            >
              Select Pack
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPayment = () => {
    if (!selectedPack) return null;
    return (
      <div className="max-w-4xl mx-auto px-4 animate-in zoom-in duration-500">
        <StripeCheckout 
          tokens={selectedPack.tokens}
          amount={selectedPack.price}
          label={selectedPack.label}
          onCancel={() => { setSelectedPack(null); setView('pricing'); }}
        />
      </div>
    );
  };

  const renderStaticPage = (title: string, content: string, color: 'primary' | 'secondary' | 'accent' | 'navy') => {
    const colorClasses: Record<string, string> = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      accent: 'bg-accent',
      navy: 'bg-navy'
    };
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-10 md:p-20 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-12 text-left relative overflow-hidden">
          <div className={`absolute -top-20 -right-20 w-64 h-64 ${colorClasses[color]} opacity-5 rounded-full`} />
          <h2 className={`text-4xl md:text-6xl font-black text-navy tracking-tight border-b-8 border-bg-cool pb-12`}>{title}</h2>
          <div className="space-y-8">
             <p className="text-xl md:text-2xl font-bold text-navy/70 leading-relaxed">{content}</p>
          </div>
          <button onClick={() => navigateTo('home')} className="bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">Return Home</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary-dark overflow-x-hidden bg-bg-cool">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-12 duration-500 no-print w-[90%] md:w-auto">
          <div className={`px-10 py-5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] font-black text-sm tracking-wide flex items-center justify-center gap-6 bg-white border-4 ${
            toast.type === 'success' ? 'text-secondary border-secondary' : 'text-primary border-primary'
          }`}>
            <span className="text-2xl">{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.message}
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-3xl border-b-4 border-navy/5 no-print">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="p-3 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 group-hover:rotate-12 transition-transform duration-500">
              <AppleIcon />
            </div>
            <span className="text-2xl md:text-3xl font-black text-navy tracking-tighter">BentoMagic</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            <div className="flex items-center gap-10 text-[10px] font-black tracking-[0.2em] text-navy/40 uppercase">
              <button onClick={() => navigateTo('home')} className={`hover:text-primary transition-all ${view === 'home' ? 'text-primary scale-110' : ''}`}>Home</button>
              <button onClick={() => navigateTo('pricing')} className={`hover:text-primary transition-all ${view === 'pricing' ? 'text-primary scale-110' : ''}`}>Pricing</button>
              {user && (
                <>
                  <button onClick={() => navigateTo('history')} className={`hover:text-primary transition-all ${view === 'history' ? 'text-primary scale-110' : ''}`}>History</button>
                  <div onClick={() => navigateTo('pricing')} className="flex items-center gap-4 bg-navy px-6 py-3 rounded-2xl cursor-pointer hover:bg-primary transition-all group shadow-2xl shadow-navy/20">
                    <span className="text-white normal-case font-black">{user.tokens} Tokens</span>
                    <div className="w-6 h-6 bg-white text-navy rounded-xl flex items-center justify-center text-[10px] shadow-inner font-black group-hover:rotate-90 transition-transform">+</div>
                  </div>
                </>
              )}
            </div>
            {!user ? (
              <button onClick={() => navigateTo('home')} className="bg-navy text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-primary transition-all shadow-2xl shadow-navy/20 uppercase">Get Started</button>
            ) : (
              <div onClick={() => navigateTo('profile')} className={`w-14 h-14 rounded-2xl border-4 border-bg-cool flex items-center justify-center cursor-pointer hover:border-primary transition-all bg-white overflow-hidden shadow-2xl ${view === 'profile' ? 'border-primary ring-8 ring-primary/5' : ''}`}>
                <span className="text-navy">
                  <UserIcon className="w-7 h-7" />
                </span>
              </div>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-3 text-navy hover:text-primary transition-all focus:outline-none" aria-label="Toggle Menu">
            {isMenuOpen ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>

        <div className={`lg:hidden fixed inset-0 top-24 w-full h-[calc(100vh-6rem)] bg-white/98 backdrop-blur-xl transition-all duration-500 z-[150] overflow-y-auto ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
          <div className="p-8 space-y-10 pb-40">
            <div className="flex flex-col gap-8">
              {user ? (
                <div className="flex items-center justify-between pb-8 border-b-4 border-navy/5">
                  <div onClick={() => navigateTo('profile')} className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-bg-cool rounded-2xl flex items-center justify-center text-navy shadow-inner"><UserIcon className="w-8 h-8" /></div>
                    <div className="flex flex-col">
                      <span className="font-black text-navy text-2xl">{user.name}</span>
                      <span className="text-xs text-navy/40 font-bold uppercase tracking-widest">{user.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pb-8 border-b-4 border-navy/5">
                  <button onClick={() => navigateTo('home')} className="w-full bg-navy text-white p-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy/20">Studio Access</button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => navigateTo('home')} className={`w-full p-6 rounded-3xl text-sm font-black tracking-[0.2em] text-left flex items-center justify-between uppercase ${view === 'home' ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-bg-cool text-navy'}`}>
                  Home {view === 'home' && <CheckIcon />}
                </button>
                <button onClick={() => navigateTo('pricing')} className={`w-full p-6 rounded-3xl text-sm font-black tracking-[0.2em] text-left flex items-center justify-between uppercase ${view === 'pricing' ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-bg-cool text-navy'}`}>
                  Pricing {view === 'pricing' && <CheckIcon />}
                </button>
                {user && (
                  <>
                    <button onClick={() => navigateTo('history')} className={`w-full p-6 rounded-3xl text-sm font-black tracking-[0.2em] text-left flex items-center justify-between uppercase ${view === 'history' ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-bg-cool text-navy'}`}>
                      History {view === 'history' && <CheckIcon />}
                    </button>
                    <button onClick={() => navigateTo('profile')} className={`w-full p-6 rounded-3xl text-sm font-black tracking-[0.2em] text-left flex items-center justify-between uppercase ${view === 'profile' ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-bg-cool text-navy'}`}>
                      Profile {view === 'profile' && <CheckIcon />}
                    </button>
                  </>
                )}
              </div>

              {user && (
                <button onClick={handleLogout} className="w-full p-6 text-sm font-black text-primary border-4 border-primary/10 rounded-3xl hover:bg-primary/5 transition-all tracking-[0.2em] mt-6 uppercase">Sign Out</button>
              )}
            </div>

            <div className="pt-12 space-y-8">
              <h4 className="text-[10px] font-black text-navy/20 tracking-[0.3em] uppercase ml-4">Resources</h4>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => navigateTo('nutrition')} className="text-left px-4 py-4 text-navy/60 font-black hover:text-primary transition-all uppercase tracking-widest text-xs">Research Lab</button>
                <button onClick={() => navigateTo('contact')} className="text-left px-4 py-4 text-navy/60 font-black hover:text-primary transition-all uppercase tracking-widest text-xs">Human Support</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <header className="max-w-7xl mx-auto pt-20 md:pt-40 pb-16 md:pb-32 text-center no-print px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden opacity-5 pointer-events-none select-none">
          <div className="text-[20vw] font-black text-navy leading-none whitespace-nowrap uppercase">KidBento AI</div>
        </div>
        <div className="inline-block px-8 py-3 bg-secondary/10 text-secondary-dark rounded-full text-[10px] font-black tracking-[0.3em] mb-12 border-4 border-secondary/20 uppercase">
          BentoMagic Magic AI Engine
        </div>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-navy mb-12 tracking-tighter leading-[0.85]">
          {view === 'home' ? 'Healthy Kids\nLunch Plans' : view.charAt(0).toUpperCase() + view.slice(1)}
        </h1>
        <p className="text-navy/40 font-bold tracking-widest text-xs md:text-sm max-w-xl mx-auto uppercase leading-loose">
          Wholesome, delicious, and easy-to-prep lunch box ideas tailored for growing kids.
        </p>
      </header>

      <main className="flex-1 pb-32">
        {view === 'home' && renderHome()}
        {view === 'history' && (
          <div className="animate-in fade-in duration-700">
            <div className="px-4">
              {renderHistory()}
            </div>
          </div>
        )}
        {view === 'profile' && renderProfile()}
        {view === 'pricing' && (
           <div className="px-4">
             {renderPricing()}
           </div>
        )}
        {view === 'payment' && renderPayment()}
        {view === 'nutrition' && (
          <div className="px-4">
            {renderStaticPage('Research Lab', 'BentoMagic is designed using pediatrically approved macronutrient ratios. We focus on low-GI carbohydrates for focus, lean proteins for physical growth, and essential fats for cognitive development.', 'accent')}
          </div>
        )}
        {view === 'contact' && (
           <div className="px-4">
             {renderStaticPage('Human Support', 'Need help or have suggestions? Reach out to support@bentomagic.ai. Our team of nutritionist-parents is here for you 24/7.', 'navy')}
           </div>
        )}
      </main>

      <footer className="bg-navy py-24 md:py-40 no-print mt-auto text-white">
        <div className="max-w-7xl mx-auto px-10 flex flex-col lg:flex-row justify-between items-start gap-24">
          <div className="space-y-12 max-w-md">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-primary text-white rounded-3xl shadow-2xl shadow-primary/30"><AppleIcon /></div>
              <span className="text-4xl font-black tracking-tighter">BentoMagic</span>
            </div>
            <p className="text-white/30 font-bold leading-relaxed text-lg uppercase tracking-widest">Designing the future of family mealtime through intelligence.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20 w-full lg:w-auto">
            <div className="space-y-10">
              <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Navigation</h4>
              <ul className="space-y-6 text-xs font-black tracking-widest uppercase">
                <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Home</button></li>
                <li><button onClick={() => navigateTo('history')} className="hover:text-primary transition-colors">History</button></li>
                <li><button onClick={() => navigateTo('pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>
            <div className="space-y-10">
              <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Knowledge</h4>
              <ul className="space-y-6 text-xs font-black tracking-widest uppercase">
                <li><button onClick={() => navigateTo('nutrition')} className="hover:text-primary transition-colors">The Lab</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-primary transition-colors">Support</button></li>
              </ul>
            </div>
            <div className="space-y-10">
              <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Legal</h4>
              <ul className="space-y-6 text-xs font-black tracking-widest uppercase">
                <li><button className="hover:text-primary transition-colors">Privacy</button></li>
                <li><button className="hover:text-primary transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-10 border-t border-white/5 mt-32 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-white/10 text-[10px] font-black tracking-[0.3em] uppercase">© {new Date().getFullYear()} BentoMagic Intelligence Studio</p>
        </div>
      </footer>
    </div>
  );
}

export default App;