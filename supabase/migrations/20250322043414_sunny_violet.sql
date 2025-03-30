/*
  # Update betting houses schema

  1. Changes
    - Drop existing triggers safely
    - Add missing columns if needed
    - Ensure all tables and relationships exist
    - Recreate triggers
*/

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_betting_houses_updated_at ON betting_houses;
DROP TRIGGER IF EXISTS update_account_betting_houses_updated_at ON account_betting_houses;

-- Add missing columns if needed
ALTER TABLE betting_houses 
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create account_betting_houses if it doesn't exist
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

-- Recreate triggers
CREATE TRIGGER update_betting_houses_updated_at
  BEFORE UPDATE ON betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_betting_houses_updated_at
  BEFORE UPDATE ON account_betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert or update betting houses
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