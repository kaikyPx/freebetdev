/*
  # Fix authentication schema and policies

  1. Changes
    - Enable auth schema extensions
    - Add proper auth policies for accounts table
    - Fix auth user creation
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow authenticated users to delete accounts" ON accounts;
DROP POLICY IF EXISTS "Allow authenticated users to insert accounts" ON accounts;
DROP POLICY IF EXISTS "Allow authenticated users to read accounts" ON accounts;
DROP POLICY IF EXISTS "Allow authenticated users to update accounts" ON accounts;

-- Create proper RLS policies
CREATE POLICY "Enable read access for authenticated users"
ON public.accounts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.accounts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON public.accounts FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token,
      is_super_admin,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      '{"provider": "email", "providers": ["email"]}',
      '{}'
    );
  END IF;
END $$;