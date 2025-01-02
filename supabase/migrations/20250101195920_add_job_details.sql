alter table applications add column job_title text default 'Untitled Position';
alter table applications add column employer text default 'Unknown Employer';
alter table applications alter column job_title set not null;
alter table applications alter column employer set not null;
