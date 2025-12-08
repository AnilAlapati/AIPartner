import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AppStep, Message, UserPersona, MatchResult, CandidateProfile } from './types';
import { generateCandidates } from './data/profileGenerator'; 
import { createChatSession, generateUserPersona, findMatches } from './services/geminiService';
import { getCurrentUser, logout } from './services/authService';
import ChatInterface from './components/ChatInterface';
import MatchCard from './components/MatchCard';
import Loader from './components/Loader';
import UserProfile from './components/UserProfile';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize state from localStorage if available
  const [step, setStep] = useState<AppStep>(() => {
    const saved = localStorage.getItem('vibeai_step');
    return (saved as AppStep) || 'landing';
  });

  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const saved = localStorage.getItem('vibeai_chat');
    return saved ? JSON.parse(saved) : [];
  });

  const [userPersona, setUserPersona] = useState<UserPersona | null>(() => {
    const saved = localStorage.getItem('vibeai_persona');
    return saved ? JSON.parse(saved) : null;
  });

  const [matches, setMatches] = useState<{ result: MatchResult, candidate: any }[]>(() => {
    const saved = localStorage.getItem('vibeai_matches');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [candidatesPool] = useState<CandidateProfile[]>(() => generateCandidates(500, 'Female'));

  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const MAX_QUESTIONS = 5;
  const chatSessionRef = useRef<Chat | null>(null);

  // Check auth on load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('vibeai_step', step);
  }, [step]);

  useEffect(() => {
    localStorage.setItem('vibeai_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (userPersona) {
      localStorage.setItem('vibeai_persona', JSON.stringify(userPersona));
    }
  }, [userPersona]);

  useEffect(() => {
    if (matches.length > 0) {
      localStorage.setItem('vibeai_matches', JSON.stringify(matches));
    }
  }, [matches]);

  // Initialize chat when entering chat step
  useEffect(() => {
    if (step === 'chat' && !chatSessionRef.current) {
      const initChat = async () => {
        try {
          chatSessionRef.current = createChatSession();
          
          if (chatHistory.length === 0) {
            setIsTyping(true);
            const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({
               message: "Start the conversation with a casual greeting and ask for my name." 
            });
            
            if (response.text) {
               setChatHistory([{ role: 'model', text: response.text }]);
            }
            setIsTyping(false);
          }
        } catch (error) {
          console.error("Failed to start chat", error);
          setIsTyping(false);
        }
      };
      initChat();
    }
  }, [step]);

  const handleReset = () => {
    localStorage.removeItem('vibeai_step');
    localStorage.removeItem('vibeai_chat');
    localStorage.removeItem('vibeai_persona');
    localStorage.removeItem('vibeai_matches');
    setStep('landing');
    setChatHistory([]);
    setUserPersona(null);
    setMatches([]);
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    handleReset();
    setIsAuthenticated(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;

    const newHistory = [...chatHistory, { role: 'user', text } as Message];
    setChatHistory(newHistory);
    
    const userMessageCount = newHistory.filter(m => m.role === 'user').length;
    if (userMessageCount >= MAX_QUESTIONS) {
        handleFinishChat(newHistory);
        return;
    }

    setIsTyping(true);

    try {
      const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: text });
      if (response.text) {
        setChatHistory(prev => [...prev, { role: 'model', text: response.text } as Message]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setChatHistory(prev => [...prev, { role: 'model', text: "My bad, connection glitch. Say that again?" } as Message]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishChat = async (historyOverride?: Message[]) => {
    const historyToUse = historyOverride || chatHistory;
    
    if (historyToUse.length === 0) {
        alert("Please chat a bit first!");
        return;
    }

    setStep('analyzing');
    setLoadingText("Constructing your vibe...");

    try {
      const conversationText = historyToUse.map(m => `${m.role.toUpperCase()}: ${m.text}`);
      const persona = await generateUserPersona(conversationText);
      setUserPersona(persona);
      setStep('profile'); 

    } catch (error) {
      console.error("Analysis Error", error);
      setStep('chat');
      alert("Oops, couldn't analyze the vibes. Please try again.");
    }
  };

  const handleFindMatches = async () => {
      if (!userPersona) return;
      
      setStep('analyzing');
      setLoadingText("Scanning the universe for matches...");

      try {
        const matchResults = await findMatches(userPersona, candidatesPool);
      
        const mergedResults = matchResults.map(match => {
            const candidate = candidatesPool.find(c => c.id === match.candidateId);
            return { result: match, candidate };
        }).filter(item => item.candidate !== undefined)
          .sort((a, b) => b.result.matchScore - a.result.matchScore);

        setMatches(mergedResults);
        setStep('matches');
      } catch(error) {
          console.error("Matching Error", error);
          setStep('profile');
          alert("Had trouble finding matches. Try again?");
      }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030303] text-zinc-100">
        <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 selection:bg-[#ccff00] selection:text-black overflow-x-hidden relative grid-lines">
      {/* Global Texture Overlays */}
      <div className="scanlines"></div>
      
      {/* Navbar - Minimalist */}
      <header className="fixed top-0 left-0 w-full z-50 mix-blend-difference border-b border-white/10 backdrop-blur-sm">
         <div className="flex justify-between items-center px-4 md:px-8 py-4">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
                <span className="w-3 h-3 bg-[#ccff00] animate-pulse"></span>
                <span className="font-display font-bold text-lg tracking-tight">VIBE_AI_PROTOCOL</span>
             </div>
             <button onClick={handleLogout} className="text-[10px] font-mono hover:bg-white hover:text-black px-2 py-1 transition-colors border border-white/20">
                [ TERMINATE_SESSION ]
             </button>
         </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 min-h-screen flex flex-col relative z-10">
        
        {step === 'landing' && (
           <div className="flex-1 flex flex-col md:flex-row h-full relative p-4 md:p-8 gap-4">
                
                {/* Visual Blobs */}
                <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse"></div>
                <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-lime-400 rounded-full blur-[150px] opacity-10"></div>

                {/* Left Column: Manifesto */}
                <div className="flex-1 flex flex-col justify-between border border-white/10 p-6 md:p-10 relative overflow-hidden bg-black/40 backdrop-blur-sm group hover:border-white/20 transition-all duration-500">
                     <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-500">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        LIVE_FEED_ACTIVE
                     </div>

                     <div className="mt-12">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black leading-[0.8] tracking-tighter text-white uppercase glitch" data-text="DEATH TO SMALL TALK">
                            DEATH TO <br/>
                            <span className="text-outline">SMALL</span> <br/>
                            TALK
                        </h1>
                     </div>

                     <div className="mt-12 max-w-md">
                        <p className="font-mono text-sm md:text-base text-zinc-400 leading-relaxed border-l-2 border-[#ccff00] pl-4">
                            Current dating protocols are obsolete. <br/>
                            We use <span className="text-[#ccff00]">Gemini 3 Neural Architecture</span> to parse your life experience into raw data, then match you with a compatible soul.
                        </p>
                     </div>
                </div>

                {/* Right Column: Interaction */}
                <div className="flex-1 flex flex-col gap-4">
                    
                    {/* Top Right: Stats / Info */}
                    <div className="flex-1 border border-white/10 p-6 flex flex-col justify-center bg-black/40 backdrop-blur-sm hover:bg-white/5 transition-colors">
                        <div className="grid grid-cols-2 gap-8">
                             <div>
                                <h3 className="text-4xl font-display font-bold text-[#ccff00]">500+</h3>
                                <p className="font-mono text-xs text-zinc-500 uppercase mt-1">Synthetic_Agents</p>
                             </div>
                             <div>
                                <h3 className="text-4xl font-display font-bold text-white">99.9%</h3>
                                <p className="font-mono text-xs text-zinc-500 uppercase mt-1">Match_Accuracy</p>
                             </div>
                             <div>
                                <h3 className="text-4xl font-display font-bold text-pink-500">0</h3>
                                <p className="font-mono text-xs text-zinc-500 uppercase mt-1">Swipes_Required</p>
                             </div>
                             <div>
                                <h3 className="text-4xl font-display font-bold text-white">v3.1</h3>
                                <p className="font-mono text-xs text-zinc-500 uppercase mt-1">System_Version</p>
                             </div>
                        </div>
                    </div>

                    {/* Bottom Right: Action */}
                    <div className="flex-1 border border-white/10 p-6 flex items-center justify-center relative bg-[#ccff00] overflow-hidden group cursor-pointer" onClick={() => setStep('chat')}>
                        <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10"></div>
                        
                        <div className="relative z-20 text-center mix-blend-normal group-hover:mix-blend-difference transition-all">
                             <h2 className="text-5xl font-display font-black text-black group-hover:text-white uppercase tracking-tighter">
                                INITIALIZE
                             </h2>
                             <p className="font-mono text-xs text-black group-hover:text-white mt-2 uppercase tracking-widest">
                                [ Click to Scan Profile ]
                             </p>
                        </div>
                    </div>
                </div>
           </div>
        )}

        {/* Steps Container (Centered for Chat, Profile, etc) */}
        {step !== 'landing' && (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                 {step === 'chat' && (
                    <ChatInterface 
                    messages={chatHistory} 
                    onSendMessage={handleSendMessage} 
                    isTyping={isTyping}
                    onFinish={() => handleFinishChat()}
                    currentStep={chatHistory.filter(m => m.role === 'user').length + 1}
                    totalSteps={MAX_QUESTIONS}
                    />
                )}

                {step === 'analyzing' && (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader text={loadingText} />
                    </div>
                )}

                {step === 'profile' && userPersona && (
                    <UserProfile persona={userPersona} onContinue={handleFindMatches} />
                )}

                {step === 'matches' && (
                    <div className="space-y-8 animate-fade-in pb-10">
                         <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
                            <div>
                                <div className="text-[#ccff00] font-mono text-xs mb-2">/// MATCH_PROTOCOL_COMPLETE</div>
                                <h2 className="text-5xl font-display font-black text-white uppercase">Your Roster</h2>
                            </div>
                            <button 
                                onClick={handleReset} 
                                className="px-6 py-3 border border-white/20 text-xs font-mono bg-transparent hover:bg-white hover:text-black transition-all"
                            >
                                [ REBOOT_SYSTEM ]
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matches.map((item, index) => (
                                <MatchCard 
                                    key={item.candidate.id}
                                    candidate={item.candidate}
                                    matchData={item.result}
                                    rank={index + 1}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* Footer / Copyright */}
      <footer className="fixed bottom-4 left-4 z-40 mix-blend-difference hidden md:block">
          <p className="text-[10px] font-mono text-white/50">
             VIBE_AI © 2025 // POWERED BY GEMINI 3
          </p>
      </footer>
    </div>
  );
};

export default App;