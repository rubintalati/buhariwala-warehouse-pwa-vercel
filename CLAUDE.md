# Buhariwala Logistics - Warehouse Management System

## Project Overview

This is a **Next.js 16.1.1** Progressive Web Application (PWA) for Buhariwala Logistics, a movers & packers company. The system provides mobile-first inventory management with AI-powered item identification using Google Gemini AI.

## Tech Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini AI for item identification
- **Styling**: Tailwind CSS 3.4.19, Radix UI Components
- **State Management**: Zustand, React Query
- **PWA**: next-pwa (currently disabled for deployment)
- **PDF Generation**: jsPDF, html2canvas
- **Deployment**: Netlify (with Vercel config available)

## Environment Setup

### Prerequisites
- Node.js 20+ (check `.nvmrc`)
- npm or yarn
- Supabase account
- Google AI API key

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Database Schema & Migrations

### Core Tables
- **users**: User accounts with role-based permissions
- **jobs**: Moving jobs with pickup/delivery locations
- **job_locations**: Multiple pickup/delivery addresses per job
- **items**: Inventory items with photos and AI identification
- **warehouses**: Storage facilities

### User Roles & Permissions
- **Super Admin**: Full system access, user management
- **Checker**: Job approval, inventory verification
- **Maker**: Job creation, item entry, photo capture

### Running Migrations
```bash
# Apply migrations
npx supabase db push

# Reset database (development only)
npx supabase db reset
```

**Important**: All SQL migration files are now organized in `supabase/migrations/` with archived legacy files.

## Key Features

### 1. Job Management
- Create jobs with multiple pickup/delivery locations
- Track job status (pending → in_progress → completed)
- Generate job numbers: `JOB-YYYYMMDD-XXXX`

### 2. Inventory Management
- Photo-based item documentation
- AI-powered item identification (Google Gemini)
- Room-based organization
- Item condition tracking

### 3. Warehouse Operations
- Multi-location storage support
- Lot-based inventory tracking
- Storage assignment workflows

### 4. Report Generation
- PDF inventory reports with photos
- Customer signature capture
- Email distribution (TODO: implement)

### 5. Authentication & Authorization
- Role-based access control
- Supabase RLS policies
- Session management

## File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Main application
├── components/            # Reusable components
│   ├── ui/               # Radix UI components
│   ├── ai/               # AI integration
│   ├── camera/           # Photo capture
│   └── reports/          # PDF generation
├── lib/                  # Utilities & configurations
│   ├── supabase/         # Database client
│   ├── pdf/              # PDF generation
│   └── store/            # Zustand stores
└── types/                # TypeScript definitions
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # ESLint checking

# Database
npx supabase start      # Start local Supabase
npx supabase db push    # Apply migrations
npx supabase db reset   # Reset database

# Deployment
vercel                  # Deploy to Vercel
npm run build           # Build for production
```

## Common Issues & Troubleshooting

### 1. Server Won't Start
- Check Node.js version (use `nvm use` if `.nvmrc` exists)
- Verify environment variables in `.env.local`
- Clear `.next` folder: `rm -rf .next`

### 2. Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies if data not loading
- Ensure user has proper role assignment

### 3. AI Item Identification Not Working
- Verify `GOOGLE_AI_API_KEY` is set
- Check API quotas and billing
- Ensure image format is supported

### 4. Build Errors
- **Important**: `ignoreBuildErrors: false` is enabled for strict TypeScript checking
- Run `npx tsc --noEmit` to check TypeScript errors
- Fix type issues before production deployment

### 5. PWA Configuration
- PWA is available but commented out in `next.config.js`
- To enable: uncomment PWA config for service worker functionality

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User authentication

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/[id]` - Update job
- `POST /api/jobs/approve` - Approve job

### Items
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `PUT /api/items/[id]` - Update item

### AI Integration
- `POST /api/ai/identify-item` - Identify item from photo

### Reports
- `POST /api/reports/email` - Email report (TODO)

## Security Considerations

- Row Level Security (RLS) enabled on all tables
- Role-based access control via Supabase
- File upload size limits enforced
- Image type validation
- Environment variables properly secured

## Performance Optimizations

- Image optimization with Next.js Image component
- Lazy loading for components
- React Query for efficient data fetching
- Turbopack enabled for faster builds

## Deployment

### Vercel (Current)
- **Project**: `buhariwala-warehouse-pwa-vercel`
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Framework preset**: Next.js
- **Node.js version**: 20.x
- **Auto-deployment**: Enabled from Git repository
- **Edge regions**: Mumbai (bom1), Singapore (sin1)

### Configuration Files
- `vercel.json`: Deployment configuration
- `next.config.js`: Vercel-optimized settings
- Environment variables configured in Vercel dashboard

### Deployment Process
1. Push to main branch triggers auto-deployment
2. Vercel builds using Next.js 16.1.1
3. Environment variables injected at build time
4. Edge functions deployed globally
5. Preview deployments for feature branches

## TODO & Known Issues

1. **Email Integration**: Implement actual email service for reports
2. **TypeScript Errors**: Fix build errors (currently ignored)
3. **PWA Features**: Re-enable service worker functionality
4. **Testing**: Add unit and integration tests
5. **Error Handling**: Improve error boundaries and user feedback

## Support & Maintenance

For issues or questions:
1. Check this documentation first
2. Review error logs in browser/server console
3. Check Supabase dashboard for database issues
4. Verify environment configuration

**Last Updated**: January 2026