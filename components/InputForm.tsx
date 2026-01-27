'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Allergy, UserProfile, Child } from '../types';
import { CheckIcon, LoadingIcon } from './Icons';

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
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [inputType, setInputType] = useState<'allergy' | 'exclude' | 'available'>('allergy');
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

  useEffect(() => {
    if (selectedChild) {
      setAge(selectedChild.age);
      setSelectedAllergies(selectedChild.allergies || []);
      setExcludedIngredients(selectedChild.excludedIngredients || []);
      setAvailableIngredients(selectedChild.availableIngredients || []);
      setDietType(selectedChild.dietType);
      setPreferences(selectedChild.preferences || '');
    } else if (initialProfile) {
      setAge(initialProfile.age);
      setSelectedAllergies(initialProfile.allergies);
      setExcludedIngredients(initialProfile.excludedIngredients || []);
      setAvailableIngredients(initialProfile.availableIngredients || []);
      setDietType(initialProfile.dietType);
      setPreferences(initialProfile.preferences);
    }
  }, [selectedChild, initialProfile]);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy) 
        : [...prev, allergy]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    
    if (inputType === 'allergy') {
      if (!selectedAllergies.includes(trimmed)) setSelectedAllergies(prev => [...prev, trimmed]);
    } else if (inputType === 'exclude') {
      if (!excludedIngredients.includes(trimmed)) setExcludedIngredients(prev => [...prev, trimmed]);
    } else {
      if (!availableIngredients.includes(trimmed)) setAvailableIngredients(prev => [...prev, trimmed]);
    }
    setCustomInput('');
  };

  const removeTag = (item: string, type: 'allergy' | 'exclude' | 'available') => {
    if (type === 'allergy') setSelectedAllergies(prev => prev.filter(i => i !== item));
    else if (type === 'exclude') setExcludedIngredients(prev => prev.filter(i => i !== item));
    else setAvailableIngredients(prev => prev.filter(i => i !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ age, allergies: selectedAllergies, excludedIngredients, availableIngredients, dietType, preferences, targetWeek });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-navy/5 border-4 border-navy/5 text-left relative overflow-hidden">
      <div className="space-y-10 md:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 ml-2">Planning Week</label>
            <select value={targetWeek} onChange={(e) => setTargetWeek(e.target.value)} className="w-full p-4 bg-bg-cool border-2 border-transparent rounded-2xl font-black text-navy outline-none focus:border-primary transition-all">
              {weekOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-3 ml-2">Child's Age</label>
            <select value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full p-4 bg-bg-cool border-2 border-transparent rounded-2xl font-black text-navy outline-none focus:border-primary transition-all">
              {Array.from({ length: 17 }, (_, i) => i + 2).map(val => (<option key={val} value={val}>{val} years old</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 ml-2">Dietary Rule</label>
          <div className="flex flex-wrap gap-4">
            {(['Omnivore', 'Vegetarian', 'Vegan'] as const).map(type => (
              <button key={type} type="button" onClick={() => setDietType(type)} className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border-4 uppercase ${dietType === type ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white text-navy/60 border-navy/5 hover:border-primary/20'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 ml-2">Common Allergies</label>
          <div className="flex flex-wrap gap-2 mb-8">
            {PREDEFINED_ALLERGIES.map(a => (
              <button 
                key={a}
                type="button"
                onClick={() => toggleAllergy(a)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${selectedAllergies.includes(a) ? 'bg-primary border-primary text-white' : 'bg-bg-cool border-transparent text-navy/40'}`}
              >
                {a}
              </button>
            ))}
          </div>

          <label className="block text-[10px] font-black text-navy/40 tracking-widest uppercase mb-4 ml-2">Personalize Ingredients</label>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex bg-bg-cool rounded-2xl border-2 border-transparent focus-within:border-primary transition-all overflow-hidden">
                <select value={inputType} onChange={(e) => setInputType(e.target.value as any)} className="bg-navy text-white px-4 py-4 text-[10px] font-black uppercase outline-none">
                  <option value="allergy">Allergy</option>
                  <option value="exclude">Exclude</option>
                  <option value="available">On-Hand</option>
                </select>
                <input 
                  type="text"
                  placeholder={inputType === 'available' ? "Ingredients you have..." : "Add custom..."}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 p-4 bg-transparent focus:outline-none text-sm font-black text-navy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
                />
              </div>
              <button type="button" onClick={handleAddCustom} className="bg-navy text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl">Add</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedAllergies.filter(a => !PREDEFINED_ALLERGIES.includes(a as any)).map(item => (
                <div key={item} className="bg-navy/10 text-navy px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  Allergy: {item} <button onClick={() => removeTag(item, 'allergy')} className="hover:text-navy/60">×</button>
                </div>
              ))}
              {excludedIngredients.map(item => (
                <div key={item} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  No {item} <button onClick={() => removeTag(item, 'exclude')} className="hover:text-primary-dark">×</button>
                </div>
              ))}
              {availableIngredients.map(item => (
                <div key={item} className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  Have {item} <button onClick={() => removeTag(item, 'available')} className="hover:text-secondary-dark">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-primary/30 hover:bg-primary-dark hover:translate-y-[-4px] disabled:opacity-50 text-xl tracking-tight uppercase">
          {isLoading ? <LoadingIcon /> : 'Generate Magic Plan'}
        </button>
      </div>
    </form>
  );
};