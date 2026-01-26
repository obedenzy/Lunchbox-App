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

export interface LunchboxComponent {
  id: string;
  name: string;
  type: 'main' | 'fruit' | 'veg' | 'snack' | 'treat' | 'drink';
  tags: string[];
  nutritionSummary?: string;
}

export interface LunchDay {
  name: string;
  childId?: string;
  components?: {
    main?: LunchboxComponent;
    produce?: LunchboxComponent;
    snack?: LunchboxComponent;
    treat?: LunchboxComponent;
    drink?: LunchboxComponent;
  };
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
  childId: string;
  Monday: LunchDay;
  Tuesday: LunchDay;
  Wednesday: LunchDay;
  Thursday: LunchDay;
  Friday: LunchDay;
  Saturday?: LunchDay;
  Sunday?: LunchDay;
}

export interface UserProfile {
  age: number;
  allergies: string[];
  preferences: string;
  dietType: DietType;
  targetWeek: string;
  childId?: string;
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