import React, { useState, useEffect } from 'react';
import { processGoogleCredential, loginAsDev } from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

/**
 * --- SETUP INSTRUCTIONS FOR DOMAIN: AgentPandu.com ---
 * 
 * To make Google Sign-In work on your domain:
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Select project "vibeaipartner".
 * 3. Go to "APIs & Services" > "Credentials".
 * 4. Click the Pencil icon to edit your OAuth 2.0 Client ID.
 * 5. Under "Authorized JavaScript origins", YOU MUST ADD:
 *    - https://agentpandu.com
 *    - https://www.agentpandu.com
 *    - http://localhost:3000 (Keep this for local testing)
 * 
 * Note: It may take 5-10 minutes for Google to recognize the new domain after saving.
 */

const GOOGLE_CLIENT_ID = "736838018216-09125e2g5vm6d3u1uah5u6ocv8f8p499.apps.googleusercontent.com"; 

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isHoveringDebug, setIsHoveringDebug] = useState(false);

  useEffect(() => {
    // Check if script is loaded
    if (window.google && window.google.accounts) {
        initializeGoogleAuth();
    } else {
        // Retry if script isn't ready yet
        const timer = setTimeout(() => {
            if (window.google && window.google.accounts) {
                initializeGoogleAuth();
            }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, []);

  const initializeGoogleAuth = () => {
    try {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            theme: 'filled_black',
            auto_select: false
        });
        
        const btnDiv = document.getElementById("googleBtn");
        if (btnDiv) {
            window.google.accounts.id.renderButton(
                btnDiv,
                { theme: "filled_black", size: "large", width: "100%", shape: "pill", logo_alignment: "left" }
            );
        }
    } catch (err) {
        console.error("Google Auth Init Error", err);
    }
  };

  const handleCredentialResponse = (response: any) => {
    if (response.credential) {
        const user = processGoogleCredential(response.credential);
        if (user) {
            onLoginSuccess();
        } else {
            setError("Unable to sign in. Please try again.");
        }
    }
  };

  const handleDevLogin = async () => {
      await loginAsDev();
      onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#050505]">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-50%] right-[-20%] w-[1000px] h-[1000px] bg-fuchsia-600/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Main Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center animate-fade-in-up ring-1 ring-white/5">
          
          {/* Logo/Icon */}
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-20 h-20 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
               <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-indigo-400 to-pink-400">V</span>
            </div>
            <div className="absolute -bottom-2 px-2 py-0.5 bg-zinc-800 rounded text-[8px] text-zinc-400 font-bold border border-white/5">BETA</div>
          </div>

          {/* Text */}
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
            VibeAI
          </h1>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
            The anti-dating app. <br/>
            AI matches you based on who you <span className="text-zinc-200 underline decoration-pink-500/50 underline-offset-2">actually are</span>.
          </p>

          {/* Google Button Container */}
          <div className="w-full h-[50px] flex items-center justify-center mb-4 min-h-[50px]">
             {/* This div is where Google renders its button */}
             <div id="googleBtn" className="w-full flex justify-center"></div>
          </div>
          
          {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg w-full mb-4">
                  <p className="text-red-400 text-xs">{error}</p>
              </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest cursor-default">
            <span className="hover:text-zinc-400 transition-colors">Privacy</span>
            <span>•</span>
            <span className="hover:text-zinc-400 transition-colors">Terms</span>
          </div>

        </div>

        {/* Developer Bypass - Discreet for production demo */}
        <div 
            className="mt-8 text-center"
            onMouseEnter={() => setIsHoveringDebug(true)}
            onMouseLeave={() => setIsHoveringDebug(false)}
        >
            <button 
                onClick={handleDevLogin}
                className={`text-zinc-800 text-[10px] font-mono hover:text-zinc-500 transition-all duration-500 ${isHoveringDebug ? 'opacity-100' : 'opacity-20'}`}
            >
                [ Developer Bypass Mode ]
            </button>
        </div>

        {/* Floating elements behind */}
        <div className="absolute top-0 right-0 -z-10 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-bounce delay-700"></div>
        <div className="absolute bottom-10 left-4 -z-10 w-32 h-32 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

      </div>
    </div>
  );
};

export default AuthPage;