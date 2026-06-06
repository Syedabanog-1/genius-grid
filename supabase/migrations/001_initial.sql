-- Enable RLS
-- profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'student',
  points integer not null default 0,
  avatar_seed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '📚',
  color text not null default 'bg-pink-100',
  created_at timestamptz not null default now()
);

-- quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  difficulty text not null default 'Medium',
  time_per_question integer not null default 30,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  text text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- options
create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  option_label text not null default 'a'
);

-- quiz_attempts
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer,
  total_questions integer,
  points_earned integer not null default 0,
  is_completed boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- user_answers
create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option_id uuid references public.options(id),
  is_correct boolean not null default false
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_answers enable row level security;

-- Profiles: users can read their own, admins read all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Categories: everyone can read, only admins write
create policy "Anyone can view categories" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Quizzes: students see published, admins see all
create policy "Students can view published quizzes" on public.quizzes for select using (is_published = true);
create policy "Admins can manage quizzes" on public.quizzes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Questions and options: follow quiz visibility
create policy "Anyone can view questions of visible quizzes" on public.questions for select using (
  exists (select 1 from public.quizzes where id = quiz_id and (is_published = true or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )))
);
create policy "Admins can manage questions" on public.questions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Anyone can view options" on public.options for select using (true);
create policy "Admins can manage options" on public.options for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Attempts: users manage own
create policy "Users can manage own attempts" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "Admins can view all attempts" on public.quiz_attempts for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can manage own answers" on public.user_answers for all using (
  exists (select 1 from public.quiz_attempts where id = attempt_id and user_id = auth.uid())
);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_seed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
