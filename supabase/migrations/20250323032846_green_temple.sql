/*
  # Add authentication support

  1. Changes
    - Create users table in public schema
    - Add necessary columns for authentication
    - Set up proper indexes and constraints
*/

-- Create users table in public schema
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user if not exists
INSERT INTO users (
  id,
  email,
  encrypted_password,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;