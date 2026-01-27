# PRODUCT REQUIREMENTS DOCUMENT
## Buhariwala Logistics - Movers & Packers Inventory Management System
**Phase 1: MVP - Mobile-First PWA**
**Version: 1.1 (Updated for Next.js)**
**Date: January 13, 2026**

## Technology Stack Updates

### Frontend Architecture (Updated)
| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | **Next.js 14 + TailwindCSS + React Query + Zustand** | Free |
| Backend/Database | Supabase (PostgreSQL) | Free tier (upgrade to Pro ₹2K/month when needed) |
| Authentication | Supabase Auth | Included |
| Image Storage | Supabase Storage | Free (1GB), then Pro |
| AI Image Recognition | Google Gemini 1.5 Flash API | Free (45K images/month) |
| PDF Generation | jsPDF / react-pdf | Free |
| Hosting | **Vercel (optimized for Next.js)** | Free tier |
| Email Delivery | Resend.com / SendGrid | Free (3K emails/month) |

### Key Next.js Features to Utilize
- **App Router**: Modern routing with layouts and server components
- **Server Components**: Reduce client-side JavaScript bundle
- **Image Optimization**: Built-in `next/image` for photo thumbnails
- **API Routes**: Backend API endpoints within Next.js
- **PWA Support**: next-pwa plugin for Progressive Web App features
- **Static Generation**: Pre-render pages for better performance
- **Middleware**: Handle authentication and role-based routing

### Updated Frontend Architecture Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── jobs/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── items/
│   │   │   ├── [id]/
│   │   │   └── new/
│   │   ├── review/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx (Super Admin only)
│   │   └── layout.tsx
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── items/
│   │   ├── ai/
│   │   │   └── identify/
│   │   │       └── route.ts
│   │   ├── pdf/
│   │   └── upload/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── auth/
│   ├── jobs/
│   ├── items/
│   ├── camera/
│   └── pdf/
├── lib/
│   ├── supabase/
│   ├── gemini/
│   ├── utils/
│   └── validations/
├── hooks/
├── stores/ (Zustand)
└── types/
```

### Updated Development Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@next/bundle-analyzer": "^14.0.0",
    "next-pwa": "^5.6.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "@supabase/supabase-js": "^2.38.0",
    "jspdf": "^2.5.0",
    "react-pdf": "^7.5.0"
  }
}
```

### Updated Sprint Tasks

#### Sprint 1-2: Foundation (Weeks 1-2) - UPDATED
**Tasks:**
- [ ] Initialize **Next.js 14** project with App Router
- [ ] Setup TailwindCSS + design system + shadcn/ui
- [ ] Configure next-pwa for PWA functionality
- [ ] Setup Supabase project
- [ ] Create all database tables
- [ ] Implement RLS policies
- [ ] Build authentication flow with Next.js middleware
- [ ] Setup **Vercel deployment** (optimized for Next.js)
- [ ] Create app router structure with layouts
- [ ] Implement role-based navigation with middleware

#### Sprint 5-6: Item Management + AI (Weeks 5-6) - UPDATED
**Additional Tasks:**
- [ ] Implement **Next.js API routes** for Gemini AI integration
- [ ] Use **next/image** for optimized photo display
- [ ] Create server components for item lists (better performance)
- [ ] Implement **streaming responses** for AI processing

#### Sprint 9: PDF Generation (Week 9) - UPDATED
**Additional Tasks:**
- [ ] Create **Next.js API routes** for PDF generation
- [ ] Implement **server-side PDF processing** for better performance
- [ ] Use Next.js **static optimization** for PDF templates

### Performance Improvements with Next.js
- **Faster Initial Load**: Server-side rendering and static generation
- **Smaller Bundles**: Server components reduce client-side JavaScript
- **Better SEO**: Server-side rendering for better crawling
- **Optimized Images**: Automatic image optimization with next/image
- **Edge Runtime**: Deploy API routes to edge for global performance

### Updated System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (PWA) - Next.js 14                                 │
│ Next.js + App Router + TailwindCSS + React Query + Zustand │
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ Server       │ │ API Routes   │ │ Client       │         │
│ │ Components   │ │ (AI, PDF)    │ │ Components   │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                             │
│ Hosted on: Vercel (optimized for Next.js)                  │
└─────────────────────────────────────────────────────────────┘
```

This update maintains all the original PRD requirements while leveraging Next.js 14's modern features for better performance, SEO, and developer experience.