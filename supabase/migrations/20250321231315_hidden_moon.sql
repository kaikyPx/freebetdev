/*
  # Disable RLS for accounts table

  1. Changes
    - Disable Row Level Security on accounts table
    - Drop all existing policies as they won't be needed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON accounts;

-- Disable RLS
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;