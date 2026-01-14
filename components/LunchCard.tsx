
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
      <div className="bg-navy p-8 md:p-14 text-white transition-colors group-hover:bg-navy/95 duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
        <div>
          <span className="text-[10px] font-black tracking-widest text-primary block mb-3 md:mb-4">{day} Menu</span>
          <h3 className="text-2xl md:text-5xl font-black tracking-tight leading-[1.1] md:leading-[0.9]" title={data.name}>{data.name}</h3>
        </div>
        <div className="flex items-center gap-6 bg-white/5 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl backdrop-blur-xl border-2 border-white/10 shadow-2xl">
           <div className="text-right">
             <p className="text-[10px] font-black text-secondary tracking-widest mb-1">Energy Profile</p>
             <p className="text-2xl md:text-3xl font-black tracking-tight">{macros.calories} <span className="text-sm text-white/40">kcal</span></p>
           </div>
        </div>
      </div>

      <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 lg:gap-20">
        <div className="lg:col-span-4 space-y-8 md:space-y-12">
          <div className="flex flex-col items-center sm:flex-row gap-8 md:gap-10 lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] flex-shrink-0 shadow-2xl border-4 md:border-8 border-bg-cool group-hover:scale-110 transition-transform duration-700" style={chartStyle}>
              <div className="absolute inset-6 md:inset-8 bg-white rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-inner">
                 <span className="text-[8px] md:text-[10px] font-black text-navy/20 tracking-widest uppercase">Fuel</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4 md:space-y-5">
              <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase mb-2 md:mb-4">Macro Balance</h4>
              <div className="space-y-2 md:space-y-3">
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

          <div className="bg-bg-cool p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-4xl opacity-10">★</div>
            <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-3 md:mb-4">Kid-Friendly Benefit</p>
            <p className="text-base md:text-lg font-bold text-navy/70 leading-relaxed">{data.kidBenefit}</p>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20">
          <div className="space-y-8 md:space-y-10">
            <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase mb-4 md:mb-8 border-b-4 border-bg-cool pb-4">Ingredients</h4>
            <ul className="space-y-6 md:space-y-8">
              {data.ingredients.map((ing, i) => (
                <li key={i} className="group/item relative pl-6">
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
                  <span className="text-base md:text-lg text-navy font-black leading-tight block group-hover/item:text-primary transition-colors mb-1 tracking-tight">{ing.name}</span>
                  <span className="text-[10px] md:text-xs text-navy/40 font-bold leading-tight block tracking-wide">{ing.benefit}</span>
                </li>
              ))}
              <li className="flex items-center gap-4 md:gap-5 p-4 md:p-6 bg-secondary text-white rounded-[1.25rem] md:rounded-2xl shadow-xl shadow-secondary/10 tracking-wide font-black text-sm">
                <span className="text-2xl md:text-3xl">🍏</span>
                <span>Snack: {data.snack}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-8 md:space-y-10">
            <h4 className="text-[10px] font-black text-navy/30 tracking-widest uppercase mb-4 md:mb-8 border-b-4 border-bg-cool pb-4">Quick Steps</h4>
            <div className="space-y-6 md:space-y-8">
              {data.steps.map((step, i) => (
                <div key={i} className="flex gap-4 md:gap-6 items-start">
                  <span className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-accent text-navy flex items-center justify-center font-black text-xs shadow-xl shadow-accent/20">{i + 1}</span>
                  <p className="text-base md:text-lg text-navy font-bold leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 md:px-10 py-4 md:py-6 bg-navy text-white/40 border-t border-white/5 flex items-center justify-center text-center">
        <p className="text-[10px] font-black tracking-widest uppercase">Note: {data.note}</p>
      </div>
    </div>
  );
};
