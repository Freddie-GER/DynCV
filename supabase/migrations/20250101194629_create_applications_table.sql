-- Create applications table
create table applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  base_cv jsonb not null,
  job_description text not null,
  optimized_cv jsonb,
  suggestions jsonb,
  highlights jsonb,
  status text default 'in_progress' not null
);

-- Enable RLS
alter table applications enable row level security;

-- Create policy to allow inserts
create policy "Enable insert for all users" on applications
  for insert
  with check (true);

-- Create policy to allow select for all users
create policy "Enable select for all users" on applications
  for select
  using (true);
