/*
  # Create betting houses schema

  1. New Tables
    - `betting_houses`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `account_betting_houses`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references accounts)
      - `betting_house_id` (uuid, references betting_houses)
      - `status` (text)
      - `verification` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Initial Data
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

-- Create betting houses table
CREATE TABLE betting_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account_betting_houses table
CREATE TABLE account_betting_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  betting_house_id uuid REFERENCES betting_houses(id) ON DELETE CASCADE,
  status text,
  verification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, betting_house_id)
);

-- Create triggers for updated_at
CREATE TRIGGER update_betting_houses_updated_at
  BEFORE UPDATE ON betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_betting_houses_updated_at
  BEFORE UPDATE ON account_betting_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined betting houses
INSERT INTO betting_houses (name) VALUES
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
  ('Novibet');