# Constitutional Convention Conference Website

A sleek, professional website for Harvard Law School's Constitutional Convention Conference.

## Site Structure

- **index.html** - Main landing page with all sections
- **css/style.css** - Styling with Old Glory color scheme (Red #B22234, White #FFFFFF, Blue #002868)
- **js/main.js** - Form handling and smooth scrolling functionality
- **images/** - Directory for slideshow and speaker images (to be added)

## Sections

1. **Hero Section** - Full-viewport image slideshow with overlay text about convening the constitutional convention
2. **Listserv Section** - Email signup form and RSVP request button
3. **Speakers Section** - Grid of featured speakers (placeholder images and names)
4. **Quote Section** - Full-width image overlay with the quote "Even All-Stars Sometimes Need a Tune Up"
5. **Footer** - Harvard Law School contact info, address, and RSVP link

## Image Placeholders

You'll need to upload the following images to the `images/` directory:

- `hero-1.jpg` - First hero slideshow image
- `hero-2.jpg` - Second hero slideshow image
- `hero-3.jpg` - Third hero slideshow image
- `quote-1.jpg` - Quote section background image
- `speaker-1.jpg`, `speaker-2.jpg`, etc. - Speaker headshots

After uploading, update the HTML with speaker names, titles, and affiliations.

## Customization

### Colors
The color scheme uses CSS variables defined in `style.css`:
- `--old-glory-red`: #B22234
- `--old-glory-white`: #FFFFFF
- `--old-glory-blue`: #002868

### Email Handling
The listserv form posts each address to the `mailing_list` table in Supabase
(`js/main.js`). A database trigger then hands the new row to a Supabase Edge
Function, which sends the subscriber a welcome email through Resend. The
function, the migration, and the setup steps live in [`supabase/`](supabase/);
the email copy itself is in `supabase/functions/welcome-email/email.ts`.

### RSVP Link
Update the `#rsvp` anchor link in the footer and "Request RSVP" button to point to your registration page.

## Design Principles

- Clean, minimal aesthetic
- Tasteful animations (image slideshow transitions only)
- No emojis or vibecode styling
- Professional Harvard Law School branding
- Responsive design for mobile, tablet, and desktop

## Deployment

Ready to deploy to Vercel and connect to your Cloudflare domain (vthepeople.org).
