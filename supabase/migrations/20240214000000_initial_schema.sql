-- Create a table for user profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  tokens integer default 10,
  saved_plans uuid[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create a table for children
create table public.children (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age integer not null,
  allergies text[] default '{}',
  excluded_ingredients text[] default '{}',
  available_ingredients text[] default '{}',
  diet_type text check (diet_type in ('Omnivore', 'Vegetarian', 'Vegan')),
  preferences text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for children
alter table public.children enable row level security;

create policy "Users can manage own children" on public.children
  for all using (auth.uid() = user_id);

-- Create a table for weekly plans
create table public.weekly_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete set null,
  week_label text not null,
  timestamp bigint not null,
  plan_data jsonb not null, -- Stores Monday-Sunday meal details
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for weekly plans
alter table public.weekly_plans enable row level security;

create policy "Users can manage own plans" on public.weekly_plans
  for all using (auth.uid() = user_id);

-- Trigger to automatically create a profile after signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();