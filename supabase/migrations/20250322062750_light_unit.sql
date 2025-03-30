/*
  # Add financial columns to account_betting_houses table

  1. Changes
    - Add saldo (balance) column
    - Add deposito (deposit) column
    - Add sacado (withdrawn) column
    - Add creditos (credits) column
    - Add obs (observations) column

  2. Notes
    - All new columns are nullable text fields
    - Existing data is preserved
    - No data type constraints to allow flexible formatting
*/

ALTER TABLE account_betting_houses
  ADD COLUMN IF NOT EXISTS saldo text,
  ADD COLUMN IF NOT EXISTS deposito text,
  ADD COLUMN IF NOT EXISTS sacado text,
  ADD COLUMN IF NOT EXISTS creditos text,
  ADD COLUMN IF NOT EXISTS obs text;