/*
  # Fix authentication schema and add proper user management

  1. Changes
    - Enable required extensions
    - Create auth schema if it doesn't exist
    - Add proper user management tables and functions
    - Create initial admin user with proper schema
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  email_confirmed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  role text DEFAULT 'authenticated',
  aud text DEFAULT 'authenticated'
);

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  factor_id uuid,
  aal text,
  not_after timestamptz
);

-- Create refresh tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  token text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create or replace function to handle timestamps
CREATE OR REPLACE FUNCTION auth.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_auth_users_updated_at') THEN
    CREATE TRIGGER handle_auth_users_updated_at
      BEFORE UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auth.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_auth_sessions_updated_at') THEN
    CREATE TRIGGER handle_auth_sessions_updated_at
      BEFORE UPDATE ON auth.sessions
      FOR EACH ROW
      EXECUTE FUNCTION auth.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_auth_refresh_tokens_updated_at') THEN
    CREATE TRIGGER handle_auth_refresh_tokens_updated_at
      BEFORE UPDATE ON auth.refresh_tokens
      FOR EACH ROW
      EXECUTE FUNCTION auth.handle_updated_at();
  END IF;
END $$;

-- Create initial admin user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      is_super_admin,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      true,
      'authenticated',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{}'::jsonb
    );
  END IF;
END $$;