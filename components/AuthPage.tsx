import React, { useState } from 'react';
import { loginWithGoogle } from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
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
               <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-indigo-400 to-pink-400">M</span>
            </div>
          </div>

          {/* Text */}
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
            MyPartner
          </h1>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
            The anti-dating app. <br/>
            AI matches you based on who you <span className="text-zinc-200 underline decoration-pink-500/50 underline-offset-2">actually are</span>.
          </p>

          {/* Action */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold text-base transition-all transform active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 group"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-8 flex gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>Privacy First</span>
            <span>•</span>
            <span>No Swiping</span>
            <span>•</span>
            <span>Gemini 3</span>
          </div>

        </div>

        {/* Floating elements behind */}
        <div className="absolute top-0 right-0 -z-10 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-bounce delay-700"></div>
        <div className="absolute bottom-10 left-4 -z-10 w-32 h-32 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

      </div>
    </div>
  );
};

export default AuthPage;