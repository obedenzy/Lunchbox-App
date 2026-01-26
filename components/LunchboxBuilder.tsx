'use client';

import React, { useState } from 'react';
import { LunchboxComponent } from '../types';

const SUGGESTIONS: LunchboxComponent[] = [
  { id: '1', name: 'Turkey Wrap', type: 'main', tags: ['High Protein', '5-min'] },
  { id: '2', name: 'Pasta Salad', type: 'main', tags: ['Vegetarian', 'Nut-free'] },
  { id: '3', name: 'Apple Slices', type: 'fruit', tags: ['Crunchy', 'Fiber'] },
  { id: '4', name: 'Baby Carrots', type: 'veg', tags: ['No-cook'] },
  { id: '5', name: 'Hummus Cup', type: 'snack', tags: ['Dip', 'Protein'] },
  { id: '6', name: 'Yogurt Tube', type: 'treat', tags: ['Calcium'] },
];

export const LunchboxBuilder: React.FC = () => {
  const [lunchbox, setLunchbox] = useState<Record<string, LunchboxComponent | null>>({
    main: null,
    produce: null,
    snack: null,
    treat: null,
  });

  const [activeTab, setActiveTab] = useState<string>('main');

  const selectItem = (item: LunchboxComponent) => {
    const key = item.type === 'fruit' || item.type === 'veg' ? 'produce' : item.type;
    setLunchbox(prev => ({ ...prev, [key]: item }));
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] border-4 border-navy/5 shadow-2xl text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Visual Container */}
        <div className="space-y-8">
           <h3 className="text-2xl font-black text-navy tracking-tight flex items-center gap-3">
             <div className="w-2 h-8 bg-secondary rounded-full" />
             Visual Builder
           </h3>
           
           <div className="aspect-square bg-bg-cool rounded-[3rem] p-8 grid grid-cols-2 grid-rows-2 gap-4 border-8 border-navy/5 shadow-inner">
             <div className={`row-span-2 rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center p-4 transition-all ${lunchbox.main ? 'bg-white border-primary border-solid' : 'bg-white/50 border-navy/10'}`}>
                {lunchbox.main ? (
                  <>
                    <span className="text-4xl mb-2">🍱</span>
                    <span className="text-[10px] font-black text-navy uppercase text-center">{lunchbox.main.name}</span>
                  </>
                ) : <span className="text-navy/10 font-black text-[10px] uppercase">Main</span>}
             </div>
             <div className={`rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center p-4 transition-all ${lunchbox.produce ? 'bg-white border-secondary border-solid' : 'bg-white/50 border-navy/10'}`}>
                {lunchbox.produce ? (
                  <>
                    <span className="text-4xl mb-2">🍎</span>
                    <span className="text-[10px] font-black text-navy uppercase text-center">{lunchbox.produce.name}</span>
                  </>
                ) : <span className="text-navy/10 font-black text-[10px] uppercase">Produce</span>}
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className={`rounded-[2rem] border-4 border-dashed flex items-center justify-center transition-all ${lunchbox.snack ? 'bg-white border-accent border-solid' : 'bg-white/50 border-navy/10'}`}>
                 {lunchbox.snack ? <span className="text-2xl">🥨</span> : <span className="text-navy/5">✨</span>}
               </div>
               <div className={`rounded-[2rem] border-4 border-dashed flex items-center justify-center transition-all ${lunchbox.treat ? 'bg-white border-primary border-solid' : 'bg-white/50 border-navy/10'}`}>
                 {lunchbox.treat ? <span className="text-2xl">🍪</span> : <span className="text-navy/5">🍭</span>}
               </div>
             </div>
           </div>
        </div>

        {/* Component Selector */}
        <div className="space-y-8">
          <div className="flex gap-2 bg-bg-cool p-2 rounded-2xl">
            {['main', 'produce', 'snack', 'treat'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-navy text-white shadow-lg' : 'text-navy/40 hover:text-navy'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {SUGGESTIONS.filter(s => activeTab === 'produce' ? (s.type === 'fruit' || s.type === 'veg') : s.type === activeTab).map(item => (
              <div 
                key={item.id}
                onClick={() => selectItem(item)}
                className="p-5 bg-bg-cool rounded-2xl border-2 border-transparent hover:border-primary cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h5 className="font-black text-navy">{item.name}</h5>
                  <div className="flex gap-2 mt-1">
                    {item.tags.map(t => <span key={t} className="text-[8px] font-black text-navy/30 uppercase">{t}</span>)}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">+</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};