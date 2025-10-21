# Improv GSB - Class Attendance Dashboard

A comprehensive class attendance and engagement tracking system built for managing student participation, contributions, and time allocation across multiple quarters.

## Overview

Improv GSB is a Next.js application that helps instructors manage class sessions, track student attendance, monitor check-in/check-out times, and analyze student engagement through contributions and analytics. The system supports soft-delete functionality, quarter-based organization, and real-time state management for attendance tracking.

## Key Features

### Student Management
- Create, edit, and delete students (soft delete)
- Assign students to quarters via enrollment system
- Filter students by quarter
- Track student IDs, emails, and profiles

### Quarter & Session Management
- Create and manage academic quarters
- Schedule sessions with date/time information
- Full CRUD operations with soft delete
- Quarter-based filtering across the application

### Attendance Tracking
- Mark students as: **On Time**, **Late**, **Missing**, or **Excused Absence**
- Automatic late-minute calculation
- Four status options with distinct badges
- Base time allocation: **60 minutes per session** (45 minutes if student has excused absences)

### Check-Out System
- Real-time check-out/return tracking
- Database-enforced constraints (only one active checkout per student per session)
- Auto-calculated duration on return
- Time deductions from student's available session time
- Direct database queries for immediate state updates

### Contributions Tracking
- Record student contributions with quality ratings (Low, Medium, High)
- Track contribution counts and average quality scores
- Quarter-filtered analytics

### Analytics & Reporting
- Quarter-specific overview statistics
- Attendance rates and trends
- Time remaining calculations (session time - late minutes - checkout minutes)
- Contribution statistics
- Filtering and sorting capabilities
- Color-coded status indicators (Good, Warning, Danger)

## Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **UI Components**: Shadcn UI (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Authentication**: Supabase Auth (if enabled)

## Database Schema

### Core Tables
- `quarters` - Academic quarters with start/end dates
- `users` - Student information
- `sessions` - Individual class sessions
- `quarter_enrollments` - Student-quarter associations
- `check_ins` - Attendance records with status and late minutes
- `check_outs` - Check-out/return tracking with durations
- `contributions` - Student contribution records with quality ratings

### Database Views
- `student_session_summary` - Per-session student data with time calculations
- `student_quarter_summary` - Quarter-level aggregations per student
- `quarter_overview_stats` - Quarter-wide statistics
- `quarter_student_attendance` - Attendance analytics per student per quarter
- `quarter_student_contributions` - Contribution analytics per student per quarter

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

## Time Calculation Logic

### Base Time Allocation
- **Standard**: 60 minutes per session
- **With Excused Absence**: 45 minutes per session (one-time 15-minute penalty)

### Time Deductions
```
Time Remaining = Base Time - Late Minutes - Checkout Minutes
```

### Example
Student attends 2 sessions:
- Session 1: On time, checked out for 10 minutes → 60 - 0 - 10 = **50 min remaining**
- Session 2: 5 minutes late, no checkout → 60 - 5 - 0 = **55 min remaining**
- **Total time remaining**: 50 + 55 = **105 minutes**

If the student has an excused absence in any session of the quarter:
- Base becomes 45 minutes per session instead of 60
- **Adjusted total**: (45 - 0 - 10) + (45 - 5 - 0) = **75 minutes**

## Deployment

The application is deployed on Vercel and connected to Supabase for database operations.

**Production URL**: [Your Vercel deployment URL]

## Contributing

This is a private project for Improv GSB. For feature requests or bug reports, please contact the administrator.

## License

Proprietary - All rights reserved