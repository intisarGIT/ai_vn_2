# AI Visual Novel Game - Setup Guide

## 🚀 Quick Start

### 1. Environment Variables Setup

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required API keys:
- **Supabase**: Get from your Supabase project dashboard
- **Mistral AI**: Get from https://console.mistral.ai/
- **LumaLabs**: Get from https://lumalabs.ai/dream-machine/api

### 2. Database Setup

Run the following SQL scripts in your Supabase SQL editor in order:

1. `scripts/01-create-tables.sql` - Initial tables
2. `scripts/02-setup-rls.sql` - Row Level Security
3. `scripts/03-setup-storage.sql` - Image storage bucket
4. `scripts/04-update-auth-schema.sql` - Auth policies
5. `scripts/05-fix-scenes-table.sql` - Fix scenes table
6. `scripts/04-add-missing-column.sql` - Add missing columns
7. `scripts/08-final-schema-fix.sql` - Final schema alignment

### 3. Supabase Storage Setup

In your Supabase dashboard:
1. Go to Storage
2. Create a public bucket named `game-assets`
3. Set up RLS policies for the bucket

### 4. Install Dependencies & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

## 🔧 Configuration

### Required Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs (required)
MISTRAL_API_KEY=your_mistral_api_key
LUMA_API_KEY=luma-your_luma_api_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting API Keys

#### Mistral AI
1. Go to https://console.mistral.ai/
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key

#### LumaLabs Dream Machine
1. Go to https://lumalabs.ai/dream-machine/api
2. Sign up for API access
3. Get your API key from the dashboard

#### Supabase
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings > API
4. Copy your Project URL and anon key
5. Copy your service role key (keep this secret!)

## 🎮 Game Features

- **AI-Generated Stories**: Powered by Mistral AI
- **Personalized Images**: Your face in every scene via LumaLabs
- **X Meter System**: Health/Trust/Reputation based on genre
- **Smart Pre-generation**: Smooth gameplay with background scene generation
- **Credits System**: 100 free credits, purchase more as needed
- **Storybook Export**: Download your complete adventure

## 🛠️ Technical Architecture

- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Mistral AI for story generation
- **Images**: LumaLabs Dream Machine for face-consistent images
- **State**: Zustand for game state management
- **UI**: Tailwind CSS + Radix UI components

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to generate scene"**
   - Check your Mistral API key in .env.local
   - Ensure you have sufficient API credits

2. **"Image generation failed"**
   - Check your LumaLabs API key
   - Verify the face image URL is accessible

3. **"Database connection failed"**
   - Verify Supabase URL and keys
   - Check RLS policies are properly set

4. **"Storage upload failed"**
   - Ensure `game-assets` bucket exists
   - Check storage policies in Supabase

### Debug Mode

Set these environment variables for debugging:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📝 Development

### Database Schema

The app uses three main tables:
- `users` - User profiles and credits
- `stories` - Game sessions and progress  
- `scenes` - Generated story content and images

### Adding New Features

1. Update database schema if needed
2. Add API routes in `/app/api/`
3. Update frontend components
4. Test thoroughly

## 🚀 Deployment

For production deployment:
1. Set up production Supabase project
2. Configure environment variables
3. Deploy to Vercel/Netlify
4. Update CORS and auth settings