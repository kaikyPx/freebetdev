/*
  # Add organization schema

  1. New Tables
    - `organization_columns`
      - `id` (uuid, primary key)
      - `title` (text)
      - `position` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `organization_cards`
      - `id` (uuid, primary key)
      - `column_id` (uuid, references organization_columns)
      - `content` (text)
      - `description` (text)
      - `color` (text)
      - `position` (integer)
      - `attachments` (text[])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create organization_columns table
CREATE TABLE organization_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_cards table
CREATE TABLE organization_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES organization_columns(id) ON DELETE CASCADE,
  content text NOT NULL,
  description text,
  color text DEFAULT 'bg-white',
  position integer NOT NULL,
  attachments text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create triggers for updated_at
CREATE TRIGGER update_organization_columns_updated_at
  BEFORE UPDATE ON organization_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_cards_updated_at
  BEFORE UPDATE ON organization_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE organization_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON organization_columns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON organization_columns FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON organization_columns FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON organization_columns FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON organization_cards FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON organization_cards FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON organization_cards FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON organization_cards FOR DELETE
TO authenticated
USING (true);

-- Insert initial columns
INSERT INTO organization_columns (title, position) VALUES
  ('A Fazer', 1),
  ('Em Andamento', 2),
  ('Concluído', 3);