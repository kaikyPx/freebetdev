/*
  # Fix RLS policies for betting operations

  1. Changes
    - Disable RLS on betting_operations table
    - Disable RLS on operation_accounts table
    - Drop existing policies
*/

-- Disable RLS on betting_operations
ALTER TABLE betting_operations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for betting_operations
DROP POLICY IF EXISTS "Enable read access for betting_operations" ON betting_operations;
DROP POLICY IF EXISTS "Enable insert access for betting_operations" ON betting_operations;
DROP POLICY IF EXISTS "Enable update access for betting_operations" ON betting_operations;
DROP POLICY IF EXISTS "Enable delete access for betting_operations" ON betting_operations;

-- Disable RLS on operation_accounts
ALTER TABLE operation_accounts DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for operation_accounts
DROP POLICY IF EXISTS "Enable read access for operation_accounts" ON operation_accounts;
DROP POLICY IF EXISTS "Enable insert access for operation_accounts" ON operation_accounts;
DROP POLICY IF EXISTS "Enable update access for operation_accounts" ON operation_accounts;
DROP POLICY IF EXISTS "Enable delete access for operation_accounts" ON operation_accounts;