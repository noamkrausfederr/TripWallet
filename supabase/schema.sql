-- Trip Wallet schema for Supabase (Postgres)
-- Run this in Supabase SQL editor to create tables and RLS policies.

-- Enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- profiles is maintained by Supabase Auth but keep a simple view
create table if not exists profiles (
  id uuid primary key,
  email text,
  created_at timestamptz default now()
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists trips_user_id_idx on trips(user_id);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  type text not null,
  booking_date date not null,
  booking_time time,
  address text not null,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bookings_trip_id_idx on bookings(trip_id);
create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_date_idx on bookings(booking_date);

-- Private bucket used for uploaded booking tickets and confirmations.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create table if not exists booking_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_type text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security and policies
alter table profiles enable row level security;
alter table trips enable row level security;
alter table bookings enable row level security;
alter table booking_documents enable row level security;

-- Trips: allow owner to manage their rows
create policy "Trips: Owner access" on trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles: allow users to access and manage their own profile
create policy "Profiles: Owner access" on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bookings: allow owner to manage rows (user_id) or if the trip belongs to user
create policy "Bookings: Owner access" on bookings
  for all
  using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
  );

-- Documents: only owner
drop policy if exists "Booking Documents: Owner" on booking_documents;
create policy "Booking Documents: Owner" on booking_documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users may manage files only in their own folder:
-- {user-id}/{booking-id}/{safe-file-name}
drop policy if exists "Documents: owner select" on storage.objects;
drop policy if exists "Documents: owner insert" on storage.objects;
drop policy if exists "Documents: owner update" on storage.objects;
drop policy if exists "Documents: owner delete" on storage.objects;

create policy "Documents: owner select" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Documents: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Documents: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Documents: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Note: make sure to set up Supabase Auth to insert into profiles using auth webhook

-- Create a helper to automatically insert a profile row when a new auth user is created
-- This trigger creates a `profiles` row using the new user's id and email.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update set email = coalesce(new.email, public.profiles.email);
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users so profiles are created automatically.
drop trigger if exists auth_user_created on auth.users;
create trigger auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
