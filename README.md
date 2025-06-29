# 🎮 AI Visual Novel Game

An AI-powered interactive visual novel where **you** are the main character! Experience personalized stories with your face featured in every scene, powered by cutting-edge AI technology.

## ✨ Features

🤖 **AI-Generated Stories** - Dynamic narratives powered by Mistral AI  
📸 **Face-Consistent Images** - Your face in every scene via LumaLabs Dream Machine  
⚡ **X Meter System** - Strategic choices affect Health/Trust/Reputation  
🎯 **Smart Pre-generation** - Smooth gameplay with background scene generation  
💰 **Credits System** - 100 free credits to start, purchase more as needed  
📖 **Storybook Export** - Download your complete adventure as HTML  
🎨 **Multiple Genres** - Fantasy, Sci-Fi, Horror, Romance, Mystery, Adventure  

## 🚀 Quick Start

1. **Clone & Install**
   \`\`\`bash
   git clone <your-repo>
   cd ai-visual-novel-game
   npm install
   \`\`\`

2. **Set up Environment**
   \`\`\`bash
   cp .env.example .env.local
   # Fill in your API keys (see SETUP.md for details)
   \`\`\`

3. **Set up Database**
   - Follow the database setup guide in `SETUP.md`
   - Run the SQL scripts in order in your Supabase project

4. **Run Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   Visit http://localhost:3000

## 📋 Prerequisites

### Required API Keys
- **Supabase** (Database & Auth) - https://supabase.com/
- **Mistral AI** (Story Generation) - https://console.mistral.ai/
- **LumaLabs** (Image Generation) - https://lumalabs.ai/dream-machine/api

### Optional
- **Paddle** (Payment Processing) - For credits purchases

## 🎯 How It Works

1. **Sign Up** - Create your account with email/password
2. **Character Setup** - Upload your face photo, choose name & genre  
3. **Play** - Make choices that shape your unique story path
4. **Watch** - AI generates scenes featuring you as the protagonist
5. **Manage** - Keep your X Meter above 0 or face game over!
6. **Download** - Get your complete adventure as a storybook

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components  
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage  
- **State**: Zustand
- **AI**: Mistral AI (Story), LumaLabs (Images)

## 📁 Project Structure

\`\`\`
/app
├── app/                   # Next.js App Router
│   ├── (auth)/           # Auth pages
│   ├── game/             # Game interface  
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # Reusable components
├── lib/                  # Utilities & configuration
├── scripts/              # Database & setup scripts
└── public/               # Static assets
\`\`\`

## 🎮 Game Mechanics

### X Meter System
- Start with 100 points (Health/Trust/Reputation based on genre)
- Wrong choices reduce by 10 points
- Reach 0 = Game Over
- Complete all scenes = Victory!

### Credits System  
- New users get 100 free credits
- Each scene costs 10 credits (story + image generation)
- Purchase more credits to continue playing

### Story Generation
- Dynamic branching narratives
- 20-30 scenes per adventure  
- Pre-generated choices for smooth gameplay
- Character-consistent image generation

## 🔧 Development

### Available Scripts
\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server  
npm run lint         # Run ESLint
\`\`\`

### Testing Setup
\`\`\`bash
./scripts/dev-setup.sh   # Check environment & build
\`\`\`

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Troubleshooting

See `SETUP.md` for detailed troubleshooting guide.

**Common Issues:**
- Environment variables not set → Copy `.env.example` to `.env.local`
- Database errors → Run SQL scripts in Supabase dashboard
- Image generation fails → Check LumaLabs API key and credits
- Story generation fails → Verify Mistral AI API key

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Mistral AI for story generation capabilities
- LumaLabs for face-consistent image generation  
- Supabase for backend infrastructure
- Radix UI for component primitives
- Vercel for Next.js framework
