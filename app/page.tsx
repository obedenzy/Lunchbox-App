'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserProfile, WeeklyPlan, User, Child } from '../types';
import { InputForm } from '../components/InputForm';
import { LunchCard } from '../components/LunchCard';
import { AuthForm } from '../components/AuthForm';
import { StripeCheckout } from '../components/StripeCheckout';
import { ChildManager } from '../components/ChildManager';
import { AppleIcon, PrintIcon, UserIcon, LoadingIcon, CheckIcon, CreditCardIcon } from '../components/Icons';

type View = 'home' | 'history' | 'profile' | 'pricing' | 'payment' | 'faq' | 'about' | 'privacy' | 'status' | 'api';

interface TokenPack {
  tokens: number;
  price: string;
  label: string;
  icon: string;
  popular?: boolean;
}

const TOKEN_PACKS: TokenPack[] = [
  { tokens: 5, price: '$4.99', label: 'Snack Pack', icon: '⚡' },
  { tokens: 15, price: '$9.99', label: 'Bento Bundle', icon: '🍱', popular: true },
  { tokens: 50, price: '$24.99', label: 'Master Chef', icon: '🏆' }
];

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [history, setHistory] = useState<WeeklyPlan[]>([]);
  const [view, setView] = useState<View>('home');
  
  // History Filter States
  const [historyFilter, setHistoryFilter] = useState<'all' | 'saved' | 'not_saved'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedPack, setSelectedPack] = useState<TokenPack | null>(null);
  
  // Profile robust states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Define showToast early to avoid initialization errors
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

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
        setProfileName(parsed.name || '');
        setProfileEmail(parsed.email || '');
      }
    };
    loadUser();

    const viewParam = searchParams.get('view') as View;
    if (viewParam) setView(viewParam);

    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      showToast("Payment successful! Your credits have been added.");
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
      name: 'Bento Parent', email, tokens: 10, isLoggedIn: true, children: [], savedPlans: [],
    };
    setUser(mockUser);
    setProfileName(mockUser.name);
    setProfileEmail(mockUser.email);
    showToast("Welcome to BentoMagic!");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bento_user');
    setPlan(null);
    setView('home');
    showToast("Successfully logged out");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("CRITICAL ACTION: Are you sure you want to PERMANENTLY delete your account? This will erase all children profiles, saved plans, and remaining tokens. This cannot be undone.")) {
      localStorage.removeItem('bento_user');
      localStorage.removeItem('bento_history');
      setUser(null);
      setHistory([]);
      setPlan(null);
      setView('home');
      showToast("Account deleted successfully", "error");
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUser({ ...user, name: profileName, email: profileEmail });
    showToast("Profile updated successfully");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    showToast("Password changed successfully");
  };

  const toggleSavePlan = (planId: string) => {
    if (!user) return;
    const currentSaved = user.savedPlans || [];
    const isSaved = currentSaved.includes(planId);
    const newSaved = isSaved ? currentSaved.filter(id => id !== planId) : [...currentSaved, planId];
    setUser({ ...user, savedPlans: newSaved });
    showToast(isSaved ? "Plan removed" : "Plan saved!");
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
      setHistory(prev => [generatedPlan, ...prev]);
      setPlan(generatedPlan);
      setUser(prev => prev ? ({ ...prev, tokens: prev.tokens - 1 }) : null);
      showToast("Magic plan generated!");
    } catch (err: any) { 
      setError(err.message);
      showToast("Generation failed", "error");
    } finally { 
      setLoading(false); 
    }
  };

  const handleBuyCredits = (pack: TokenPack) => {
    if (!user) {
      showToast("Please sign in to purchase credits", "error");
      navigateTo('home');
      return;
    }
    setSelectedPack(pack);
    navigateTo('payment');
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
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleGenerate(plan.profile)}
                      className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-secondary text-white hover:bg-secondary-dark transition-all"
                    >
                      Regenerate
                    </button>
                    <button onClick={() => toggleSavePlan(plan.id)} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-4 ${isPlanSaved(plan.id) ? 'bg-primary text-white border-primary' : 'bg-white border-navy text-navy'}`}>
                      {isPlanSaved(plan.id) ? 'Saved' : 'Save to Profile'}
                    </button>
                    <button onClick={() => window.print()} className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><PrintIcon /> Print</button>
                  </div>
               </div>
               <div className="flex flex-col gap-12 md:gap-24 pb-20">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
                    <LunchCard key={day} day={day} data={plan[day]} />
                  ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const filteredHistory = history.filter(h => {
      // 1. Save Filter
      if (historyFilter !== 'all') {
        const saved = isPlanSaved(h.id);
        if (historyFilter === 'saved' && !saved) return false;
        if (historyFilter === 'not_saved' && saved) return false;
      }
      
      // 2. Month Filter
      if (monthFilter !== 'all') {
        const planMonth = new Date(h.timestamp).getMonth();
        if (planMonth !== parseInt(monthFilter)) return false;
      }

      // 3. Dietary Filter
      if (dietFilter !== 'all') {
        if (h.profile.dietType !== dietFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      // 4. Sort
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 space-y-12 pb-20">
        <div className="flex flex-col gap-8 border-b-4 border-navy/5 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-5xl font-black text-navy tracking-tight">Your History</h2>
            <div className="flex bg-white p-2 rounded-[1.5rem] border-2 border-navy/5 shadow-xl">
              {(['all', 'saved', 'not_saved'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === f ? 'bg-navy text-white shadow-xl' : 'text-navy/40 hover:text-navy'}`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-navy/5 shadow-lg flex flex-col gap-2">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-1">Filter by Month</label>
              <select 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-bg-cool p-3 rounded-xl font-black text-navy text-xs outline-none focus:border-primary border-2 border-transparent transition-all"
              >
                <option value="all">All Months</option>
                {months.map((m, i) => (
                  <option key={m} value={i.toString()}>{m}</option>
                ))}
              </select>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-navy/5 shadow-lg flex flex-col gap-2">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-1">Dietary Rule</label>
              <select 
                value={dietFilter}
                onChange={(e) => setDietFilter(e.target.value)}
                className="w-full bg-bg-cool p-3 rounded-xl font-black text-navy text-xs outline-none focus:border-primary border-2 border-transparent transition-all"
              >
                <option value="all">All Diets</option>
                <option value="Omnivore">Omnivore</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-navy/5 shadow-lg flex flex-col gap-2">
              <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest ml-1">Sort Order</label>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-bg-cool p-3 rounded-xl font-black text-navy text-xs outline-none focus:border-primary border-2 border-transparent transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border-2 border-primary/10 shadow-lg flex items-center justify-center">
               <div className="text-center">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">Active Results</p>
                 <p className="text-2xl font-black text-navy">{filteredHistory.length}</p>
               </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-12">
          {filteredHistory.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[3rem] border-4 border-navy/5">
              <p className="text-navy/20 font-black uppercase tracking-widest text-xs">No plans found in this category.</p>
            </div>
          ) : filteredHistory.map(h => (
            <div 
              key={h.id} 
              className={`bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 transition-all shadow-2xl relative ${isPlanSaved(h.id) ? 'border-primary' : 'border-navy/5'}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6 text-left">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{h.weekLabel}</span>
                    <button 
                      onClick={() => toggleSavePlan(h.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-4 ${isPlanSaved(h.id) ? 'bg-primary border-primary text-white' : 'bg-white border-navy/10 text-navy/20'}`}
                    >
                      {isPlanSaved(h.id) ? '★' : '☆'}
                    </button>
                  </div>
                  <h4 className="text-3xl font-black text-navy leading-tight">Plan for {user?.children.find(c => c.id === h.childId)?.name || 'Child'}</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-navy text-white rounded-lg text-[9px] font-black uppercase">{h.profile.age} Years</span>
                    <span className="px-3 py-1 bg-secondary text-white rounded-lg text-[9px] font-black uppercase">{h.profile.dietType}</span>
                    <span className="px-3 py-1 bg-accent text-white rounded-lg text-[9px] font-black uppercase">{new Date(h.timestamp).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => { setPlan(h); navigateTo('home'); }}
                    className="w-full bg-navy text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl"
                  >
                    Load Plan
                  </button>
                </div>
                
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
                      <div key={day} className="bg-bg-cool/50 p-6 rounded-2xl border-2 border-white shadow-xl text-left hover:border-primary/20 transition-all">
                         <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{day}</p>
                         <h5 className="text-sm font-black text-navy line-clamp-1 mb-2">{h[day].name}</h5>
                         <p className="text-[10px] font-bold text-navy/40 line-clamp-2 leading-relaxed">{h[day].kidBenefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-12">
      <div id="children-list" className="w-full">
        <ChildManager 
          children={user?.children || []} 
          onUpdate={(children) => setUser(prev => prev ? ({ ...prev, children }) : null)} 
          onSelect={setSelectedChildId}
          selectedChildId={selectedChildId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl text-center">
            <div className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mx-auto mb-8"><UserIcon className="w-12 h-12" /></div>
            <h2 className="text-3xl font-black text-navy tracking-tight">{user?.name}</h2>
            <p className="text-navy/40 font-black uppercase tracking-widest text-[10px] mt-2">{user?.email}</p>
            <div className="mt-8 pt-8 border-t-4 border-bg-cool">
               <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.2em] mb-2">Available Balance</p>
               <p className="text-4xl font-black text-navy">{user?.tokens} <span className="text-sm text-primary">Credits</span></p>
               <button onClick={() => navigateTo('pricing')} className="mt-6 w-full bg-navy text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl">Top Up Tokens</button>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl">
            <h3 className="text-xl font-black text-navy mb-8 border-b-4 border-bg-cool pb-4">Activity Stats</h3>
            <div className="space-y-6">
               <button 
                 onClick={() => { setHistoryFilter('saved'); navigateTo('history'); }}
                 className="w-full flex justify-between items-center group hover:bg-bg-cool/50 p-2 rounded-xl transition-all"
               >
                 <span className="text-[10px] font-black text-navy/30 uppercase tracking-widest group-hover:text-primary">Saved Plans</span>
                 <span className="text-xl font-black text-navy">{user?.savedPlans?.length || 0}</span>
               </button>
               <button 
                 onClick={() => { const el = document.getElementById('children-list'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                 className="w-full flex justify-between items-center group hover:bg-bg-cool/50 p-2 rounded-xl transition-all"
               >
                 <span className="text-[10px] font-black text-navy/30 uppercase tracking-widest group-hover:text-primary">Children</span>
                 <span className="text-xl font-black text-navy">{user?.children?.length || 0}</span>
               </button>
               <button 
                 onClick={() => { setHistoryFilter('all'); navigateTo('history'); }}
                 className="w-full flex justify-between items-center group hover:bg-bg-cool/50 p-2 rounded-xl transition-all"
               >
                 <span className="text-[10px] font-black text-navy/30 uppercase tracking-widest group-hover:text-primary">Total Generations</span>
                 <span className="text-xl font-black text-navy">{history.length}</span>
               </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl text-left space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-10">
                <h3 className="text-xl font-black text-navy tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  Profile Details
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Display Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
                    />
                  </div>
                  <button type="submit" className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl">Save Changes</button>
                </form>
              </div>

              <div className="space-y-10">
                <h3 className="text-xl font-black text-navy tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-secondary rounded-full" />
                  Update Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
                    />
                  </div>
                  <button type="submit" className="w-full border-4 border-navy/5 text-navy py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-primary transition-all">Update Password</button>
                </form>
              </div>
            </div>

            <div className="pt-12 border-t-4 border-bg-cool space-y-8">
              <h3 className="text-xl font-black text-navy tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-red-600 rounded-full" />
                Danger Zone
              </h3>
              <div className="p-8 bg-red-50 rounded-3xl border-2 border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                   <h4 className="font-black text-red-600">Delete Account</h4>
                   <p className="text-xs text-red-600/60 font-bold mt-1">Permanently remove your account and all associated data.</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto px-4 space-y-20">
      <div className="text-center space-y-6">
        <h2 className="text-6xl md:text-8xl font-black text-navy tracking-tight leading-none">Fuel Your<br/>Planning</h2>
        <p className="text-navy/40 font-black uppercase tracking-[0.2em] text-xs">Unlock professional lunch planning with generation credits.</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border-4 border-navy/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-bg-cool rounded-2xl flex items-center justify-center text-3xl">🪙</div>
          <div>
            <h3 className="text-2xl font-black text-navy">Current Balance</h3>
            <p className="text-navy/40 font-bold text-xs uppercase tracking-widest">Available to use right now</p>
          </div>
        </div>
        <div className="text-5xl font-black text-primary">{user?.tokens || 0} <span className="text-sm text-navy/20 uppercase tracking-widest">Credits</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TOKEN_PACKS.map(pack => (
          <div key={pack.label} className={`bg-white p-12 rounded-[3rem] border-4 text-center space-y-8 transition-all relative group flex flex-col ${pack.popular ? 'border-primary shadow-2xl scale-105 z-10' : 'border-navy/5 shadow-xl hover:border-primary/20'}`}>
            {pack.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Best Value</div>
            )}
            <div className="text-7xl group-hover:scale-110 transition-transform">{pack.icon}</div>
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-black text-navy">{pack.label}</h3>
              <p className="text-navy/40 font-black uppercase tracking-widest text-[10px]">{pack.tokens} Magic Credits</p>
            </div>
            <div className="text-5xl font-black text-primary tracking-tight">{pack.price}</div>
            <button 
              onClick={() => handleBuyCredits(pack)}
              className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl group-hover:translate-y-[-4px]"
            >
              {user ? 'Get Credits' : 'Sign in to Buy'}
            </button>
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
          { q: "How does BentoMagic work?", a: "We use advanced AI to generate customized meal plans based on your child's age, allergies, and preferences." },
          { q: "What are generation credits?", a: "Each credit (token) allows you to generate one full 7-day weekly plan." }
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
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8 text-lg font-bold text-navy/60">
        <p>BentoMagic combines culinary expertise with cutting-edge artificial intelligence to handle your planning, so you can handle the parenting.</p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">Privacy</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-8 text-lg font-bold text-navy/60">
        <p>We collect minimal data: email for account access, and planning preferences forSuggestions. We never sell your data.</p>
      </div>
    </div>
  );

  const renderStatus = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">Status</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl">
        <div className="flex items-center gap-6 p-8 bg-accent/10 border-2 border-accent/20 rounded-3xl">
           <div className="w-4 h-4 bg-accent rounded-full animate-pulse" />
           <p className="text-xl font-black text-navy">All Systems Operational</p>
        </div>
      </div>
    </div>
  );

  const renderAPI = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 text-left space-y-12">
      <h2 className="text-6xl font-black text-navy tracking-tight">API</h2>
      <div className="bg-white p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl">
        <p className="text-xl font-black text-navy">The BentoMagic Public API is currently in closed beta.</p>
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
          <span className="text-3xl font-black text-navy tracking-tighter">BentoMagic</span>
        </div>
        <div className="flex items-center gap-4 md:gap-10">
          <div className="hidden md:flex items-center gap-10 font-black text-base uppercase tracking-widest text-navy/40">
            <button onClick={() => navigateTo('home')} className={`hover:text-primary transition-colors ${view === 'home' ? 'text-primary' : ''}`}>Planner</button>
            <button onClick={() => navigateTo('pricing')} className={`hover:text-primary transition-colors ${view === 'pricing' ? 'text-primary' : ''}`}>Pricing</button>
            {user && <button onClick={() => navigateTo('history')} className={`hover:text-primary transition-colors ${view === 'history' ? 'text-primary' : ''}`}>History</button>}
          </div>
          {user && (
            <div className="flex items-center gap-3 md:gap-6 border-l-4 border-bg-cool pl-3 md:pl-10">
              <div onClick={() => navigateTo('pricing')} className="flex items-center gap-3 bg-navy text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-primary transition-all cursor-pointer group">
                 <span className="text-sm font-black">{user.tokens}</span>
                 <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:rotate-90 transition-transform">+</div>
              </div>
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-4 ${view === 'profile' ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20' : 'bg-bg-cool text-navy border-transparent hover:border-primary/20'}`}><UserIcon className="w-6 h-6" /></div>
              <button 
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-sm font-black text-primary hover:text-primary-dark uppercase tracking-widest transition-colors ml-4"
              >
                Logout
              </button>
            </div>
          )}
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
          <div className="max-w-4xl mx-auto px-4">
             <div className="text-center mb-12 space-y-4">
               <h2 className="text-5xl font-black text-navy tracking-tight">Complete Purchase</h2>
               <p className="text-navy/40 font-black uppercase text-xs tracking-widest">Secure checkout via Stripe</p>
             </div>
             <StripeCheckout 
               tokens={selectedPack.tokens} 
               amount={selectedPack.price} 
               label={selectedPack.label} 
               onCancel={() => { setSelectedPack(null); navigateTo('pricing'); }} 
             />
          </div>
        )}
      </main>
      <footer className="bg-navy py-24 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          <div className="space-y-10">
            <div className="flex items-center gap-4"><div className="p-3 bg-primary text-white rounded-xl shadow-2xl shadow-primary/20"><AppleIcon /></div><span className="text-2xl font-black text-white tracking-tighter">BentoMagic</span></div>
            <p className="text-white/30 font-bold leading-relaxed text-sm uppercase tracking-widest">Designing the future of family mealtime through intelligence.</p>
          </div>
          <div className="space-y-10">
            <h4 className="font-black text-white/20 tracking-[0.3em] text-[10px] uppercase">Product</h4>
            <ul className="space-y-6 text-xs font-black tracking-widest uppercase text-white/60">
              <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Generator</button></li>
              <li><button onClick={() => navigateTo('pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              {user && <li><button onClick={() => navigateTo('history')} className="hover:text-primary transition-colors">History</button></li>}
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
      </footer>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="min-h-screen bg-bg-cool flex items-center justify-center"><LoadingIcon /></div>}><PageContent /></Suspense>; }