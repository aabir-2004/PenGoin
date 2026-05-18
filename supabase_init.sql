-- Run this in the Supabase SQL Editor to initialize the database for PenGoin

CREATE TABLE documents (
  name text PRIMARY KEY,
  state text NOT NULL
);

-- Optional: Enable Row Level Security (RLS) but allow the backend server to bypass it
-- Since we are using the Secret Key on the backend, it automatically bypasses RLS,
-- but enabling it secures the table from frontend anonymous access if the anon key leaks.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
