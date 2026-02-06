-- Fix RLS Policies for mailing_list table
-- Run this if you're getting 401 Unauthorized errors

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public to insert emails" ON mailing_list;
DROP POLICY IF EXISTS "Only authenticated users can read" ON mailing_list;
DROP POLICY IF EXISTS "Enable insert for anon users" ON mailing_list;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON mailing_list;

-- Make sure RLS is enabled
ALTER TABLE mailing_list ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows anyone to insert
CREATE POLICY "Allow anonymous email inserts"
ON mailing_list
FOR INSERT
WITH CHECK (true);

-- Only allow authenticated users to read
CREATE POLICY "Allow authenticated reads only"
ON mailing_list
FOR SELECT
TO authenticated
USING (true);

-- Grant usage on the table to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON mailing_list TO anon;

-- Verify the policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'mailing_list';

-- Check table permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'mailing_list';
