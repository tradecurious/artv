-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'mailing_list';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'mailing_list';
