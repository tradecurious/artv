-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to insert emails" ON mailing_list;
DROP POLICY IF EXISTS "Only authenticated users can read" ON mailing_list;
DROP POLICY IF EXISTS "Enable insert for anon users" ON mailing_list;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON mailing_list;

-- Enable RLS
ALTER TABLE mailing_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for signup form)
CREATE POLICY "Enable insert for anon users"
ON mailing_list
FOR INSERT
TO anon, public
WITH CHECK (true);

-- Create policy to prevent public reads (only authenticated users can read)
CREATE POLICY "Enable read for authenticated users only"
ON mailing_list
FOR SELECT
TO authenticated
USING (true);

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'mailing_list';
