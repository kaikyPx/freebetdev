/*
  # Add storage bucket for card attachments

  1. Changes
    - Create a new storage bucket for card attachments
    - Set up public access policies
    - Use built-in storage functionality
*/

-- Create bucket for card attachments if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('card-attachments', 'card-attachments', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow public access to files
CREATE POLICY "Give public access to card attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-attachments');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload card attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-attachments');

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated users to update card attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'card-attachments');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete card attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-attachments');