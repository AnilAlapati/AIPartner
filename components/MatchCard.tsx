import React from 'react';
import { CandidateProfile, MatchResult } from '../types';

interface MatchCardProps {
  candidate: CandidateProfile;
  matchData: MatchResult;
  rank: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ candidate, matchData, rank }) => {
  return (
    <div className="glass rounded-[2rem] overflow-hidden hover:translate-y-[-5px] transition-all duration-300 border border-white/5 flex flex-col h-full relative group shadow-xl hover:shadow-purple-500/10">
      
      {/* Match Score Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`
            flex items-center justify-center px-3 py-1.5 rounded-full font-black text-xs shadow-lg backdrop-blur-md border border-white/10
            ${matchData.matchScore >= 85 ? 'bg-green-400/90 text-black' : 
              matchData.matchScore >= 70 ? 'bg-yellow-400/90 text-black' : 'bg-zinc-600/90 text-white'}
        `}>
            {matchData.matchScore}% COMPATIBLE
        </div>
      </div>

      {/* Image */}
      <div className="h-72 overflow-hidden relative">
        <img 
            src={candidate.image} 
            alt={candidate.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-5 w-full">
            <h3 className="text-3xl font-bold text-white leading-tight">{candidate.name}, <span className="text-zinc-400 text-2xl">{candidate.age}</span></h3>
            <p className="text-zinc-300 text-sm mt-1 line-clamp-2 opacity-90">{candidate.bio}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-5 flex-1 bg-zinc-900/30">
        {/* Reasoning */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative">
            <div className="absolute -top-3 left-4 bg-zinc-800 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700">
                AI MATCH REASONING
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed italic">"{matchData.reasoning}"</p>
        </div>

        {/* Highlights */}
        <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-3">Green Flags</p>
            <div className="flex flex-wrap gap-2">
                {matchData.compatibilityHighlights.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-500/10 text-purple-200 text-xs font-medium rounded-lg border border-purple-500/20">
                        ✨ {tag}
                    </span>
                ))}
            </div>
        </div>
        
        {/* Interests */}
        <div className="mt-auto pt-4 border-t border-white/5">
             <div className="flex flex-wrap gap-x-3 gap-y-1">
                {candidate.interests.slice(0,4).map((int, i) => (
                     <span key={i} className="text-xs text-zinc-500 font-medium">#{int.toLowerCase()}</span>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;