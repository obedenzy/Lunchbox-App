'use client';

import React, { useState } from 'react';
import { Child, DietType } from '../types';
import { UserIcon, CheckIcon } from './Icons';

interface ChildManagerProps {
  children: Child[];
  onUpdate: (children: Child[]) => void;
  onSelect: (child: Child) => void;
  selectedChildId?: string;
}

export const ChildManager: React.FC<ChildManagerProps> = ({ children, onUpdate, onSelect, selectedChildId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(6);

  const addChild = () => {
    if (!newName) return;
    const newChild: Child = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      age: newAge,
      allergies: [],
      dietType: 'Omnivore',
      preferences: ''
    };
    onUpdate([...children, newChild]);
    setNewName('');
    setIsAdding(false);
  };

  const removeChild = (id: string) => {
    onUpdate(children.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex items-center justify-between border-b-4 border-bg-cool pb-6">
        <h3 className="text-2xl font-black text-navy tracking-tight">Your Children</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          Add Child
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {children.map(child => (
          <div 
            key={child.id}
            onClick={() => onSelect(child)}
            className={`p-6 rounded-[2rem] border-4 cursor-pointer transition-all relative group ${
              selectedChildId === child.id 
                ? 'border-primary bg-white shadow-2xl' 
                : 'border-navy/5 bg-bg-cool/50 hover:border-primary/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:rotate-6 ${
              selectedChildId === child.id ? 'bg-primary text-white' : 'bg-white text-navy/20'
            }`}>
              <UserIcon className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black text-navy mb-1">{child.name}</h4>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest">{child.age} Years • {child.dietType}</p>
            
            <button 
              onClick={(e) => { e.stopPropagation(); removeChild(child.id); }}
              className="absolute top-4 right-4 text-navy/10 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
            >
              Remove
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="p-6 rounded-[2rem] border-4 border-dashed border-primary bg-white shadow-2xl animate-in zoom-in duration-300">
            <input 
              autoFocus
              type="text" 
              placeholder="Child's Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 bg-bg-cool rounded-xl mb-4 font-black text-navy text-sm placeholder-navy/20 border-2 border-transparent focus:border-primary outline-none"
            />
            <div className="flex gap-4 mb-4">
              <select 
                value={newAge}
                onChange={(e) => setNewAge(parseInt(e.target.value))}
                className="flex-1 p-3 bg-bg-cool rounded-xl font-black text-navy text-xs"
              >
                {Array.from({length: 17}, (_, i) => i + 2).map(v => <option key={v} value={v}>{v}y</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={addChild} className="flex-1 bg-primary text-white py-3 rounded-xl font-black text-[10px] uppercase">Save</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 bg-navy/5 text-navy/40 py-3 rounded-xl font-black text-[10px] uppercase">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};