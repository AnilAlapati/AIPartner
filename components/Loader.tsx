import React from 'react';

const Loader: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-4 border-pink-500 rounded-full animate-spin animation-delay-200"></div>
        <div className="absolute inset-4 border-b-4 border-indigo-500 rounded-full animate-spin animation-delay-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-2xl">✨</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
        {text}
      </h2>
      <p className="text-zinc-500 text-sm animate-pulse">Running Gemini 3 complex reasoning...</p>
    </div>
  );
};

export default Loader;