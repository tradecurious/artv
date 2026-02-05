# Supabase Mailing List Integration Setup Guide

This guide will help you set up Supabase to store mailing list subscriptions for V the People.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: V the People (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient to start
5. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

## Step 2: Create the Mailing List Table

1. In your Supabase project dashboard, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste this SQL:

```sql
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
```

4. Click "Run" to execute the SQL
5. You should see a success message

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click **API** under Project Settings
3. You'll see two important values:
   - **Project URL**: This is your `SUPABASE_URL`
   - **anon public**: This is your `SUPABASE_ANON_KEY` (click the eye icon to reveal)
4. Copy both values

## Step 4: Configure Your Website

1. Open `js/main.js` in your project
2. Find these lines at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

## Step 5: Test the Integration

1. Deploy your website or test it locally
2. Go to the mailing list signup form
3. Enter an email address and click "Subscribe"
4. You should see a success message
5. Go back to Supabase → **Table Editor** → **mailing_list** table
6. You should see your test email in the table!

## Step 6: View and Export Your Mailing List

### Viewing Emails in Supabase Dashboard
1. Go to **Table Editor** in the left sidebar
2. Click on the **mailing_list** table
3. You'll see all subscribed emails with timestamps

### Exporting to CSV
1. In the Table Editor, click the **"..."** menu (top right)
2. Select **Export to CSV**
3. Your email list will be downloaded

### Querying with SQL
You can also run SQL queries in the SQL Editor:

```sql
-- Get all emails
SELECT email, subscribed_at FROM mailing_list ORDER BY subscribed_at DESC;

-- Count total subscribers
SELECT COUNT(*) as total_subscribers FROM mailing_list;

-- Get recent subscribers (last 7 days)
SELECT email, subscribed_at
FROM mailing_list
WHERE subscribed_at > NOW() - INTERVAL '7 days'
ORDER BY subscribed_at DESC;
```

## Security Features Included

✅ **Row Level Security (RLS)**: Enabled to control data access
✅ **Public Insert Only**: Anyone can subscribe, but can't read the list
✅ **Duplicate Prevention**: Same email can't be added twice
✅ **Timestamps**: Track when each person subscribed
✅ **Secure Keys**: Using anon key which is safe for public websites

## Troubleshooting

### "Supabase not configured" error
- Make sure you've replaced the placeholder credentials in `js/main.js`
- Check that the Supabase CDN script is loaded in `index.html`

### "This email is already subscribed!" message
- This is expected behavior when someone tries to subscribe twice
- The database prevents duplicate emails

### No data appearing in Supabase
- Check the browser console (F12) for errors
- Verify your credentials are correct
- Make sure the table was created successfully
- Check that RLS policies are in place

### Form not submitting
- Open browser console (F12) and check for JavaScript errors
- Verify the Supabase CDN is loading (check Network tab)
- Make sure your project URL and anon key are correct

## Next Steps

1. **Set up email notifications**: Configure Supabase Edge Functions to send you notifications when someone subscribes
2. **Add unsubscribe functionality**: Create a page where users can unsubscribe
3. **Export regularly**: Set up automated backups of your mailing list
4. **Monitor usage**: Check your Supabase dashboard for usage stats

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you have questions:
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
