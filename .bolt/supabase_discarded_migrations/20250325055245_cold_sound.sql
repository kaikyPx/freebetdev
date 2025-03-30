/*
  # Add RLS policies for betting operations

  1. Changes
    - Enable RLS on betting_operations table
    - Add policies for authenticated users
    - Ensure proper access control
    - Maintain existing data integrity
*/

-- Enable RLS
ALTER TABLE betting_operations ENABLE ROW LEVEL SECURITY;

-- Create policies with proper checks
CREATE POLICY "Enable read access for authenticated users"
ON betting_operations FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON betting_operations FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON betting_operations FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON betting_operations FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Enable RLS on operation_accounts
ALTER TABLE operation_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for operation_accounts
CREATE POLICY "Enable read access for authenticated users"
ON operation_accounts FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON operation_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON operation_accounts FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON operation_accounts FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Enable RLS on monthly_summaries
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly_summaries
CREATE POLICY "Enable read access for authenticated users"
ON monthly_summaries FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON monthly_summaries FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON monthly_summaries FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON monthly_summaries FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');