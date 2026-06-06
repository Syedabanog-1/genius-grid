-- Add GIAIC ID to profiles
alter table public.profiles add column if not exists giaic_id text;

-- Add contributed_by to questions (name of person who suggested the question)
alter table public.questions add column if not exists contributed_by text;

-- Add questions_per_attempt to quizzes (0 means use all questions in the pool)
alter table public.quizzes add column if not exists questions_per_attempt integer not null default 0;

-- Add question_ids to quiz_attempts (shuffled, selected question IDs for this attempt)
alter table public.quiz_attempts add column if not exists question_ids uuid[] default null;

-- Update trigger to capture giaic_id from signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_seed, giaic_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'giaic_id', '')), '')
  );
  return new;
end;
$$ language plpgsql security definer;
