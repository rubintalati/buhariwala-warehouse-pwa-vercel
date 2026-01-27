# Vercel Environment Variables Setup

## Required Environment Variables

Copy these variables to your Vercel project dashboard:

### Supabase Configuration
```bash
# Public Supabase URL (visible to client)
NEXT_PUBLIC_SUPABASE_URL=https://qvlsyzghbdnyopohtgvr.supabase.co

# Public Supabase Anonymous Key (visible to client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bHN5emduYmRueW9wb2h0Z3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDI2NTksImV4cCI6MjA1MzAxODY1OX0.t0ZlZbJe-eQDKm9xh2IpR1FrP8EoyO5z0pJCZjOJYyE

# Private Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bHN5emduYmRueW9wb2h0Z3ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ0MjY1OSwiZXhwIjoyMDUzMDE4NjU5fQ.eHT-rJgfaDfWoW-t9hhSwOF4O8nWOWb0S3Jvj3u6WEQ
```

### Google AI Configuration
```bash
# Google Gemini AI API Key
GOOGLE_AI_API_KEY=AIzaSyBbBq6AacMN8Eb9OoXGmVU_Sc7vAJ0wCME
```

### Application Configuration
```bash
# Node Environment
NODE_ENV=production

# File Upload Configuration
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf
```

## Setup Instructions

### 1. Access Vercel Dashboard
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Navigate to your `buhariwala-warehouse-pwa-vercel` project
- Click on **Settings** tab

### 2. Add Environment Variables
- Click on **Environment Variables** in the sidebar
- For each variable above:
  1. Enter the **Key** (variable name)
  2. Enter the **Value** (variable value)
  3. Select environments: **Production**, **Preview**, and **Development**
  4. Click **Save**

### 3. Environment Types
- **Production**: Used for live deployment
- **Preview**: Used for branch/PR previews
- **Development**: Used for local development (optional)

### 4. Security Notes
- `NEXT_PUBLIC_*` variables are exposed to the client-side
- Other variables are kept secret and only available server-side
- Supabase RLS (Row Level Security) is enabled for data protection
- Google AI API key is secured server-side only

## Verification

After setting up environment variables:

1. **Redeploy the application** to pick up new environment variables
2. **Check deployment logs** for any missing variable errors
3. **Test functionality**:
   - Database connections (Supabase)
   - AI image identification (Google Gemini)
   - Authentication flows
   - File uploads

## Local Development

For local development, create a `.env.local` file with the same variables:

```bash
# Copy from .env.example and update values
cp .env.example .env.local
```

**Note**: Never commit `.env.local` to version control!

## Troubleshooting

### Common Issues:
1. **Database Connection Failed**: Check Supabase URL and keys
2. **AI Not Working**: Verify Google AI API key and billing status
3. **Build Failures**: Ensure all required variables are set in all environments
4. **Type Errors**: Run `npx tsc --noEmit` to check TypeScript issues

### Debug Steps:
1. Check Vercel deployment logs
2. Verify environment variables in project settings
3. Test API endpoints individually
4. Check browser console for client-side errors