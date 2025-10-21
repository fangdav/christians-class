# Improv GSB - Class Attendance Dashboard

A comprehensive class attendance and engagement tracking system for managing student participation, contributions, and time allocation across multiple quarters.

## Overview

Improv GSB helps instructors manage class sessions, track student attendance, monitor check-in/check-out times, and analyze student engagement. Built with Next.js, TypeScript, and Supabase.

## Key Features

### Student Management
- Create, edit, and delete students with quarter-based enrollment
- Filter and view students by quarter

### Quarter & Session Management
- Manage academic quarters and schedule sessions
- Full CRUD operations with soft delete

### Attendance Tracking
- Mark students as: On Time, Late, Missing, or Excused Absence
- 60-minute base time per session (45 minutes with excused absences)

### Check-Out System
- Real-time check-out/return tracking with auto-calculated durations
- Database-enforced constraints prevent duplicate active checkouts

### Contributions Tracking
- Record student contributions with quality ratings (Low, Medium, High)
- Track contribution counts and average quality scores

### Analytics & Reporting
- Quarter-specific statistics with attendance rates and trends
- Filtering, sorting, and color-coded status indicators

## Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Authentication**: Supabase Auth (if enabled)

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd christians-class
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```env
   SUPABASE_NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Or use Vercel CLI:
   ```bash
   vercel env pull .env.local
   ```

4. **Run database migrations**

   Execute the following SQL scripts in your Supabase SQL Editor in order:

   ```
   scripts/01-create-tables.sql       # Create core tables
   scripts/02-create-views.sql        # Create database views
   scripts/03-enable-rls.sql          # Enable row-level security (optional)
   scripts/04-seed-data.sql           # Seed initial data (optional)
   scripts/05-add-soft-deletes.sql    # Add soft delete columns
   scripts/06-create-analytics-views.sql  # Create analytics views
   scripts/07-enforce-checkout-constraints.sql  # Add checkout constraints
   scripts/08-add-excused-absence.sql # Add excused absence status
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Deployment

The application is deployed on Vercel and connected to Supabase.

**Production URL**: [https://improvgsb.vercel.app](https://improvgsb.vercel.app)

## Contributing

This is a private project for Improv GSB. For feature requests or bug reports, please contact the administrator.

## License

Proprietary - All rights reserved