<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🤖 VibeAI - AI-Powered Dating Platform

<div align="center">

**Revolutionizing Dating with Gemini 3 Pro's Advanced Reasoning**

[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Live Demo:** [https://vibeaipartner.web.app](https://vibeaipartner.web.app)

</div>

---

## 🎯 **What is VibeAI?**

VibeAI is a **Gen Z-focused, AI-driven dating platform** that finds deep connections based on life experiences using **Google Gemini 3 Pro's advanced reasoning capabilities**.

Unlike traditional dating apps that rely on superficial swiping, VibeAI engages users in meaningful conversations to understand their authentic personality, values, and relationship preferences. The AI then matches users with compatible partners using sophisticated compatibility algorithms.

### ✨ **Key Features**

- 🤖 **AI-Powered Personality Analysis** - Gemini 3 Pro analyzes conversation patterns
- 🎯 **Deep Compatibility Matching** - Beyond surface-level preferences
- 🔒 **Privacy-First Design** - No data selling, secure Firebase backend
- 📱 **Modern UX** - Built for Gen Z with cutting-edge design
- 🎙️ **Voice Input Support** - Natural conversation flow
- 📊 **Real-time Analytics** - Google Analytics 4 integration
- ☁️ **Serverless Architecture** - Firebase Functions + Hosting

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │ Firebase Hosting │    │  Firebase Auth  │
│   (Frontend)    │◄──►│                 │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Firebase        │    │  Gemini AI      │    │  Firestore DB   │
│ Functions       │───►│  API (Backend) │◄──►│  (User Data)    │
│ (Serverless)    │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```

### 🛠️ **Technology Stack**

**Frontend:**

- ⚛️ **React 19** - Modern UI framework
- 🎨 **TypeScript** - Type-safe development
- 🎭 **Tailwind CSS** - Utility-first styling
- 🚀 **Vite** - Fast build tool
- 📊 **Google Analytics 4** - User analytics

**Backend:**

- 🔥 **Firebase Functions** - Serverless API
- 🤖 **Google Gemini 3 Pro** - AI reasoning engine
- 🗄️ **Firestore** - NoSQL database
- 🔐 **Firebase Auth** - User authentication

---

## 🚀 **Quick Start**

### **Prerequisites**

- 🟢 **Node.js** (v18 or higher)
- 🟢 **npm** or **yarn**
- 🟢 **Google Account** (for Gemini API access)
- 🟢 **Firebase CLI** (for deployment)

### **1. Clone & Install**

```bash
git clone https://github.com/AnilAlapati/AIPartner.git
cd AIPartner
npm install
```

### **2. Environment Setup**

#### **Frontend Environment (.env.local)**

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Google Analytics ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### **Backend Environment (functions/.env)**

```bash
# Navigate to functions directory
cd functions

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### **3. Get API Keys**

#### **Gemini API Key**

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create a new API key
3. Copy the key to both `.env.local` and `functions/.env`

#### **Google Analytics (Optional)**

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a GA4 property
3. Copy the Measurement ID to `.env.local`

### **4. Run Locally**

```bash
# Start the development server
npm run dev

# App will be available at http://localhost:5173
```

### **5. Deploy to Production**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Configure Firebase Functions
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# Deploy
npm run build
firebase deploy
```

---

## 📁 **Project Structure**

```
├── 📁 components/          # React components
│   ├── AuthPage.tsx       # Authentication UI
│   ├── ChatInterface.tsx  # Main chat interface
│   ├── MatchCard.tsx      # Match display cards
│   └── UserProfile.tsx    # User profile display
├── 📁 data/               # Static data & generators
│   ├── mockProfiles.ts    # Sample user profiles
│   └── profileGenerator.ts # AI profile generation
├── 📁 functions/          # Firebase Cloud Functions
│   ├── index.js          # Main API endpoints
│   ├── config.js         # App configuration
│   └── lib/              # Utility functions
├── 📁 services/           # Frontend services
│   ├── authService.ts    # Firebase Auth
│   ├── geminiService.ts  # Gemini AI integration
│   └── analytics.ts      # Google Analytics
├── 📁 types/             # TypeScript definitions
├── 📁 utils/             # Utility functions
├── 📄 package.json       # Dependencies & scripts
├── 📄 firebase.json      # Firebase configuration
├── 📄 vite.config.ts     # Vite build configuration
└── 📄 tsconfig.json      # TypeScript configuration
```

---

## 🎮 **How It Works**

### **1. User Onboarding**

- Users authenticate with Google
- AI checks for existing profiles to prevent abuse

### **2. Personality Analysis**

- 5-question conversation with Gemini AI
- Advanced reasoning extracts personality traits, values, and preferences

### **3. Smart Matching**

- Compatibility algorithm analyzes 500+ AI-generated profiles
- Matches based on emotional intelligence, humor, values, and communication style

### **4. Results Display**

- Top matches presented with detailed compatibility scores
- Users can explore matches and start conversations

---

## 📊 **Analytics & Monitoring**

The app includes comprehensive analytics:

- **User Acquisition** - Sign-ups and authentication events
- **Engagement Funnel** - Chat completion and matching rates
- **Performance Metrics** - API response times and error rates
- **Real-time Monitoring** - Active users and session tracking

View the full analytics guide in [`ANALYTICS_GUIDE.md`](./ANALYTICS_GUIDE.md)

---

## 🔧 **Development**

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Firebase (custom script)
```

### **Code Quality**

- **TypeScript** - Full type safety
- **ESLint** - Code linting (configured in VS Code)
- **Prettier** - Code formatting
- **Firebase Security Rules** - Server-side validation

---

## 🚀 **Deployment**

### **Automated Deployment**

```bash
# Use the included deployment script
chmod +x deploy.sh
./deploy.sh
```

### **Manual Deployment**

```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy --only hosting
firebase deploy --only functions
```

See [`DEPLOY.md`](./DEPLOY.md) for detailed deployment instructions.

---

## 🚫 **Contributing**

This is a **personal project** built for the Google DeepMind Vibe Coding with Gemini 3 Pro Hackathon. **Contributions are not being accepted** at this time.

The repository is public for **educational and demonstration purposes** only. If you're interested in the code, feel free to fork it for your own learning and experimentation.

---

## 🙏 **Acknowledgments**

- **Google Gemini AI** - Advanced reasoning capabilities
- **Firebase** - Serverless infrastructure
- **React Community** - Modern web development
- **Kaggle Community** - Inspiration and learning

---

<div align="center">

**Made with ❤️ using Gemini 3 Pro**

**Built for the Google DeepMind Vibe Coding with Gemini 3 Pro Hackathon**

---

_Transforming dating from superficial swipes to meaningful connections_

</div>
