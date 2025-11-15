#!/bin/bash

# Deploy Gemini Chat Function to Supabase
# This script helps deploy the edge function

echo "🛡️ SafeGuard Chat Function Deployment"
echo "======================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed"
    echo ""
    echo "Install options:"
    echo "1. npm: npm install -g supabase"
    echo "2. scoop (Windows): scoop install supabase"
    echo "3. brew (Mac): brew install supabase/tap/supabase"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "🔐 Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking project..."
    supabase link --project-ref bgpykthzyibcjpaulmih
else
    echo "✅ Project linked"
fi

echo ""

# Check for Gemini API key
echo "🔑 Checking for GEMINI_API_KEY..."
read -p "Enter your Gemini API key (or press Enter to skip): " gemini_key

if [ ! -z "$gemini_key" ]; then
    echo "Setting GEMINI_API_KEY secret..."
    supabase secrets set GEMINI_API_KEY="$gemini_key"
    echo "✅ Secret set"
else
    echo "⚠️  Skipping API key setup"
    echo "   Add it later in Supabase Dashboard → Project Settings → Edge Functions → Secrets"
fi

echo ""

# Deploy function
echo "🚀 Deploying gemini-safety-chat function..."
supabase functions deploy gemini-safety-chat

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test your function:"
echo "supabase functions logs gemini-safety-chat --follow"
