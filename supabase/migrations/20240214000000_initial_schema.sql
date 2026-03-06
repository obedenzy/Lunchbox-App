-- Table for user profiles with OTP support
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tokens INTEGER DEFAULT 10,
  otp TEXT, -- Stores the 6-digit code
  otp_expiry TIMESTAMP WITH TIME ZONE,
  saved_plans UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast email searches
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

-- Index for finding children by parent
CREATE INDEX idx_children_user_id ON public.children(user_id);

-- Table for generated weekly plans
CREATE TABLE public.weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  week_label TEXT NOT NULL,
  timestamp BIGINT NOT NULL, -- JS Date.now() compatible
  plan_data JSONB NOT NULL, -- Stores the full Monday-Sunday JSON object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for finding plans by user
CREATE INDEX idx_weekly_plans_user_id ON public.weekly_plans(user_id);

-- Note: Row Level Security (RLS) is NOT enabled per request, 
-- allowing open access to these tables.