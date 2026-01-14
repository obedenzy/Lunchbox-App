
import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyPlan, User } from './types';
import { generateLunchPlan } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { LunchCard } from './components/LunchCard';
import { AuthForm } from './components/AuthForm';
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
  const [processingPayment, setProcessingPayment] = useState(false);
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

  const buyTokens = async (pack: TokenPack) => {
    if (!user) return;
    setProcessingPayment(true);
    
    // Simulate real Stripe Processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setUser({ ...user, tokens: user.tokens + pack.tokens });
    setView('home');
    setSelectedPack(null);
    setProcessingPayment(false);
    setToast({ message: `Successfully purchased ${pack.tokens} tokens!`, type: 'success' });
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
      setToast({ message: "Weekly plan generated!", type: 'success' });
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
    <div className="space-y-8 md:space-y-16 px-4">
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
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 text-primary-dark rounded-xl text-center text-sm font-bold animate-pulse">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <div className="max-w-4xl mx-auto py-20 flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-navy/10 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-6 text-navy/60 font-black tracking-wide text-sm">Crafting your menu...</p>
        </div>
      )}

      {plan && !loading && (
        <section className="space-y-8 md:space-y-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print border-b-4 border-navy pb-8">
            <div>
              <p className="text-primary font-black text-xs tracking-wide mb-2">{plan.weekLabel}</p>
              <h2 className="text-3xl md:text-4xl font-black text-navy tracking-tight">Your Weekly Menu</h2>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
              <button
                onClick={() => toggleSavePlan(plan.id)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all text-sm tracking-wide border-2 ${
                  isPlanSaved(plan.id) 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-white border-navy text-navy hover:bg-navy hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill={isPlanSaved(plan.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isPlanSaved(plan.id) ? 'Saved' : 'Save Plan'}
              </button>

              <button
                onClick={() => handleGenerate(plan.profile)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-black text-sm tracking-wide hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20"
              >
                Regenerate
              </button>
              
              <button
                onClick={() => window.print()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-black text-sm tracking-wide hover:bg-navy/90 transition-all shadow-md"
              >
                <PrintIcon />
                Print
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-12">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => (
              <LunchCard key={day} day={day} data={plan[day]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderHistory = () => {
    const filteredHistory = history.filter(h => historyFilter === 'all' || isPlanSaved(h.id));
    return (
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h2 className="text-3xl font-black text-navy tracking-tight">Lunchbox History</h2>
          <div className="flex bg-navy p-1.5 rounded-2xl w-full sm:w-auto shadow-xl shadow-navy/10 overflow-hidden">
            <button 
              onClick={() => setHistoryFilter('all')}
              className={`flex-1 px-4 md:px-8 py-2.5 rounded-xl text-xs font-black transition-all tracking-wide ${historyFilter === 'all' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
            >
              All Plans
            </button>
            <button 
              onClick={() => setHistoryFilter('saved')}
              className={`flex-1 px-4 md:px-8 py-2.5 rounded-xl text-xs font-black transition-all tracking-wide ${historyFilter === 'saved' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
            >
              Saved
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 md:py-32 bg-white rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-navy/10">
            <p className="text-navy/30 font-black tracking-wide text-lg">No plans found in your history.</p>
            <button onClick={() => navigateTo('home')} className="mt-8 bg-primary text-white px-10 py-4 rounded-2xl font-black tracking-wide hover:scale-105 transition-transform shadow-xl shadow-primary/20">Create a Plan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {filteredHistory.map((h) => (
              <div key={h.id} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 border-navy/5 flex flex-col gap-6 md:gap-8 hover:border-primary transition-all hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-10">
                  <div className="flex-1 space-y-4 md:space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-primary tracking-wide bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">{h.weekLabel.split(':')[0]}</span>
                      <span className="text-xs text-navy/40 font-black tracking-wide">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-black text-navy text-xl md:text-2xl tracking-tight">Weekly Summary</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                        {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map(day => (
                          <div key={day} className="flex gap-2 text-xs items-baseline border-b border-navy/5 pb-2">
                            <span className="font-black text-secondary w-8 flex-shrink-0">{day.slice(0, 3)}</span>
                            <span className="text-navy font-bold truncate">{(h as any)[day].name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] bg-navy text-white px-3 py-1.5 rounded-lg font-black tracking-wide">{h.profile.age} Years</span>
                      <span className="text-[10px] bg-secondary text-white px-3 py-1.5 rounded-lg font-black tracking-wide">{h.profile.dietType}</span>
                      {h.profile.allergies.map(a => (
                        <span key={a} className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-lg font-black tracking-wide">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 min-w-fit">
                    <button onClick={() => toggleSavePlan(h.id)} className={`p-4 md:p-5 rounded-2xl border-2 transition-all ${isPlanSaved(h.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-navy text-navy hover:bg-navy hover:text-white'}`}>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill={isPlanSaved(h.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleLoadPlanFromHistory(h)}
                      className="flex-1 bg-navy text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl text-xs font-black shadow-xl hover:bg-primary transition-all active:scale-95 tracking-wide"
                    >
                      View Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderPricing = () => (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-black text-navy tracking-tight">Pricing and Plans</h2>
        <p className="text-navy/50 font-black tracking-wide text-sm">Select a token pack to generate more healthy meal plans.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {TOKEN_PACKS.map((pack) => (
          <button
            key={pack.tokens}
            onClick={() => {
              setSelectedPack(pack);
              navigateTo('payment');
            }}
            className={`relative p-8 md:p-10 rounded-[2.5rem] border-4 text-left transition-all hover:translate-y-[-4px] group flex flex-col justify-between h-full ${pack.popular ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/20' : 'bg-white border-navy text-navy hover:border-secondary hover:shadow-xl'}`}
          >
            {pack.popular && <span className="absolute -top-4 right-10 bg-navy text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-wide">Best Value</span>}
            <div className="space-y-4">
              <span className="text-5xl block filter group-hover:rotate-12 transition-transform">{pack.icon}</span>
              <div>
                <p className={`text-[10px] font-black tracking-wide mb-1 ${pack.popular ? 'text-white/60' : 'text-navy/40'}`}>{pack.label}</p>
                <h3 className="text-3xl font-black tracking-tight leading-none">{pack.tokens} Tokens</h3>
              </div>
            </div>
            <div className="mt-8 flex items-end justify-between">
              <p className={`text-2xl font-black ${pack.popular ? 'text-white' : 'text-primary'}`}>{pack.price}</p>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest ${pack.popular ? 'bg-white text-primary' : 'bg-navy text-white'}`}>Select</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  const renderPayment = () => {
    if (!selectedPack) {
      navigateTo('pricing');
      return null;
    }

    return (
      <section className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-navy tracking-tight">Secure Checkout</h2>
            <p className="text-navy/50 font-black tracking-wide text-sm">Purchasing {selectedPack.label} ({selectedPack.tokens} tokens) for {selectedPack.price}</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            buyTokens(selectedPack);
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/40 tracking-wide block ml-2">Email Address</label>
                <input 
                  type="email"
                  defaultValue={user?.email}
                  className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black text-lg transition-all stripe-input"
                  placeholder="name@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/40 tracking-wide block ml-2">Card Information</label>
                <div className="relative group">
                  <input 
                    required
                    disabled={processingPayment}
                    type="text"
                    placeholder="1234 5678 1234 5678"
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black text-lg transition-all pr-12 stripe-input disabled:opacity-50"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-navy/20">
                    <CreditCardIcon />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <input 
                    required
                    disabled={processingPayment}
                    type="text"
                    placeholder="MM / YY"
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black text-lg transition-all stripe-input disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <input 
                    required
                    disabled={processingPayment}
                    type="text"
                    placeholder="CVC"
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black text-lg transition-all stripe-input disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={processingPayment}
              className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all tracking-wide text-xl flex items-center justify-center gap-3 disabled:opacity-75 mt-4"
            >
              {processingPayment ? (
                <>
                  <LoadingIcon />
                  Processing Transaction...
                </>
              ) : (
                <>Complete Purchase: {selectedPack.price}</>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-navy/30 text-[10px] font-black tracking-widest uppercase">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            SSL Secure Checkout
          </div>
          
          <button 
            disabled={processingPayment}
            onClick={() => navigateTo('pricing')}
            className="w-full text-center text-xs font-black text-navy/40 hover:text-navy transition-colors tracking-wide disabled:opacity-30"
          >
            Cancel Transaction
          </button>
        </div>
      </section>
    );
  };

  const renderProfile = () => (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500 pb-safe">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        
        {/* Left Side: Profile & Stats */}
        <div className="lg:col-span-4 space-y-8 md:space-y-10">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 border-navy/5 shadow-2xl text-center space-y-8">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2rem] bg-bg-cool border-4 border-white text-5xl shadow-inner relative mx-auto">
               <span className="text-navy"><UserIcon className="w-16 h-16" /></span>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full border-4 border-white flex items-center justify-center text-white text-xs font-black">★</div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-navy">{user?.name}</h2>
              <p className="text-navy/40 font-bold text-sm">{user?.email}</p>
            </div>
            <div className="pt-6 border-t-2 border-bg-cool grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-cool rounded-2xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-navy/30 tracking-widest mb-1">Tokens</p>
                <p className="text-2xl font-black text-primary">{user?.tokens}</p>
              </div>
              <div className="p-4 bg-bg-cool rounded-2xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-navy/30 tracking-widest mb-1">Plans</p>
                <p className="text-2xl font-black text-navy">{user?.stats?.totalPlansGenerated}</p>
              </div>
            </div>
            <p className="text-[10px] font-black text-navy/20 tracking-widest">Joined {user?.stats?.joinedDate}</p>
          </div>

          <div className="bg-navy p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white space-y-6">
            <h3 className="text-xl font-black tracking-tight">Need Support?</h3>
            <p className="text-white/60 font-medium text-sm leading-relaxed">Our nutritionist-parents are here to help you design the best lunchboxes for your family.</p>
            <button onClick={() => navigateTo('contact')} className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl transition-all text-sm tracking-wide">Contact Team</button>
          </div>
        </div>

        {/* Right Side: Settings Forms */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-12">
            
            {/* Account Settings */}
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-secondary/20 pb-4 gap-2">
                <h3 className="text-2xl font-black text-navy">Global Preferences</h3>
                <span className="text-[10px] font-black text-secondary tracking-widest">Default Settings</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="text-[10px] font-black text-navy/40 tracking-wide block mb-3 ml-2">Parent Name</label>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black transition-all"
                    placeholder="Chef's Name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy/40 tracking-wide block mb-3 ml-2">Default Child Age</label>
                  <select 
                    value={defaultAge}
                    onChange={(e) => setDefaultAge(parseInt(e.target.value))}
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black transition-all appearance-none"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 2).map(val => (
                      <option key={val} value={val}>{val} Years Old</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-navy/40 tracking-wide block mb-3 ml-2">Preferred Diet Type</label>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  {(['Omnivore', 'Vegetarian', 'Vegan'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDefaultDiet(type)}
                      className={`flex-1 min-w-[100px] py-4 rounded-2xl text-xs font-black tracking-wide transition-all border-4 ${
                        defaultDiet === type 
                          ? 'bg-secondary text-white border-secondary shadow-lg' 
                          : 'bg-white text-navy/40 border-navy/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full sm:w-auto bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all tracking-wide text-lg">
                Update Settings
              </button>
            </form>

            {/* Security Settings */}
            <form onSubmit={handleChangePassword} className="space-y-8 pt-10 border-t-4 border-bg-cool">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-primary/20 pb-4 gap-2">
                <h3 className="text-2xl font-black text-navy">Security</h3>
                <span className="text-[10px] font-black text-primary tracking-widest">Authentication</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="text-[10px] font-black text-navy/40 tracking-wide block mb-3 ml-2">New Password</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy/40 tracking-wide block mb-3 ml-2">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-navy font-black transition-all"
                  />
                </div>
              </div>
              <button type="submit" className="w-full sm:w-auto bg-navy text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-navy/20 hover:bg-navy/90 transition-all tracking-wide text-lg">
                Update Password
              </button>
            </form>

            {/* Danger Zone */}
            <div className="pt-10 border-t-4 border-primary/10 space-y-6">
              <div className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border-2 border-primary/10">
                <h4 className="text-primary font-black mb-2">Danger Zone</h4>
                <p className="text-navy/60 text-sm mb-6 leading-relaxed">Permanently closing your account will erase your library, stats, and any remaining credits. This is non-reversible.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleLogout} className="text-xs font-black text-navy/40 hover:text-navy transition-colors tracking-wide px-6 py-3 bg-white rounded-xl shadow-sm border border-navy/5">Sign Out Only</button>
                  <button onClick={handleDeleteAccount} className="text-xs font-black text-primary hover:text-primary-dark transition-colors tracking-wide px-6 py-3 bg-white rounded-xl shadow-sm border border-primary/10">Delete Account Permanently</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderStaticPage = (title: string, content: string, accentColor: string = "primary") => (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500 pb-safe">
      <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] border-4 border-navy/5 shadow-2xl space-y-10">
        <h2 className={`text-4xl md:text-5xl font-black text-navy tracking-tight border-b-8 border-${accentColor} pb-8 w-fit`}>{title}</h2>
        <div className="text-navy/70 font-bold text-base md:text-lg leading-relaxed whitespace-pre-wrap">{content}</div>
        <button onClick={() => navigateTo('home')} className="bg-navy text-white px-10 py-5 rounded-2xl font-black tracking-wide shadow-xl hover:bg-primary transition-all">Back to Home</button>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary-dark overflow-x-hidden">
      {toast && (
        <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-6 duration-300 no-print w-[90%] md:w-auto">
          <div className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-2xl font-black text-xs tracking-wide flex items-center justify-center gap-4 bg-white border-2 ${
            toast.type === 'success' ? 'text-secondary border-secondary' : 'text-primary border-primary'
          }`}>
            <span className="text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-2xl border-b-2 border-navy/5 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="p-2 md:p-3 bg-primary text-white rounded-xl md:rounded-2xl shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
              <AppleIcon />
            </div>
            <span className="text-xl md:text-2xl font-black text-navy tracking-tight">BentoMagic</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-black tracking-widest text-navy/40 uppercase">
              <button onClick={() => navigateTo('home')} className={`hover:text-primary transition-colors ${view === 'home' ? 'text-primary' : ''}`}>Home</button>
              <button onClick={() => navigateTo('pricing')} className={`hover:text-primary transition-colors ${view === 'pricing' ? 'text-primary' : ''}`}>Pricing</button>
              {user && (
                <>
                  <button onClick={() => navigateTo('history')} className={`hover:text-primary transition-colors ${view === 'history' ? 'text-primary' : ''}`}>History</button>
                  <div onClick={() => navigateTo('pricing')} className="flex items-center gap-3 bg-navy px-5 py-2.5 rounded-xl cursor-pointer hover:bg-primary transition-all group shadow-xl shadow-navy/10">
                    <span className="text-white normal-case font-black">{user.tokens} Tokens</span>
                    <div className="w-5 h-5 bg-white text-navy rounded-lg flex items-center justify-center text-[10px] shadow-inner font-black">+</div>
                  </div>
                </>
              )}
            </div>
            {!user ? (
              <button onClick={() => navigateTo('home')} className="bg-navy text-white px-8 py-3.5 rounded-xl text-[10px] font-black tracking-widest hover:bg-primary transition-all shadow-xl shadow-navy/10 uppercase">Launch App</button>
            ) : (
              <div onClick={() => navigateTo('profile')} className={`w-12 h-12 rounded-2xl border-4 border-bg-cool flex items-center justify-center cursor-pointer hover:border-primary transition-all bg-white overflow-hidden shadow-inner ${view === 'profile' ? 'border-primary ring-8 ring-primary/5' : ''}`}>
                <span className="text-navy transition-colors hover:text-primary">
                  <UserIcon className="w-6 h-6" />
                </span>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-navy hover:text-primary transition-colors focus:outline-none" aria-label="Toggle Menu">
            {isMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed top-20 left-0 w-full h-[calc(100vh-5rem)] bg-white border-b-2 border-navy/5 transition-all duration-300 z-40 overflow-y-auto ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="p-6 space-y-8 pb-32">
            <div className="flex flex-col gap-6">
              {user ? (
                <div className="flex items-center justify-between pb-6 border-b border-navy/5">
                  <div onClick={() => navigateTo('profile')} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-bg-cool rounded-xl flex items-center justify-center text-navy shadow-inner"><UserIcon className="w-6 h-6" /></div>
                    <div className="flex flex-col">
                      <span className="font-black text-navy text-lg">{user.name}</span>
                      <span className="text-xs text-navy/40 font-bold">{user.email}</span>
                    </div>
                  </div>
                  <div onClick={() => navigateTo('pricing')} className="bg-navy px-4 py-2 rounded-xl text-white text-[10px] font-black shadow-lg">
                    {user.tokens} Tokens
                  </div>
                </div>
              ) : (
                <div className="pb-6 border-b border-navy/5">
                  <button onClick={() => navigateTo('home')} className="w-full bg-navy text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-navy/10">Sign In to Continue</button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => navigateTo('home')} className={`w-full p-5 rounded-2xl text-sm font-black tracking-widest text-left flex items-center justify-between ${view === 'home' ? 'bg-primary text-white' : 'bg-bg-cool text-navy'}`}>
                  Home
                  {view === 'home' && <CheckIcon />}
                </button>
                <button onClick={() => navigateTo('pricing')} className={`w-full p-5 rounded-2xl text-sm font-black tracking-widest text-left flex items-center justify-between ${view === 'pricing' ? 'bg-primary text-white' : 'bg-bg-cool text-navy'}`}>
                  Pricing
                  {view === 'pricing' && <CheckIcon />}
                </button>
                {user && (
                  <>
                    <button onClick={() => navigateTo('history')} className={`w-full p-5 rounded-2xl text-sm font-black tracking-widest text-left flex items-center justify-between ${view === 'history' ? 'bg-primary text-white' : 'bg-bg-cool text-navy'}`}>
                      History
                      {view === 'history' && <CheckIcon />}
                    </button>
                    <button onClick={() => navigateTo('profile')} className={`w-full p-5 rounded-2xl text-sm font-black tracking-widest text-left flex items-center justify-between ${view === 'profile' ? 'bg-primary text-white' : 'bg-bg-cool text-navy'}`}>
                      Profile
                      {view === 'profile' && <CheckIcon />}
                    </button>
                  </>
                )}
              </div>

              {user && (
                <button onClick={handleLogout} className="w-full p-5 text-sm font-black text-primary border-4 border-primary/10 rounded-2xl hover:bg-primary/5 transition-colors tracking-widest mt-4">Sign Out</button>
              )}
            </div>

            <div className="pt-10 space-y-6">
              <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase ml-2">Resources</h4>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => navigateTo('nutrition')} className="text-left px-5 py-3 text-navy/60 font-bold hover:text-primary transition-colors">The Lab</button>
                <button onClick={() => navigateTo('contact')} className="text-left px-5 py-3 text-navy/60 font-bold hover:text-primary transition-colors">Support</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <header className="max-w-5xl mx-auto pt-16 md:pt-28 pb-12 md:pb-20 text-center no-print px-4">
        <div className="inline-block px-4 md:px-6 py-2 bg-secondary/10 text-secondary-dark rounded-full text-[10px] font-black tracking-widest mb-6 md:mb-8 border border-secondary/20">
          Smart Meal Planning
        </div>
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-navy mb-6 md:mb-8 tracking-tight leading-[1.1] md:leading-[0.9]">
          {view === 'home' ? 'Stress-Free Lunchboxes' : view.charAt(0).toUpperCase() + view.slice(1)}
        </h1>
        <p className="text-navy/50 font-black tracking-widest text-xs md:text-sm max-w-2xl mx-auto">Creative, healthy, and kid-approved lunchbox ideas designed for stress-free mornings.</p>
      </header>

      <main className="flex-1 pb-20 md:pb-32">
        {view === 'home' && renderHome()}
        {view === 'history' && renderHistory()}
        {view === 'profile' && renderProfile()}
        {view === 'pricing' && renderPricing()}
        {view === 'payment' && renderPayment()}
        {view === 'nutrition' && renderStaticPage('The Lab', 'BentoMagic is designed using pediatrically approved macronutrient ratios. We focus on low-GI carbohydrates for focus, lean proteins for physical growth, and essential fats for cognitive development.', 'accent')}
        {view === 'contact' && renderStaticPage('Support Team', 'Need help or have suggestions? Reach out to support@bentomagic.ai. Our team of nutritionist-parents is here for you 24/7.', 'navy')}
      </main>

      <footer className="bg-navy py-16 md:py-28 no-print mt-auto text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col lg:flex-row justify-between items-start gap-12 md:gap-20">
          <div className="space-y-6 md:space-y-8 max-w-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-white rounded-2xl"><AppleIcon /></div>
              <span className="text-3xl font-black tracking-tight">BentoMagic</span>
            </div>
            <p className="text-white/40 font-bold leading-relaxed text-base md:text-lg">Intelligent lunchbox planning for busy modern families.</p>
            <div className="flex gap-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-primary hover:scale-110 transition-all cursor-pointer flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-white/20" />
                 </div>
               ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-20 w-full lg:w-auto">
            <div className="space-y-6 md:space-y-8">
              <h4 className="font-black text-white/40 tracking-widest text-[10px] uppercase">App</h4>
              <ul className="space-y-4 md:space-y-6 text-sm font-black tracking-wide">
                <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Home</button></li>
                <li><button onClick={() => navigateTo('history')} className="hover:text-primary transition-colors">History</button></li>
                <li><button onClick={() => navigateTo('pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>
            <div className="space-y-6 md:space-y-8">
              <h4 className="font-black text-white/40 tracking-widest text-[10px] uppercase">Resources</h4>
              <ul className="space-y-4 md:space-y-6 text-sm font-black tracking-wide">
                <li><button onClick={() => navigateTo('nutrition')} className="hover:text-primary transition-colors">The Lab</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-primary transition-colors">Support</button></li>
              </ul>
            </div>
            <div className="space-y-6 md:space-y-8">
              <h4 className="font-black text-white/40 tracking-widest text-[10px] uppercase">Protocols</h4>
              <ul className="space-y-4 md:space-y-6 text-sm font-black tracking-wide">
                <li><button className="hover:text-primary transition-colors">Privacy</button></li>
                <li><button className="hover:text-primary transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-10 border-t border-white/5 mt-16 md:mt-28 pt-10 text-center">
           <p className="text-white/20 text-[10px] font-black tracking-widest">© {new Date().getFullYear()} BentoMagic Intelligence Lab. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
