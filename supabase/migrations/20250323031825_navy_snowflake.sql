/*
  # Create Banks Schema

  1. New Tables
    - `banks`
      - `id` (uuid, primary key)
      - `name` (text)
      - `initial_capital` (numeric)
      - `roi` (numeric)
      - `gross_profit` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on banks table
    - Add policies for authenticated users to:
      - Read their own banks
      - Create new banks
      - Update their own banks
      - Delete their own banks
*/

-- Create banks table
CREATE TABLE banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initial_capital numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0,
  gross_profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own banks"
  ON banks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create banks"
  ON banks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banks"
  ON banks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own banks"
  ON banks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON banks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();