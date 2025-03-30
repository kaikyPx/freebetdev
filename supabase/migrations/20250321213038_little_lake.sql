/*
  # Create CPF Accounts Schema

  1. New Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `item` (integer)
      - `responsavel` (text)
      - `status` (text)
      - `name` (text)
      - `cpf` (text)
      - `birth_date` (date)
      - `address` (text)
      - `phone` (text)
      - `email1` (text)
      - `password1` (text)
      - `chip` (text)
      - `verification` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `accounts` table
    - Add policies for authenticated users to:
      - Read all accounts
      - Insert new accounts
      - Update existing accounts
      - Delete accounts
*/

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item integer NOT NULL,
  responsavel text NOT NULL,
  status text NOT NULL,
  name text NOT NULL,
  cpf text NOT NULL,
  birth_date date NOT NULL,
  address text,
  phone text,
  email1 text,
  password1 text,
  chip text,
  verification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert accounts"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update accounts"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete accounts"
  ON accounts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();