/*
  # Fix auth schema and user creation

  1. Changes
    - Create auth schema and tables with proper constraints
    - Add initial admin user with correct conflict handling
    - Set up proper indexes and triggers
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    CREATE TABLE auth.users (
      instance_id uuid,
      id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
      aud varchar(255),
      role varchar(255),
      email varchar(255),
      encrypted_password varchar(255),
      email_confirmed_at timestamptz DEFAULT now(),
      invited_at timestamptz,
      confirmation_token varchar(255),
      confirmation_sent_at timestamptz,
      recovery_token varchar(255),
      recovery_sent_at timestamptz,
      email_change_token_new varchar(255),
      email_change varchar(255),
      email_change_sent_at timestamptz,
      last_sign_in_at timestamptz,
      raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
      is_super_admin boolean,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      phone text,
      phone_confirmed_at timestamptz,
      phone_change text,
      phone_change_token varchar(255),
      phone_change_sent_at timestamptz,
      confirmed_at timestamptz GENERATED ALWAYS AS (
        LEAST(email_confirmed_at, phone_confirmed_at)
      ) STORED,
      email_change_token_current varchar(255),
      email_change_confirm_status smallint DEFAULT 0
    );

    -- Create unique index on email
    CREATE UNIQUE INDEX users_email_key ON auth.users (email) WHERE email IS NOT NULL;
  END IF;
END $$;

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
  token text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent text
);

-- Create unique index on token
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_key ON auth.refresh_tokens (token);

-- Create other indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users (instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens (instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens (instance_id, user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens (token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions (user_id);
CREATE INDEX IF NOT EXISTS users_email_partial_idx ON auth.users (email) WHERE email IS NOT NULL;

-- Insert initial admin user if not exists
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
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
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
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{}'::jsonb,
      true
    );
  END IF;
END $$;