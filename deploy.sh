#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment preparation..."

# 1. Build Frontend
echo "📦 Building Frontend..."
npm install
npm run build

# 2. Prepare Backend
echo "⚙️ Preparing Backend..."
cd functions
npm install
cd ..

echo "✅ Build complete!"
echo ""
echo "To deploy to Firebase, run the following command:"
echo "firebase deploy"
echo ""
echo "⚠️  Make sure you have set your Gemini API key in Firebase config:"
echo "firebase functions:config:set gemini.key=\"YOUR_API_KEY\""
