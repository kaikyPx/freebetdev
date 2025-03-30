/*
  # Fix RLS policies for accounts table

  1. Changes
    - Drop existing policies
    - Create new policies with proper authentication checks
    - Ensure policies use auth.uid() for verification
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON accounts;

-- Create new policies with proper authentication checks
CREATE POLICY "Enable read access for authenticated users"
ON accounts FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON accounts FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON accounts FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON accounts FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Ensure RLS is enabled
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;