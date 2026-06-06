-- Max retakes allowed per quiz (0 = unlimited)
alter table public.quizzes add column if not exists max_retakes integer not null default 0;
