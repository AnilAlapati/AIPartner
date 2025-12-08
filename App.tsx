
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AppStep, Message, UserPersona, MatchResult } from './types';
import { FEMALE_CANDIDATES } from './data/mockProfiles';
import { createChatSession, generateUserPersona, findMatches } from './services/geminiService';
import { getCurrentUser, logout } from './services/authService';
import ChatInterface from './components/ChatInterface';
import MatchCard from './components/MatchCard';
import Loader from './components/Loader';
import UserProfile from './components/UserProfile';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState<AppStep>('landing');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [userPersona, setUserPersona] = useState<UserPersona | null>(null);
  const [matches, setMatches] = useState<{ result: MatchResult, candidate: any }[]>([]);
  
  const MAX_QUESTIONS = 5;
  const chatSessionRef = useRef<Chat | null>(null);

  // Check auth on load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize chat when entering chat step
  useEffect(() => {
    if (step === 'chat' && !chatSessionRef.current) {
      const initChat = async () => {
        try {
          chatSessionRef.current = createChatSession();
          setIsTyping(true);
          const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({
             message: "Start the conversation with a casual greeting and ask for my name." // Hidden prompt to start
          });
          
          if (response.text) {
             setChatHistory([{ role: 'model', text: response.text }]);
          }
        } catch (error) {
          console.error("Failed to start chat", error);
        } finally {
          setIsTyping(false);
        }
      };
      initChat();
    }
  }, [step]);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setStep('landing');
    setChatHistory([]);
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;

    const newHistory = [...chatHistory, { role: 'user', text } as Message];
    setChatHistory(newHistory);
    
    // Check if we should finish
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
    setStep('analyzing');
    setLoadingText("Constructing your vibe...");

    try {
      // 1. Generate Persona
      const conversationText = historyToUse.map(m => `${m.role.toUpperCase()}: ${m.text}`);
      const persona = await generateUserPersona(conversationText);
      setUserPersona(persona);
      setStep('profile'); // Show profile first

    } catch (error) {
      console.error("Analysis Error", error);
      setStep('chat');
      alert("Oops, couldn't analyze the vibes. Try chatting a bit more!");
    }
  };

  const handleFindMatches = async () => {
      if (!userPersona) return;
      
      setStep('analyzing');
      setLoadingText("Scanning the universe for matches...");

      try {
        const matchResults = await findMatches(userPersona, FEMALE_CANDIDATES);
      
        const mergedResults = matchResults.map(match => {
            const candidate = FEMALE_CANDIDATES.find(c => c.id === match.candidateId);
            return { result: match, candidate };
        }).filter(item => item.candidate !== undefined)
          .sort((a, b) => b.result.matchScore - a.result.matchScore);

        setMatches(mergedResults);
        setStep('matches');
      } catch(error) {
          console.error("Matching Error", error);
          setStep('profile');
      }
  }

  // Render Auth Page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
        <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[130px] opacity-50"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 min-h-screen flex flex-col">
        
        {/* Navbar */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center shadow-lg shadow-white/10">
                <span className="text-black font-bold text-lg">V</span>
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-none">VibeAI</h1>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Public Beta</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                SIGN OUT
             </button>
             <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border border-white/5 px-2 py-1 rounded-full hidden md:block">
                Gemini 3 Powered
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col relative justify-center">
          
          {step === 'landing' && (
            <div className="flex flex-col items-center justify-center text-center space-y-10 animate-fade-in-up py-10">
              <div className="space-y-6 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 mb-2 hover:bg-white/10 transition-colors cursor-default">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                    AI-Native Dating • No Swiping
                </div>
                <h2 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
                  FIND YOUR <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 drop-shadow-2xl">
                    ACTUAL VIBE.
                  </span>
                </h2>
                <p className="text-xl text-zinc-400 max-w-lg mx-auto leading-relaxed font-light">
                  Skip the superficial bio. Our AI learns your story in 5 quick questions and finds your psychological match.
                </p>
              </div>

              <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent max-w-xs w-full mx-auto">
                <div className="bg-[#09090b] rounded-[1.4rem] p-6 space-y-5 border border-white/5">
                    <div className="space-y-3">
                        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex justify-between">
                            <span>I identify as</span>
                            <span className="text-purple-400">Step 1/2</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-3.5 bg-zinc-100 text-black rounded-xl font-bold text-sm hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-white/10">
                                Male
                            </button>
                            <button disabled className="py-3.5 bg-zinc-800/50 text-zinc-600 rounded-xl font-bold text-sm cursor-not-allowed border border-zinc-800 opacity-50">
                                Female
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setStep('chat')}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-xl shadow-purple-500/20 active:scale-95"
                    >
                        Start Vibe Check
                    </button>
                    <p className="text-[10px] text-zinc-600 text-center font-medium">Limited to 5 questions for accuracy</p>
                </div>
              </div>
            </div>
          )}

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
            <div className="flex-1 flex items-center justify-center">
                <Loader text={loadingText} />
            </div>
          )}

          {step === 'profile' && userPersona && (
              <UserProfile persona={userPersona} onContinue={handleFindMatches} />
          )}

          {step === 'matches' && (
            <div className="space-y-8 animate-fade-in pb-10 w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Curated Matches</h2>
                        <p className="text-zinc-400 text-sm">Matches based on "{userPersona?.summary}"</p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2.5 text-sm font-bold bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <span>↺</span> Reset Experience
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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

        </main>
      </div>
    </div>
  );
};

export default App;