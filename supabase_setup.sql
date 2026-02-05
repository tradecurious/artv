-- Supabase Setup SQL for V the People Mailing List
-- Run this in the Supabase SQL Editor

-- Create mailing_list table
CREATE TABLE mailing_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_mailing_list_email ON mailing_list(email);

-- Enable Row Level Security
ALTER TABLE mailing_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for signup form)
CREATE POLICY "Allow public to insert emails"
ON mailing_list
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to prevent public reads (only authenticated users can read)
CREATE POLICY "Only authenticated users can read"
ON mailing_list
FOR SELECT
TO authenticated
USING (true);

-- Add comment to table
COMMENT ON TABLE mailing_list IS 'Stores email addresses for the V the People mailing list';
