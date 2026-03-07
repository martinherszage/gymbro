-- GymBro Database Schema
-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Exercises table (pre-seeded + user-created)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text,
  is_custom boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table public.exercises enable row level security;

-- Everyone can read system exercises, users can read their own custom exercises
create policy "exercises_select" on public.exercises for select using (
  is_custom = false or auth.uid() = user_id
);
create policy "exercises_insert_own" on public.exercises for insert with check (
  auth.uid() = user_id and is_custom = true
);
create policy "exercises_update_own" on public.exercises for update using (
  auth.uid() = user_id and is_custom = true
);
create policy "exercises_delete_own" on public.exercises for delete using (
  auth.uid() = user_id and is_custom = true
);

-- Workouts table
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.workouts enable row level security;

create policy "workouts_select_own" on public.workouts for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on public.workouts for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on public.workouts for update using (auth.uid() = user_id);
create policy "workouts_delete_own" on public.workouts for delete using (auth.uid() = user_id);

-- Workout sets table
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number integer not null,
  reps integer,
  weight_kg numeric(6,2),
  notes text,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.workout_sets enable row level security;

-- Users can only access sets from their own workouts
create policy "workout_sets_select_own" on public.workout_sets for select using (
  exists (select 1 from public.workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid())
);
create policy "workout_sets_insert_own" on public.workout_sets for insert with check (
  exists (select 1 from public.workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid())
);
create policy "workout_sets_update_own" on public.workout_sets for update using (
  exists (select 1 from public.workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid())
);
create policy "workout_sets_delete_own" on public.workout_sets for delete using (
  exists (select 1 from public.workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid())
);

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
