export type Allergy = 
  | 'Peanuts' 
  | 'Tree Nuts' 
  | 'Dairy' 
  | 'Egg' 
  | 'Wheat' 
  | 'Soy' 
  | 'Fish' 
  | 'Shellfish' 
  | 'Sesame'
  | 'Gluten-Free';

export type DietType = 'Omnivore' | 'Vegetarian' | 'Vegan';

export interface Child {
  id: string;
  name: string;
  age: number;
  allergies: string[];
  excludedIngredients: string[];
  availableIngredients?: string[]; // New: Ingredients on hand
  dietType: DietType;
  preferences: string;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientInfo {
  name: string;
  benefit: string;
}

export interface LunchDay {
  name: string;
  ingredients: IngredientInfo[];
  steps: string[];
  nutritionSummary: string;
  kidBenefit: string;
  macros: Macros;
  note: string;
  snack: string;
  imageUrl?: string;
}

export interface WeeklyPlan {
  id: string;
  timestamp: number;
  weekLabel: string;
  childId?: string; 
  profile: UserProfile;
  Monday: LunchDay;
  Tuesday: LunchDay;
  Wednesday: LunchDay;
  Thursday: LunchDay;
  Friday: LunchDay;
  Saturday: LunchDay;
  Sunday: LunchDay;
}

export interface UserProfile {
  age: number;
  allergies: string[];
  excludedIngredients?: string[];
  availableIngredients?: string[]; // New: Ingredients on hand
  preferences: string;
  dietType: DietType;
  targetWeek: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  tokens: number;
  isLoggedIn: boolean;
  children: Child[];
  savedPlans?: string[]; 
  defaultSettings?: {
    childAge: number;
    dietType: DietType;
  };
}