import React from "react";
import { UserPersona } from "../types";

interface UserProfileProps {
  persona: UserPersona;
  onContinue: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ persona, onContinue }) => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono mb-4">
          /// ANALYSIS_COMPLETE
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-3 uppercase tracking-tight">
          Your Vibe{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Decoded
          </span>
        </h2>
        <p className="text-zinc-400 font-mono text-sm">
          Gemini 3 has constructed your digital soul.
        </p>
      </div>

      <div className="relative group">
        {/* Animated Border Gradient */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2.5rem] opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient"></div>

        <div className="relative bg-[#0a0a0a] rounded-[2.5rem] p-8 md:p-10 overflow-hidden">
          {/* Background Textures */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-10">
            {/* Header Section */}
            <div className="flex flex-col gap-6 border-b border-white/5 pb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-2xl">🧬</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Persona Type
                  </p>
                  <h3 className="text-xl font-bold text-white">
                    Neural Identity v3.0
                  </h3>
                </div>
              </div>

              <blockquote className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
                <span className="text-purple-500">"</span>
                {persona.summary}
                <span className="text-purple-500">"</span>
              </blockquote>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Core Values */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Core Values
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {persona.coreValues.map((val, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-zinc-900/50 text-blue-100 rounded-xl text-sm border border-blue-500/20 font-medium hover:bg-blue-500/10 transition-colors cursor-default"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hobbies */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_10px_rgba(244,114,182,0.8)]"></span>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Obsessions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {persona.hobbies.map((hobby, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-zinc-900/50 text-pink-100 rounded-xl text-sm border border-pink-500/20 font-medium hover:bg-pink-500/10 transition-colors cursor-default"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Communication Style */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <span className="text-2xl">💬</span>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Communication Style
                </p>
                <p className="text-lg text-zinc-200 font-medium">
                  {persona.communicationStyle}
                </p>
              </div>
            </div>

            {/* Ideal Partner Section */}
            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-purple-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>

              <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="animate-pulse">●</span> AI Match Prediction
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {persona.idealPartnerTraits.map((trait, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-purple-500/10"
                  >
                    <span className="text-purple-400 text-lg">✦</span>
                    <span className="text-purple-100/90 text-sm font-medium">
                      {trait}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onContinue}
              className="group relative w-full py-5 bg-white text-black font-display font-black text-xl uppercase tracking-tight rounded-2xl overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-white to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-3">
                Initiate Matching Sequence
                <svg
                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
