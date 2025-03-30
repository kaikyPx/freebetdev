/*
  # Complete Database Schema

  1. New Tables
    - `betting_operations`
      - Track all betting operations
      - Store game details, odds, and results
      - Link to accounts and betting houses
    
    - `operation_accounts`
      - Track which accounts are used in operations
      - Store stakes and results per account
    
    - `monthly_summaries`
      - Store monthly performance metrics
      - Calculate ROI and profits
    
    - `promotions`
      - Store available promotion types
      - Track promotion usage

  2. Security
    - Enable RLS on all tables
    - Add proper policies for data access
    - Ensure data integrity
*/

-- Create betting_operations table
CREATE TABLE IF NOT EXISTS betting_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  game_name text NOT NULL,
  house1_id uuid REFERENCES betting_houses(id),
  house2_id uuid REFERENCES betting_houses(id),
  bet_amount numeric NOT NULL DEFAULT 0,
  result numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  promotion_type text,
  status text NOT NULL DEFAULT 'Em Operação',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operation_accounts table
CREATE TABLE IF NOT EXISTS operation_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid REFERENCES betting_operations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  betting_house_id uuid REFERENCES betting_houses(id),
  stake numeric NOT NULL DEFAULT 0,
  role text NOT NULL, -- 'activation1', 'activation2', 'protection'
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(operation_id, account_id, betting_house_id)
);

-- Create monthly_summaries table
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  total_bets integer NOT NULL DEFAULT 0,
  total_bet_amount numeric NOT NULL DEFAULT 0,
  total_result numeric NOT NULL DEFAULT 0,
  total_profit numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0,
  accounts_used integer NOT NULL DEFAULT 0,
  profit_per_account numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default promotions
INSERT INTO promotions (name) VALUES
  ('Freebet'),
  ('Cashback'),
  ('Aumento'),
  ('SuperOdds')
ON CONFLICT (name) DO NOTHING;

-- Create triggers for updated_at
CREATE TRIGGER update_betting_operations_updated_at
  BEFORE UPDATE ON betting_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operation_accounts_updated_at
  BEFORE UPDATE ON operation_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summaries_updated_at
  BEFORE UPDATE ON monthly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE betting_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for betting_operations
CREATE POLICY "Enable read access for betting_operations"
  ON betting_operations FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for betting_operations"
  ON betting_operations FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for betting_operations"
  ON betting_operations FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for betting_operations"
  ON betting_operations FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Create RLS policies for operation_accounts
CREATE POLICY "Enable read access for operation_accounts"
  ON operation_accounts FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for operation_accounts"
  ON operation_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for operation_accounts"
  ON operation_accounts FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for operation_accounts"
  ON operation_accounts FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Create RLS policies for monthly_summaries
CREATE POLICY "Enable read access for monthly_summaries"
  ON monthly_summaries FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for monthly_summaries"
  ON monthly_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for monthly_summaries"
  ON monthly_summaries FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for monthly_summaries"
  ON monthly_summaries FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Create RLS policies for promotions
CREATE POLICY "Enable read access for promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for promotions"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for promotions"
  ON promotions FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS betting_operations_date_idx ON betting_operations(date);
CREATE INDEX IF NOT EXISTS operation_accounts_operation_id_idx ON operation_accounts(operation_id);
CREATE INDEX IF NOT EXISTS monthly_summaries_year_month_idx ON monthly_summaries(year, month);