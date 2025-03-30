/*
  # Create betting houses schema

  1. Changes
    - Create updated_at trigger function
    - Create betting_houses table
    - Create account_betting_houses table
    - Add triggers for timestamp updates
    - Insert predefined betting houses
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create betting_houses table if it doesn't exist
CREATE TABLE IF NOT EXISTS betting_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account_betting_houses table if it doesn't exist
CREATE TABLE IF NOT EXISTS account_betting_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  betting_house_id uuid REFERENCES betting_houses(id) ON DELETE CASCADE,
  status text,
  verification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, betting_house_id)
);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_betting_houses_updated_at ON betting_houses;
DROP TRIGGER IF EXISTS update_account_betting_houses_updated_at ON account_betting_houses;

-- Create triggers
CREATE TRIGGER update_betting_houses_updated_at
  BEFORE UPDATE ON betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_betting_houses_updated_at
  BEFORE UPDATE ON account_betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined betting houses
INSERT INTO betting_houses (name)
VALUES
  ('MC Games'),
  ('BET365'),
  ('Betano'),
  ('Vaidebet'),
  ('Betpix365'),
  ('Lotogreen'),
  ('EsportivaBet'),
  ('Superbet'),
  ('BR4'),
  ('BateuBet'),
  ('EstrelaBet'),
  ('KTO'),
  ('Betnacional'),
  ('Novibet')
ON CONFLICT (name) DO NOTHING;