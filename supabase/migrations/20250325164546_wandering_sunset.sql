/*
  # Update betting operations schema

  1. Changes
    - Add promotion_id foreign key to betting_operations
    - Add indexes for better performance
    - Add trigger for monthly summary updates

  2. Notes
    - Maintains existing data
    - Improves query performance
    - Automates summary calculations
*/

-- Add promotion_id to betting_operations if it doesn't exist
ALTER TABLE betting_operations
  ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES promotions(id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS betting_operations_month_year_idx 
  ON betting_operations ((EXTRACT(YEAR FROM date)), (EXTRACT(MONTH FROM date)));

-- Create function to update monthly summaries
CREATE OR REPLACE FUNCTION update_monthly_summary()
RETURNS TRIGGER AS $$
DECLARE
  year_val integer;
  month_val integer;
  total_bets integer;
  total_bet_amount numeric;
  total_result numeric;
  total_profit numeric;
  roi numeric;
  accounts_count integer;
  profit_per_acc numeric;
BEGIN
  -- Get year and month
  year_val := EXTRACT(YEAR FROM NEW.date);
  month_val := EXTRACT(MONTH FROM NEW.date);
  
  -- Calculate totals for the month
  SELECT 
    COUNT(*),
    COALESCE(SUM(bet_amount), 0),
    COALESCE(SUM(result), 0),
    COALESCE(SUM(profit), 0)
  INTO
    total_bets,
    total_bet_amount,
    total_result,
    total_profit
  FROM betting_operations
  WHERE 
    EXTRACT(YEAR FROM date) = year_val AND
    EXTRACT(MONTH FROM date) = month_val;

  -- Calculate ROI
  IF total_bet_amount > 0 THEN
    roi := (total_profit / total_bet_amount) * 100;
  ELSE
    roi := 0;
  END IF;

  -- Count unique accounts used
  SELECT COUNT(DISTINCT account_id)
  INTO accounts_count
  FROM operation_accounts oa
  JOIN betting_operations bo ON bo.id = oa.operation_id
  WHERE 
    EXTRACT(YEAR FROM bo.date) = year_val AND
    EXTRACT(MONTH FROM bo.date) = month_val;

  -- Calculate profit per account
  IF accounts_count > 0 THEN
    profit_per_acc := total_profit / accounts_count;
  ELSE
    profit_per_acc := 0;
  END IF;

  -- Insert or update monthly summary
  INSERT INTO monthly_summaries (
    year,
    month,
    total_bets,
    total_bet_amount,
    total_result,
    total_profit,
    roi,
    accounts_used,
    profit_per_account
  ) VALUES (
    year_val,
    month_val,
    total_bets,
    total_bet_amount,
    total_result,
    total_profit,
    roi,
    accounts_count,
    profit_per_acc
  )
  ON CONFLICT (year, month) DO UPDATE SET
    total_bets = EXCLUDED.total_bets,
    total_bet_amount = EXCLUDED.total_bet_amount,
    total_result = EXCLUDED.total_result,
    total_profit = EXCLUDED.total_profit,
    roi = EXCLUDED.roi,
    accounts_used = EXCLUDED.accounts_used,
    profit_per_account = EXCLUDED.profit_per_account,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for monthly summary updates
DROP TRIGGER IF EXISTS update_monthly_summary_trigger ON betting_operations;
CREATE TRIGGER update_monthly_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON betting_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_summary();