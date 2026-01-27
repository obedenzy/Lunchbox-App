'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Allergy, UserProfile, Child } from '../types';
import { CheckIcon } from './Icons';

interface InputFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  initialProfile?: UserProfile | null;
  selectedChild?: Child | null;
}

const PREDEFINED_ALLERGIES: Allergy[] = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Egg', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Gluten-Free'
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialProfile, selectedChild }) => {
  const [age, setAge] = useState<number>(6);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [inputType, setInputType] = useState<'allergy' | 'ingredient'>('allergy');
  const [dietType, setDietType] = useState<UserProfile['dietType']>('Omnivore');
  const [preferences, setPreferences] = useState('');

  const weekOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    let current = new Date(now);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

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

  // Load from selected child
  useEffect(() => {
    if (selectedChild) {
      setAge(selectedChild.age);
      setSelectedAllergies(selectedChild.allergies || []);
      setExcludedIngredients(selectedChild.excludedIngredients || []);
      setDietType(selectedChild.dietType);
      setPreferences(selectedChild.preferences || '');
    } else if (initialProfile) {
      setAge(initialProfile.age);
      setSelectedAllergies(initialProfile.allergies);
      setExcludedIngredients(initialProfile.excludedIngredients || []);
      setDietType(initialProfile.dietType);
      setPreferences(initialProfile.preferences);
    }
  }, [selectedChild, initialProfile]);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    
    if (inputType === 'allergy') {
      if (!selectedAllergies.includes(trimmed)) setSelectedAllergies(prev => [...prev, trimmed]);
    } else {
      if (!excludedIngredients.includes(trimmed)) setExcludedIngredients(prev => [...prev, trimmed]);
    }
    setCustomInput('');
  };

  const removeExcluded = (item: string) => {
    setExcludedIngredients(prev => prev.filter(i => i !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ age, allergies: selectedAllergies, excludedIngredients, dietType, preferences, targetWeek });
  };

  const customAllergies = selectedAllergies.filter(a => !PREDEFINED_ALLERGIES.includes(a as any));

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-navy/5 border-4 border-navy/5 text-left relative overflow-hidden">
      {selectedChild && (
        <div className="absolute top-0 left-0 bg-primary text-white px-6 py-2 rounded-br-2xl text-[10px] font-black uppercase tracking-widest">
          Active Profile: {selectedChild.name}
        </div>
      )}
      
      <div className="space-y-10 md:space-y-12 mt-4">
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
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 md:mb-4 ml-2">Age for Portioning</label>
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
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 md:mb-5 ml-2">Dietary Rule</label>
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
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 md:mb-5 ml-2">Allergies & Exclusions</label>
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
            {customAllergies.map(allergy => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className="flex items-center gap-2 py-2.5 px-4 md:px-6 rounded-xl text-[10px] font-black tracking-wide border-2 border-primary bg-primary text-white shadow-lg transition-all"
              >
                <CheckIcon />
                {allergy}
              </button>
            ))}
          </div>

          {excludedIngredients.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
               {excludedIngredients.map(item => (
                 <div key={item} className="bg-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                   {item}
                   <button onClick={() => removeExcluded(item)} className="text-white/40 hover:text-white">×</button>
                 </div>
               ))}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex bg-bg-cool rounded-2xl border-2 border-transparent focus-within:border-primary transition-all overflow-hidden">
              <select 
                value={inputType} 
                onChange={(e) => setInputType(e.target.value as any)}
                className="bg-navy text-white px-4 py-4 text-[10px] font-black uppercase outline-none"
              >
                <option value="allergy">Allergy</option>
                <option value="ingredient">Exclude Ingredient</option>
              </select>
              <input 
                type="text"
                placeholder={inputType === 'allergy' ? "Add custom allergy..." : "e.g. No mushrooms, no olives..."}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 p-4 bg-transparent focus:outline-none text-sm font-black text-navy placeholder-navy/20"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustom}
              className="bg-navy text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs tracking-wide hover:bg-primary transition-all shadow-xl"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 md:mb-4 ml-2">Likes & Dislikes</label>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="w-full p-5 md:p-6 bg-bg-cool border-2 border-transparent rounded-[2rem] focus:border-primary focus:bg-white focus:outline-none text-sm font-bold text-navy transition-all min-h-[100px] placeholder-navy/20"
            placeholder="e.g. Loves crunchy items, needs easy-to-open containers..."
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
            <>Generate Magic Plan</>
          )}
        </button>
      </div>
    </form>
  );
};