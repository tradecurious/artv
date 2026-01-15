# Article V Convention Conference Website

A placeholder website for Harvard Law School's conference on procedural design for an Article V constitutional convention.

## Site Structure

### Pages

1. **index.html** - Landing page
   - Hero section with conference title, dates, and location
   - Quick introduction to the conference
   - Call-to-action for email signup
   - Links to other pages
   - Email capture form in "Stay Informed" section

2. **framing.html** - Conference framing and purpose
   - Conference purpose and rationale
   - Three core themes with key questions
   - Why the conference is timely
   - Conference structure overview

3. **primer.html** - Article V plain-English primer
   - Overview of Article V
   - Visual step-by-step flow diagram
   - Key definitions (35 states, runaway convention, ratification, etc.)
   - Open questions vs. well-established facts
   - Historical context

4. **issues.html** - Procedural design modules
   - Six core modules:
     1. Delegate Selection
     2. Delegate Apportionment
     3. Voting Rules and Procedures
     4. Scope Limits and Runaway Convention Concerns
     5. Rules, Credentialing, and Dispute Resolution
     6. Transparency, Ethics, and Accountability
   - Each module includes key questions and "coming soon" placeholders
   - Integration notes explaining how modules interact
   - Call-to-participation section

### Assets

- **css/style.css** - Main stylesheet with:
  - Harvard crimson color scheme
  - Responsive design (mobile-first)
  - Component styles (cards, forms, buttons)
  - Typography and layout utilities

- **js/main.js** - JavaScript for:
  - Email form handling and validation
  - Smooth scroll navigation
  - Form feedback messaging

### Design Notes

- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Semantic HTML, WCAG color contrast, keyboard navigation
- **Bootstrap 5**: Used for grid system and components
- **Color Scheme**: Harvard crimson (#8B0000) with gold accents
- **Placeholder Ready**: All pages include "coming soon" placeholders for future content

## Getting Started

1. Open `index.html` in a web browser
2. Navigate using the header menu or links between pages
3. Test the email signup form

## Email Capture

The email form currently stores signup data in browser memory (localStorage). In production, you would:
- Connect to an email marketing service (Mailchimp, ConvertKit, etc.)
- Set up a backend endpoint to handle form submissions
- Implement proper email validation and compliance (GDPR, CAN-SPAM)

Update the `handleEmailSubmit()` function in `js/main.js` to connect to your backend service.

## Future Development

As the conference details are finalized, add:
- Speaker bios and photos
- Detailed program schedule
- Panel and working group descriptions
- Research papers and working papers (linked from Issues modules)
- Event registration
- Conference blog or news section
- Social media integration

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2024 Harvard Law School. All rights reserved.
