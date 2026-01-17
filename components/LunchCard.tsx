
import React from 'react';
import { LunchDay } from '../types';

interface LunchCardProps {
  day: string;
  data: LunchDay;
}

export const LunchCard: React.FC<LunchCardProps> = ({ day, data }) => {
  const { macros } = data;
  const p = macros.protein || 0;
  const c = macros.carbs || 0;
  const f = macros.fat || 0;
  const total = (p + c + f) || 1;
  
  const pPct = Math.round((p / total) * 100);
  const cPct = Math.round((c / total) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  const chartStyle = {
    background: `conic-gradient(
      #FC4A1A 0% ${pPct}%, 
      #4ABDAC ${pPct}% ${pPct + cPct}%, 
      #A7C957 ${pPct + cPct}% 100%
    )`
  };

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-navy/5 border-2 border-navy/5 flex flex-col print-break-inside-avoid transition-all hover:shadow-primary/10 hover:border-primary/20 duration-500 group relative text-left">
      {/* Meal Image at the Top */}
      {data.imageUrl && (
        <div className="w-full h-64 md:h-[450px] overflow-hidden relative">
          <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            loading="lazy"
          />
          {/* Subtle overlay to ensure top-section content pops if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
        </div>
      )}

      {/* Header Info - Blended with navy background */}
      <div className="bg-navy p-8 md:p-12 text-white transition-colors group-hover:bg-navy/95 duration-500">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          <div className="flex-1 space-y-4">
            <span className="text-[10px] font-black tracking-widest text-primary block uppercase">{day} Menu</span>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{data.name}</h3>
            <div className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 w-fit">
               <div className="text-left">
                 <p className="text-[10px] font-black text-secondary tracking-widest uppercase">Target Fuel</p>
                 <p className="text-2xl font-black tracking-tight">{macros.calories} <span className="text-sm text-white/40">kcal</span></p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-4 space-y-8 md:space-y-12">
          <div className="flex flex-col sm:flex-row lg:flex-col gap-8 items-center sm:items-start">
            <div className="relative w-32 h-32 rounded-[2.5rem] flex-shrink-0 shadow-2xl border-8 border-bg-cool group-hover:scale-105 transition-transform duration-500" style={chartStyle}>
              <div className="absolute inset-8 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                 <span className="text-[10px] font-black text-navy/20 tracking-widest uppercase">Mix</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase mb-2">Macro Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-navy tracking-wide">
                  <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-md bg-primary" /> Protein</span>
                  <span className="text-navy/40">{pPct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-navy tracking-wide">
                  <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-md bg-secondary" /> Carbs</span>
                  <span className="text-navy/40">{cPct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-navy tracking-wide">
                  <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-md bg-accent" /> Fat</span>
                  <span className="text-navy/40">{fPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-cool p-8 rounded-[2rem] border-2 border-white shadow-xl relative overflow-hidden group/benefit">
            <div className="absolute top-0 right-0 p-4 text-4xl opacity-5 group-hover/benefit:scale-125 transition-transform">🍏</div>
            <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-4">Parent Note</p>
            <p className="text-lg font-bold text-navy/70 leading-relaxed italic">"{data.note}"</p>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase border-b-4 border-bg-cool pb-4">Inside the Box</h4>
            <ul className="space-y-6">
              {data.ingredients.map((ing, i) => (
                <li key={i} className="group/item relative pl-6">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary" />
                  <span className="text-lg text-navy font-black leading-tight block group-hover/item:text-primary transition-colors mb-1">{ing.name}</span>
                  <span className="text-xs text-navy/40 font-bold leading-tight block uppercase tracking-wide">{ing.benefit}</span>
                </li>
              ))}
              <li className="flex items-center gap-4 p-5 bg-secondary text-white rounded-2xl shadow-xl shadow-secondary/10 font-black text-sm">
                <span className="text-3xl">🧺</span>
                <span>Side: {data.snack}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase border-b-4 border-bg-cool pb-4">Preparation</h4>
            <div className="space-y-8">
              {data.steps.map((step, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-accent text-navy flex items-center justify-center font-black text-xs shadow-lg">{i + 1}</span>
                  <p className="text-lg text-navy font-bold leading-relaxed pt-1">{step}</p>
                </div>
              ))}
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase mb-2">Nutritional Edge</p>
                <p className="text-sm font-medium text-navy/60 leading-relaxed">{data.nutritionSummary}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-10 py-5 bg-navy text-white/40 border-t border-white/5 flex items-center justify-center text-center">
        <p className="text-[10px] font-black tracking-widest uppercase">Kid's Benefit: {data.kidBenefit}</p>
      </div>
    </div>
  );
};
