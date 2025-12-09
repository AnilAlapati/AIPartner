import React from "react";
import { CandidateProfile, MatchResult } from "../types";

interface MatchCardProps {
  candidate: CandidateProfile;
  matchData: MatchResult;
  rank: number;
}

const gradients = [
  "from-pink-500 via-purple-500 to-indigo-500",
  "from-blue-400 via-teal-500 to-emerald-500",
  "from-orange-400 via-red-500 to-pink-500",
  "from-yellow-400 via-orange-500 to-red-500",
  "from-indigo-400 via-purple-500 to-pink-500",
  "from-green-400 via-cyan-500 to-blue-500",
  "from-fuchsia-500 via-purple-600 to-blue-600",
  "from-rose-400 via-fuchsia-500 to-indigo-500",
];

const MatchCard: React.FC<MatchCardProps> = ({
  candidate,
  matchData,
  rank,
}) => {
  // Deterministic gradient based on name length + age
  const gradientIndex =
    (candidate.name.length + candidate.age) % gradients.length;
  const gradientClass = gradients[gradientIndex];

  return (
    <div className="glass rounded-[2rem] overflow-hidden hover:translate-y-[-5px] transition-all duration-300 border border-white/5 flex flex-col h-full relative group shadow-xl hover:shadow-purple-500/10">
      {/* Match Score Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className={`
            flex items-center justify-center px-3 py-1.5 rounded-full font-black text-xs shadow-lg backdrop-blur-md border border-white/10
            ${
              matchData.matchScore >= 85
                ? "bg-green-400/90 text-black"
                : matchData.matchScore >= 70
                ? "bg-yellow-400/90 text-black"
                : "bg-zinc-600/90 text-white"
            }
        `}
        >
          {matchData.matchScore}% COMPATIBLE
        </div>
      </div>

      {/* Abstract Visual (No Photo) */}
      <div className="h-72 overflow-hidden relative bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
        {/* Animated Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-40 group-hover:opacity-60 transition-opacity duration-700`}
        ></div>

        {/* Large Initials */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-9xl font-black text-white/10 select-none group-hover:text-white/20 transition-colors transform group-hover:scale-110 duration-700">
            {candidate.name.charAt(0)}
          </span>
        </div>

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

        <div className="absolute bottom-0 left-0 p-5 w-full z-10">
          <div className="flex items-end gap-2 mb-1">
            <h3 className="text-3xl font-bold text-white leading-tight">
              {candidate.name}
            </h3>
            <span className="text-zinc-400 text-xl font-medium mb-1">
              {candidate.age}
            </span>
          </div>
          <p className="text-zinc-300 text-sm line-clamp-2 opacity-90 font-light">
            {candidate.bio}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-5 flex-1 bg-zinc-900/30 backdrop-blur-sm">
        {/* Reasoning */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative">
          <div className="absolute -top-3 left-4 bg-zinc-800 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700 shadow-sm">
            GEMINI 3 REASONING
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            "{matchData.reasoning}"
          </p>
        </div>

        {/* Highlights */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-3">
            Green Flags
          </p>
          <div className="flex flex-wrap gap-2">
            {matchData.compatibilityHighlights.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-purple-500/10 text-purple-200 text-xs font-medium rounded-lg border border-purple-500/20"
              >
                ✨ {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {candidate.interests.slice(0, 4).map((int, i) => (
              <span
                key={i}
                className="text-xs text-zinc-500 font-medium hover:text-zinc-300 transition-colors"
              >
                #{int.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
