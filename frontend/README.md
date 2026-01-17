# Time Tracker Frontend

Next.js 14 dashboard for browser time tracking with AI-powered insights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running on http://localhost:5000

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Login & Register
│   ├── (dashboard)/     # Protected pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── analytics/         # Analytics page
│   │   ├── insights/          # AI Insights
│   │   └── settings/          # Settings
│   └── layout.tsx
├── components/
│   ├── auth/            # Auth components
│   ├── dashboard/       # Dashboard components
│   ├── charts/          # Chart components
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth helpers
│   └── store.ts         # Zustand store
└── types/
    └── index.ts         # TypeScript types
```

## 🎨 Features

- ✅ Login & Registration
- ✅ Dashboard with real-time stats
- ✅ Analytics with charts
- ✅ AI-powered insights
- ✅ Settings page
- ✅ Dark mode support
- ✅ Responsive design

## 🔧 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- React Query
- Zustand
- Axios

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔗 Connect to Backend

Make sure your Flask backend is running on http://localhost:5000

Default test credentials:

- Email: test@test.com
- Password: password123

## 🎯 Next Steps

1. Start backend: `cd backend && python run.py`
2. Start frontend: `cd frontend && npm run dev`
3. Login at http://localhost:3000
4. Install browser extension
5. Set extension token
6. Start tracking!
