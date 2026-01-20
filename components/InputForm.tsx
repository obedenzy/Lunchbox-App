'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Allergy, UserProfile } from '../types';
import { CheckIcon } from './Icons';

interface InputFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  initialProfile?: UserProfile | null;
}

const PREDEFINED_ALLERGIES: Allergy[] = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Egg', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Gluten-Free'
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialProfile }) => {
  const [age, setAge] = useState<number>(6);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [dietType, setDietType] = useState<UserProfile['dietType']>('Omnivore');
  const [preferences, setPreferences] = useState('');

  const weekOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    let current = new Date(firstDay);
    while (current.getDay() !== 1) current.setDate(current.getDate() + 1);
    for (let i = 1; i <= 4; i++) {
      const end = new Date(current);
      end.setDate(current.getDate() + 6);
      const startStr = current.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      options.push(`Week ${i}: ${startStr} - ${endStr}`);
      current.setDate(current.getDate() + 7);
    }
    return options;
  }, []);

  const [targetWeek, setTargetWeek] = useState(weekOptions[0]);

  useEffect(() => {
    if (initialProfile) {
      setAge(initialProfile.age);
      setSelectedAllergies(initialProfile.allergies || []);
      setDietType(initialProfile.dietType);
      setPreferences(initialProfile.preferences);
      setTargetWeek(initialProfile.targetWeek || weekOptions[0]);
    }
  }, [initialProfile, weekOptions]);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ age, allergies: selectedAllergies, dietType, preferences, targetWeek });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-navy/5 border-4 border-navy/5 text-left">
      <div className="space-y-10 md:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 md:mb-4 ml-2">Planning Week</label>
            <div className="relative">
              <select 
                value={targetWeek}
                onChange={(e) => setTargetWeek(e.target.value)}
                className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-sm font-black text-navy transition-all appearance-none"
              >
                {weekOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-navy/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 md:mb-4 ml-2">Child's Age</label>
            <div className="relative">
              <select
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-sm font-black text-navy transition-all appearance-none"
              >
                {Array.from({ length: 17 }, (_, i) => i + 2).map(val => (
                  <option key={val} value={val}>{val} years old</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-navy/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 md:mb-5 ml-2">Dietary Preferences</label>
          <div className="flex flex-wrap gap-2 md:gap-4">
            {(['Omnivore', 'Vegetarian', 'Vegan'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setDietType(type)}
                className={`flex-1 min-w-[100px] py-3 md:py-4 px-4 rounded-2xl text-xs font-black tracking-wide transition-all border-4 ${
                  dietType === type 
                    ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' 
                    : 'bg-white text-navy/60 border-navy/5 hover:border-primary/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 md:mb-5 ml-2">Allergies & Restrictions</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {PREDEFINED_ALLERGIES.map(allergy => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className={`flex items-center gap-2 py-2.5 px-4 md:px-6 rounded-xl text-[10px] font-black tracking-wide border-2 transition-all ${
                  selectedAllergies.includes(allergy)
                    ? 'border-primary bg-primary text-white shadow-lg'
                    : 'border-navy/5 bg-bg-cool text-navy/40 hover:border-navy/20'
                }`}
              >
                {selectedAllergies.includes(allergy) && <CheckIcon />}
                {allergy}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text"
              placeholder="Add custom restriction..."
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              className="flex-1 p-4 md:p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none text-sm font-black text-navy placeholder-navy/20"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAllergy())}
            />
            <button
              type="button"
              onClick={handleAddCustomAllergy}
              className="bg-navy text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs tracking-wide hover:bg-primary transition-all shadow-xl"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 md:mb-4 ml-2">Special Intelligence</label>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="w-full p-5 md:p-6 bg-bg-cool border-2 border-transparent rounded-2xl md:rounded-[2rem] focus:border-primary focus:bg-white focus:outline-none text-sm font-bold text-navy transition-all min-h-[100px] md:min-h-[120px] placeholder-navy/20"
            placeholder="e.g. Loves crunchy items, dislikes mushrooms, needs easy-to-open containers..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-black py-5 md:py-6 rounded-2xl transition-all shadow-2xl shadow-primary/30 hover:bg-primary-dark hover:translate-y-[-4px] disabled:opacity-50 flex items-center justify-center gap-4 text-lg md:text-xl tracking-tight mt-4"
        >
          {isLoading ? (
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Generate Weekly Menu</>
          )}
        </button>
      </div>
    </form>
  );
};