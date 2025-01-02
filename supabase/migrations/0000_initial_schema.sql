-- CVs table
create table cvs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content jsonb not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table cvs enable row level security;

-- Create policies
create policy "Users can view their own CVs"
  on cvs for select
  using (auth.uid() = user_id);

create policy "Users can create their own CVs"
  on cvs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own CVs"
  on cvs for update
  using (auth.uid() = user_id);

-- Job Postings table
create table job_postings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  company text not null,
  description text not null,
  url text,
  pdf_content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table job_postings enable row level security;

-- Create policies
create policy "Job postings are viewable by authenticated users"
  on job_postings for select
  to authenticated
  using (true);

create policy "Job postings are insertable by authenticated users"
  on job_postings for insert
  to authenticated
  with check (true);

-- Create an updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger handle_cvs_updated_at
  before update on cvs
  for each row
  execute function handle_updated_at();

create trigger handle_job_postings_updated_at
  before update on job_postings
  for each row
  execute function handle_updated_at(); 