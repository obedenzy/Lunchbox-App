'use client';

import React, { useState } from 'react';
import { Child, DietType, Allergy } from '../types';
import { UserIcon, CheckIcon } from './Icons';

interface ChildManagerProps {
  children: Child[];
  onUpdate: (children: Child[]) => void;
  onSelect: (childId: string) => void;
  selectedChildId?: string;
}

const PREDEFINED_ALLERGIES: Allergy[] = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Egg', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Gluten-Free'
];

export const ChildManager: React.FC<ChildManagerProps> = ({ children, onUpdate, onSelect, selectedChildId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Child>>({});
  const [customInput, setCustomInput] = useState('');
  const [inputType, setInputType] = useState<'allergy' | 'ingredient'>('allergy');

  const startEdit = (child?: Child) => {
    if (child) {
      setEditingId(child.id);
      setFormData(child);
    } else {
      setEditingId('new');
      setFormData({
        name: '',
        age: 6,
        allergies: [],
        excludedIngredients: [],
        dietType: 'Omnivore',
        preferences: ''
      });
    }
  };

  const saveChild = () => {
    if (!formData.name) return;
    
    let updatedChildren;
    if (editingId === 'new') {
      const newChild = { ...formData, id: Math.random().toString(36).substr(2, 9) } as Child;
      updatedChildren = [...children, newChild];
    } else {
      updatedChildren = children.map(c => c.id === editingId ? { ...c, ...formData } as Child : c);
    }
    
    onUpdate(updatedChildren);
    setEditingId(null);
  };

  const toggleAllergy = (allergy: string) => {
    const current = formData.allergies || [];
    const updated = current.includes(allergy) 
      ? current.filter(a => a !== allergy) 
      : [...current, allergy];
    setFormData({ ...formData, allergies: updated });
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (inputType === 'allergy') {
      const current = formData.allergies || [];
      if (!current.includes(trimmed)) setFormData({ ...formData, allergies: [...current, trimmed] });
    } else {
      const current = formData.excludedIngredients || [];
      if (!current.includes(trimmed)) setFormData({ ...formData, excludedIngredients: [...current, trimmed] });
    }
    setCustomInput('');
  };

  const removeExcluded = (item: string) => {
    setFormData({ ...formData, excludedIngredients: (formData.excludedIngredients || []).filter(i => i !== item) });
  };

  if (editingId) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border-4 border-primary shadow-2xl animate-in zoom-in duration-300 text-left">
        <div className="flex items-center justify-between mb-12 border-b-4 border-bg-cool pb-8">
           <h3 className="text-3xl font-black text-navy tracking-tight">{editingId === 'new' ? 'Create Magic Profile' : 'Edit Child Profile'}</h3>
           <button onClick={() => setEditingId(null)} className="text-navy/20 hover:text-primary font-black uppercase tracking-widest text-[10px]">Cancel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Child's Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Name"
                className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Age</label>
              <select 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-black text-navy"
              >
                {Array.from({length: 17}, (_, i) => i + 2).map(v => <option key={v} value={v}>{v} Years Old</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Dietary Rule</label>
              <div className="flex gap-2">
                {(['Omnivore', 'Vegetarian', 'Vegan'] as DietType[]).map(d => (
                  <button 
                    key={d}
                    onClick={() => setFormData({...formData, dietType: d})}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-4 transition-all ${formData.dietType === d ? 'bg-primary border-primary text-white' : 'bg-white border-bg-cool text-navy/40 hover:border-primary/20'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-4 ml-2">Allergies & Restrictions</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {PREDEFINED_ALLERGIES.map(a => (
                  <button 
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${formData.allergies?.includes(a) ? 'bg-primary border-primary text-white' : 'bg-bg-cool border-transparent text-navy/40'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 bg-bg-cool p-2 rounded-2xl border-2 border-transparent focus-within:border-primary transition-all">
                <div className="flex gap-2 flex-1">
                  <select value={inputType} onChange={(e) => setInputType(e.target.value as any)} className="bg-navy text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none">
                    <option value="allergy">Allergy</option>
                    <option value="ingredient">Ingredient</option>
                  </select>
                  <input 
                    type="text" 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Add custom..."
                    className="flex-1 bg-transparent px-3 font-black text-navy outline-none text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addCustom()}
                  />
                </div>
                <button onClick={addCustom} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl shadow-primary/20">Add</button>
              </div>
            </div>

            {formData.excludedIngredients && formData.excludedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.excludedIngredients.map(i => (
                  <div key={i} className="bg-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    {i} <button onClick={() => removeExcluded(i)} className="text-white/40 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-navy/40 tracking-widest uppercase block mb-3 ml-2">Preferences (Likes/Dislikes)</label>
              <textarea 
                value={formData.preferences}
                onChange={(e) => setFormData({...formData, preferences: e.target.value})}
                placeholder="e.g. Loves crunchy food, hates spinach..."
                className="w-full p-5 bg-bg-cool border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:outline-none font-bold text-navy text-sm min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={saveChild}
          className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xl mt-12 hover:bg-primary transition-all shadow-2xl shadow-navy/20"
        >
          Save Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 text-left mb-12">
      <div className="flex items-center justify-between border-b-4 border-navy/5 pb-6">
        <div>
          <h3 className="text-3xl font-black text-navy tracking-tight leading-none">Child Profiles</h3>
          <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest mt-2">Manage settings for each of your children</p>
        </div>
        <button 
          onClick={() => startEdit()}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          New Profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {children.map(child => (
          <div 
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={`p-10 rounded-[3rem] border-4 cursor-pointer transition-all relative group flex flex-col items-center text-center ${
              selectedChildId === child.id 
                ? 'border-primary bg-white shadow-2xl scale-[1.02]' 
                : 'border-navy/5 bg-bg-cool/30 hover:border-primary/20'
            }`}
          >
            <div className={`w-24 h-24 rounded-[2rem] mb-8 flex items-center justify-center transition-transform group-hover:rotate-6 ${
              selectedChildId === child.id ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'bg-white text-navy/10 border-4 border-navy/5'
            }`}>
              <UserIcon className="w-12 h-12" />
            </div>
            <h4 className="text-2xl font-black text-navy mb-2 tracking-tight">{child.name}</h4>
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">{child.age} Years • {child.dietType}</span>
              {child.allergies.length > 0 && (
                <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-2">{child.allergies.length} Restrictions Active</span>
              )}
            </div>
            
            <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
               <button onClick={(e) => { e.stopPropagation(); startEdit(child); }} className="bg-navy text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors">Edit</button>
               <button onClick={(e) => { e.stopPropagation(); onUpdate(children.filter(c => c.id !== child.id)); }} className="bg-primary/10 text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">Delete</button>
            </div>

            {selectedChildId === child.id && (
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white animate-in zoom-in duration-300">
                <CheckIcon />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};