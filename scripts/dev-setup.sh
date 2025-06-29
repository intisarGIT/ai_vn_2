#!/bin/bash

# Development Testing Script for AI Visual Novel Game

echo "🎮 AI Visual Novel Game - Development Test Suite"
echo "================================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "📝 Please copy .env.example to .env.local and fill in your API keys"
    exit 1
fi

echo "✅ Environment file found"

# Check for required environment variables
echo "🔍 Checking environment variables..."

required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "MISTRAL_API_KEY" "LUMA_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local || grep -q "^$var=your_" .env.local; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing or incomplete environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo "📝 Please update your .env.local file with actual API keys"
    exit 1
fi

echo "✅ All required environment variables are set"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Ready to start development!"
    echo "   Run: npm run dev"
    echo "   Visit: http://localhost:3000"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Set up your Supabase database using the SQL scripts in /scripts/"
    echo "   2. Create a 'game-assets' storage bucket in Supabase"
    echo "   3. Test the authentication flow"
    echo "   4. Try creating a story with your face image"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
