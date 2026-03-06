-- Table for user profiles with OTP storage for authentication
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL, -- Unique email used for search and login
  name TEXT,
  tokens INTEGER DEFAULT 10,
  otp TEXT, -- STORES THE 6-DIGIT VERIFICATION CODE
  otp_expiry TIMESTAMP WITH TIME ZONE, -- Expiration time for the OTP
  saved_plans UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast email-based lookups during login/signup
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Table for children profiles
CREATE TABLE public.children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  allergies TEXT[] DEFAULT '{}',
  excluded_ingredients TEXT[] DEFAULT '{}',
  available_ingredients TEXT[] DEFAULT '{}',
  diet_type TEXT CHECK (diet_type IN ('Omnivore', 'Vegetarian', 'Vegan')),
  preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for finding children associated with a specific user
CREATE INDEX idx_children_user_id ON public.children(user_id);

-- Table for generated weekly meal plans
CREATE TABLE public.weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  week_label TEXT NOT NULL,
  timestamp BIGINT NOT NULL, -- Unix timestamp (Date.now())
  plan_data JSONB NOT NULL, -- Stores the full weekly plan JSON structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for retrieving a user's plan history
CREATE INDEX idx_weekly_plans_user_id ON public.weekly_plans(user_id);

-- Row Level Security (RLS) is explicitly NOT enabled per your request.