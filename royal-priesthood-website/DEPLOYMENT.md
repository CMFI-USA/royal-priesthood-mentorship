# Royal Priesthood Mentorship Website
## Deployment Guide

### Quick Start

This is a Next.js website for Miracle Center's Youth Mentorship Program. It's ready to deploy to Vercel with zero configuration needed.

---

## Installation & Local Development

### 1. Install Dependencies
```bash
cd royal-priesthood-website
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## Features

✅ **Homepage** — Program overview and quick links  
✅ **Why This Program** — Vision and purpose  
✅ **Program Structure** — How it works  
✅ **Mentor vs Mentee Roles** — Clear responsibilities  
✅ **8-Week Schedule** — Calendar with all dates  
✅ **Bible Characters** — 20 character suggestions with references  
✅ **Weekly Guide** — Interactive carousel showing one week at a time  
✅ **Automatic Week Detection** — Defaults to current week based on date  
✅ **Mobile Responsive** — Works on all devices  
✅ **Admin Portal** — Hidden `/admin` route for secure operations  
✅ **SQLite Admin Database** — Tracks mentors, mentees, and message history in a local SQLite file  
✅ **Bulk SMS Tools** — Send messages to all mentors, all mentees, or a selected group  
✅ **CSV Import/Export** — Quickly download and upload mentor/mentee contact lists in the admin portal  
✅ **No External Database** — Public content stays in JSON files and admin data lives in local SQLite  

---

## Deployment to Vercel

### Step 1: Push to GitHub (Optional but Recommended)
```bash
git init
git add .
git commit -m "Initial commit: Royal Priesthood Mentorship Website"
git remote add origin https://github.com/CMFI-USA/royal-priesthood-mentorship.git
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel Dashboard (Easiest)**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Select "Import Git Repository"
4. Paste your GitHub URL
5. Click "Import" and follow prompts
6. Vercel will auto-detect it's a Next.js project
7. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow the prompts to connect to your Vercel account
# Your site will be live in seconds!
```

### Step 3: Custom Domain (Optional)
In your Vercel project settings:
1. Go to "Domains"
2. Add your custom domain (e.g., mentorship.miraclecenter.church)
3. Follow DNS configuration instructions

---

## File Structure

```
royal-priesthood-website/
├── app/
│   ├── page.tsx                 # Home page
│   ├── about/page.tsx           # Why this program
│   ├── structure/page.tsx       # Program structure
│   ├── responsibilities/page.tsx # Mentor vs Mentee
│   ├── schedule/page.tsx        # 8-week calendar
│   ├── characters/page.tsx      # Bible characters
│   ├── weekly-guide/page.tsx    # Interactive weekly guide
│   ├── admin/page.tsx           # Hidden admin portal
│   ├── layout.tsx               # Main layout with Header/Footer
│   └── globals.css              # Tailwind styles
├── app/api/admin/
│   ├── login/route.ts           # Admin sign-in
│   ├── logout/route.ts          # Admin sign-out
│   ├── state/route.ts           # Admin data snapshot
│   ├── people/route.ts          # Add mentors and mentees
│   ├── export/route.ts          # Export contacts to CSV
│   ├── import/route.ts          # Import contacts from CSV
│   └── messages/route.ts        # Bulk SMS sending and history logging
├── components/
│   ├── Header.tsx               # Navigation header
│   └── Footer.tsx               # Footer
├── lib/
│   └── weekCalculator.ts        # Date calculation for current week
│   ├── adminAuth.ts             # Cookie-based admin auth helpers
│   ├── adminStore.ts            # SQLite people/message store
│   ├── adminTypes.ts            # Shared portal types
│   ├── mailchimpMessaging.ts    # Mailchimp SMS integration
│   └── twilioMessaging.ts       # (Legacy) Vonage SMS integration
├── public/
│   └── data/
│       ├── weeks.json           # All 8 weeks content
│       └── characters.json      # All 20 Bible characters
├── .env.example                 # Required admin, SQLite, and Mailchimp variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md

```

---

## Customization

### Change Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  blue: { ... }      // Change these hex codes
  green: { ... }
  purple: { ... }
}
```

### Change Site Title/Description
Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Your Custom Title',
  description: 'Your custom description',
};
```

### Add Content to Weekly Guides
Edit `public/data/weeks.json` — add new questions, exhortations, or proclamations

### Add More Bible Characters
Edit `public/data/characters.json` — add characters with name, category, and references

---

## Environment Variables

The public site still works without extra configuration, but the `/admin` portal and SMS features require environment variables.

1. Copy `.env.example` to `.env.local`
2. Fill in your admin and Mailchimp values
3. For Vercel, add the same variables in the project settings under "Environment Variables"

### Required for Admin Portal
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Golois
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

### Required for Mailchimp SMS
```bash
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_SMS_FROM=your-sender-name
```

Notes:
- SMS sending will not work until all required Mailchimp variables are set.
- The admin portal is available at `/admin` and is intentionally not linked in the public navigation.

---

## Performance

- ⚡ Static site generation (SSG) for fast load times
- 📱 Mobile-first responsive design
- 🎨 Tailwind CSS for optimized styling
- 🚀 Deployed on Vercel's edge network
- 💾 Zero cold starts

---

## Maintenance

### Weekly Content Updates
1. Edit `/public/data/weeks.json`
2. Save and commit to GitHub
3. Vercel auto-deploys on push
4. Changes live in seconds

### Adding New Pages
1. Create new folder in `/app` (e.g., `/app/new-page`)
2. Create `page.tsx` inside
3. Add link to Header component
4. Deploy automatically

### Monitoring
- Visit Vercel dashboard to see deployment history
- Check analytics for visitor traffic
- Monitor build timing and edge function usage

### Admin Portal Notes
- Admin data persists in a local SQLite file (`./data/admin.sqlite` by default).
- You can change the SQLite location with `SQLITE_DB_PATH`.
- On serverless platforms, local filesystem persistence may still be ephemeral across instances.
- CSV import expects rows in this format: `name,phoneNumber,type` where type is `mentor` or `mentee`.

---

## Support & Questions

Contact:
- **Pastor G** — Vision & leadership
- **Rose** — Program coordination
- **Mischka** — Technical support

---

## License

Developed for Miracle Center Youth Mentorship Program.
For questions about usage rights, contact church leadership.

---

**Website Built:** April 16, 2026  
**Framework:** Next.js 14 with TypeScript  
**Hosting:** Vercel (Free tier available)  
**Theme Verse:** 1 Peter 2:9
