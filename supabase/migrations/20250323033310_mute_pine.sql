/*
  # Update users table policies

  1. Changes
    - Drop existing policies if they exist
    - Recreate policies with proper checks
    - Ensure no conflicts with existing policies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table in public schema if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email if it doesn't exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_users_updated_at'
  ) THEN
    CREATE TRIGGER handle_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;