/*
  # Update storage policies for card attachments

  1. Changes
    - Create bucket if it doesn't exist
    - Drop existing policies if they exist
    - Recreate policies with proper checks
*/

-- Create bucket for card attachments if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('card-attachments', 'card-attachments', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Give public access to card attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload card attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update card attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete card attachments" ON storage.objects;
END $$;

-- Recreate policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Give public access to card attachments'
  ) THEN
    CREATE POLICY "Give public access to card attachments"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'card-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload card attachments'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload card attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'card-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to update card attachments'
  ) THEN
    CREATE POLICY "Allow authenticated users to update card attachments"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'card-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to delete card attachments'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete card attachments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'card-attachments');
  END IF;
END $$;