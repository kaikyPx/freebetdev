/*
  # Disable RLS for monthly_summaries table

  1. Changes
    - Disable Row Level Security on monthly_summaries table
    - Drop existing RLS policies
    - Ensure data can be accessed without restrictions
*/

-- Disable RLS on monthly_summaries
ALTER TABLE monthly_summaries DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for monthly_summaries
DROP POLICY IF EXISTS "Enable read access for monthly_summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Enable insert access for monthly_summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Enable update access for monthly_summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Enable delete access for monthly_summaries" ON monthly_summaries;