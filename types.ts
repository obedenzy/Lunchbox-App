
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
  preferences: string;
  dietType: 'Omnivore' | 'Vegetarian' | 'Vegan';
  targetWeek: string;
}

export interface UserStats {
  totalPlansGenerated: number;
  joinedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  tokens: number;
  isLoggedIn: boolean;
  savedPlans?: string[]; 
  defaultSettings?: {
    childAge: number;
    dietType: 'Omnivore' | 'Vegetarian' | 'Vegan';
  };
  stats?: UserStats;
}
