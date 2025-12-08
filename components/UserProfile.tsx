import React from 'react';
import { UserPersona } from '../types';

interface UserProfileProps {
  persona: UserPersona;
  onContinue: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ persona, onContinue }) => {
  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
        
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete</h2>
        <p className="text-zinc-400">Here is how the AI perceives your dating profile</p>
      </div>

      <div className="glass rounded-[2rem] p-1 border border-white/10 relative overflow-hidden shadow-2xl">
        {/* Decorative background blur inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[1.8rem] p-6 md:p-8 flex flex-col gap-8 h-full relative z-10">
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
             <div className="flex-1 space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-200 text-[10px] font-bold tracking-wider uppercase">
                    AI Generated Persona
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    "{persona.summary}"
                </h3>
             </div>
             
             <div className="w-full md:w-auto bg-white/5 rounded-2xl p-4 border border-white/5 min-w-[200px]">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Communication Style</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <p className="text-zinc-200 text-sm font-medium">{persona.communicationStyle}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Your Core Values</p>
              <div className="flex flex-wrap gap-2">
                {persona.coreValues.map((val, i) => (
                  <span key={i} className="px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-lg text-sm border border-zinc-700 font-medium">
                    {val}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Passions & Hobbies</p>
              <div className="flex flex-wrap gap-2">
                {persona.hobbies.map((hobby, i) => (
                  <span key={i} className="px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-lg text-sm border border-zinc-700 font-medium">
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-5 rounded-2xl border border-purple-500/20">
             <p className="text-xs text-pink-300 uppercase font-bold tracking-wider mb-3">AI Recommendation: Ideal Partner</p>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {persona.idealPartnerTraits.map((trait, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-pink-100/90">
                        <span className="text-pink-500">✦</span> {trait}
                    </li>
                ))}
             </ul>
          </div>

          <button 
            onClick={onContinue}
            className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:shadow-white/10 active:scale-95 flex items-center justify-center gap-2"
          >
            Find My Matches <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;