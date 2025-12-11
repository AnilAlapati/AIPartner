import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import {
  AppStep,
  Message,
  UserPersona,
  MatchResult,
  CandidateProfile,
} from "./types";
import { generateCandidates } from "./data/profileGenerator";
import { FEMALE_CANDIDATES } from "./data/mockProfiles";
import {
  createChatSession,
  generateUserPersona,
  findMatches,
  getUserProfile,
} from "./services/geminiService";
import { getCurrentUser, logout } from "./services/authService";
import { initGA, analytics } from "./services/analytics";
import ChatInterface from "./components/ChatInterface";
import MatchCard from "./components/MatchCard";
import Loader from "./components/Loader";
import UserProfile from "./components/UserProfile";
import AuthPage from "./components/AuthPage";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize Google Analytics
  useEffect(() => {
    initGA();
  }, []);

  // Initialize state from localStorage if available
  const [step, setStep] = useState<AppStep>(() => {
    // ALWAYS respect the URL first - this is the source of truth
    const path = window.location.pathname;

    // If visiting root URL, ALWAYS show landing - clear any stale localStorage
    if (path === "/" || path === "") {
      localStorage.removeItem("vibeai_step");
      return "landing";
    }

    // If URL matches a valid step, use it
    const stepFromPath = path.substring(1) as AppStep;
    const validSteps: AppStep[] = [
      "landing",
      "auth",
      "chat",
      "profile",
      "matches",
    ];
    if (validSteps.includes(stepFromPath)) {
      return stepFromPath;
    }

    // Fallback to landing for unknown URLs
    return "landing";
  });

  // Safety Net: Ensure we are on landing page if URL is root
  // This handles cases where state might be restored unexpectedly
  useEffect(() => {
    if (window.location.pathname === "/" && step !== "landing") {
      localStorage.removeItem("vibeai_step");
      setStep("landing");
    }
  }, []);

  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const saved = localStorage.getItem("vibeai_chat");
    return saved ? JSON.parse(saved) : [];
  });

  const [userPersona, setUserPersona] = useState<UserPersona | null>(() => {
    const saved = localStorage.getItem("vibeai_persona");
    return saved ? JSON.parse(saved) : null;
  });

  const [matches, setMatches] = useState<
    { result: MatchResult; candidate: any }[]
  >(() => {
    const saved = localStorage.getItem("vibeai_matches");
    return saved ? JSON.parse(saved) : [];
  });

  // Determine which candidate pool to use
  // By default, uses generated profiles (500 randomized)
  // Set USE_GENERATED_PROFILES to false in config to use original mockProfiles
  const [candidatesPool] = useState<CandidateProfile[]>(() => {
    const useGenerated = true; // Set to false to use FEMALE_CANDIDATES from mockProfiles.ts
    return useGenerated ? generateCandidates(500, "Female") : FEMALE_CANDIDATES;
  });

  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const MAX_QUESTIONS = 5;
  const chatSessionRef = useRef<Chat | null>(null);

  // Check auth on load
  useEffect(() => {
    const checkUserStatus = async () => {
      const user = getCurrentUser();
      if (user) {
        setIsAuthenticated(true);

        // Check if user already has a profile on server to prevent re-creation abuse
        if (!userPersona) {
          try {
            const existingProfile = await getUserProfile();
            if (existingProfile) {
              console.log("Restoring existing profile from server");
              setUserPersona(existingProfile);
              setStep((currentStep) => {
                if (currentStep === "landing" || currentStep === "chat") {
                  return "profile";
                }
                return currentStep;
              });
            }
          } catch (e) {
            console.error("Failed to check user profile", e);
          }
        }
      }
    };

    checkUserStatus();
  }, []);

  // Persist state changes
  useEffect(() => {
    // Don't persist "landing" to localStorage - we want root URL to always show landing
    if (step !== "landing") {
      localStorage.setItem("vibeai_step", step);
    }
  }, [step]);

  useEffect(() => {
    localStorage.setItem("vibeai_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (userPersona) {
      localStorage.setItem("vibeai_persona", JSON.stringify(userPersona));
    }
  }, [userPersona]);

  useEffect(() => {
    if (matches.length > 0) {
      localStorage.setItem("vibeai_matches", JSON.stringify(matches));
    }
  }, [matches]);

  // Update URL based on step (User Request #6)
  useEffect(() => {
    // Only update URL for stable user-facing steps, not transient states
    const urlSteps: AppStep[] = [
      "landing",
      "auth",
      "chat",
      "profile",
      "matches",
    ];
    if (urlSteps.includes(step)) {
      const path = step === "landing" ? "/" : `/${step}`;
      window.history.replaceState({ step }, "", path);
    }
  }, [step]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.step) {
        setStep(event.state.step as AppStep);
      } else {
        // If no state, check the URL path
        const path = window.location.pathname;
        if (path === "/" || path === "") {
          setStep("landing");
        } else {
          const stepFromPath = path.substring(1) as AppStep;
          const validSteps: AppStep[] = [
            "landing",
            "auth",
            "chat",
            "profile",
            "matches",
            "analyzing",
          ];
          if (validSteps.includes(stepFromPath)) {
            setStep(stepFromPath);
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Initialize chat when entering chat step
  useEffect(() => {
    if (step === "chat") {
      // Safety check: if we have a persona, we shouldn't be in chat
      if (userPersona) {
        setStep("profile");
        return;
      }

      if (!chatSessionRef.current) {
        const initChat = async () => {
          try {
            chatSessionRef.current = createChatSession();

            if (chatHistory.length === 0) {
              // Use instant hardcoded greeting instead of AI API call
              const greetings = [
                "hey! what's your name? and more importantly, what's a moment that changed your life?",
                "yo what's good. let's start with your name and a quick lore drop about yourself.",
                "sup! i'm here to get to know the real you. what's your name first?",
                "hey there! name and a quick story about yourself to start vibing?",
                "what's up! let's start simple - who are you and what's your vibe?",
              ];
              const greeting =
                greetings[Math.floor(Math.random() * greetings.length)];

              setChatHistory([{ role: "model", text: greeting }]);
            }
          } catch (error) {
            console.error("Failed to start chat", error);
          }
        };
        initChat();
      }
    }
  }, [step, userPersona]);

  const handleReset = () => {
    localStorage.removeItem("vibeai_step");
    localStorage.removeItem("vibeai_chat");
    localStorage.removeItem("vibeai_persona");
    localStorage.removeItem("vibeai_matches");
    setStep("landing");
    setChatHistory([]);
    setUserPersona(null);
    setMatches([]);
    window.location.reload();
  };

  const handleLogout = () => {
    analytics.userLogout();
    logout();
    handleReset();
    setIsAuthenticated(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;

    analytics.chatMessageSent();
    const newHistory = [...chatHistory, { role: "user", text } as Message];
    setChatHistory(newHistory);

    const userMessageCount = newHistory.filter((m) => m.role === "user").length;
    if (userMessageCount >= MAX_QUESTIONS) {
      // User Request #2: Proper transition before moving
      setIsTyping(true);
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "model",
            text: "Bet. I've got enough data to build your vibe profile. Let's see who's out there for you. 🚀",
          } as Message,
        ]);
        setIsTyping(false);
        setTimeout(() => {
          handleFinishChat(newHistory);
        }, 2500);
      }, 1000);
      return;
    }

    setIsTyping(true);

    try {
      const response: GenerateContentResponse =
        await chatSessionRef.current.sendMessage({ message: text });
      if (response.text) {
        setChatHistory((prev) => [
          ...prev,
          { role: "model", text: response.text } as Message,
        ]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: "My bad, connection glitch. Say that again?",
        } as Message,
      ]);
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

    setStep("analyzing");
    setLoadingText("Constructing your vibe...");

    try {
      const conversationText = historyToUse.map(
        (m) => `${m.role.toUpperCase()}: ${m.text}`
      );
      const persona = await generateUserPersona(conversationText);
      analytics.personaGenerated();
      setUserPersona(persona);
      setStep("profile");
    } catch (error) {
      console.error("Analysis Error", error);
      setStep("chat");
      alert("Oops, couldn't analyze the vibes. Please try again.");
    }
  };

  const handleFindMatches = async () => {
    if (!userPersona) return;

    analytics.matchingStarted();
    setStep("analyzing");
    setLoadingText("Scanning the universe for matches...");

    try {
      const matchResults = await findMatches(userPersona, candidatesPool);

      const mergedResults = matchResults
        .map((match) => {
          const candidate = candidatesPool.find(
            (c) => c.id === match.candidateId
          );
          return { result: match, candidate };
        })
        .filter((item) => item.candidate !== undefined)
        .sort((a, b) => b.result.matchScore - a.result.matchScore);

      setMatches(mergedResults);
      setStep("matches");
    } catch (error) {
      console.error("Matching Error", error);
      setStep("profile");
      alert("Had trouble finding matches. Try again?");
    }
  };

  // Show auth modal when user tries to start chat without being logged in
  const handleStartVibeCheck = async () => {
    if (!isAuthenticated) {
      setStep("auth");
      return;
    }

    // If we already have a persona locally, go to profile
    if (userPersona) {
      setStep("profile");
      return;
    }

    // Double check server before starting chat (in case local state is out of sync)
    try {
      const existingProfile = await getUserProfile();
      if (existingProfile) {
        setUserPersona(existingProfile);
        setStep("profile");
        return;
      }
    } catch (e) {
      console.error(e);
    }

    setStep("chat");
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 selection:bg-[#ccff00] selection:text-black overflow-x-hidden relative grid-lines">
      {/* Global Texture Overlays */}
      <div className="scanlines"></div>

      {/* Navbar - Minimalist */}
      <header className="fixed top-0 left-0 w-full z-50 mix-blend-difference border-b border-white/10 backdrop-blur-sm">
        <div className="flex justify-between items-center px-4 md:px-8 py-4">
          <div
            className={`flex items-center gap-3 ${
              step === "profile" || step === "matches"
                ? "cursor-default opacity-50"
                : "cursor-pointer"
            }`}
            onClick={() => {
              if (step === "profile" || step === "matches") return;
              setStep("landing");
              window.scrollTo(0, 0);
            }}
          >
            <span className="w-3 h-3 bg-[#ccff00] animate-pulse"></span>
            <span className="font-display font-bold text-lg tracking-tight">
              VIBE_AI_PROTOCOL{" "}
              <span className="text-[10px] text-[#ccff00] ml-2 font-mono">
                POWERED_BY_GEMINI_3
              </span>
            </span>
          </div>

          {/* Terminate Session Button - Visible on all pages except landing */}
          {step !== "landing" && (
            <button
              onClick={handleLogout}
              className="text-[10px] md:text-xs font-mono text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded transition-all uppercase tracking-wider flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Terminate Session
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 min-h-screen flex flex-col relative z-10">
        {step === "auth" && (
          <div className="container mx-auto px-4 py-8 max-w-md">
            <AuthPage
              onLoginSuccess={async () => {
                analytics.userLogin("google");
                setIsAuthenticated(true);

                // Check for existing profile
                try {
                  const existingProfile = await getUserProfile();
                  if (existingProfile) {
                    console.log("Restoring existing profile from server");
                    setUserPersona(existingProfile);
                    setStep("profile");
                  } else {
                    setStep("chat");
                  }
                } catch (e) {
                  console.error("Failed to check profile on login", e);
                  setStep("chat");
                }
              }}
            />
          </div>
        )}

        {step === "landing" && (
          <div className="flex-1 flex flex-col relative">
            {/* Visual Blobs - Enhanced */}
            <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-purple-600 rounded-full blur-[200px] opacity-20 animate-pulse"></div>
            <div className="fixed top-1/2 right-0 w-[600px] h-[600px] bg-[#ccff00] rounded-full blur-[180px] opacity-10 animate-pulse delay-1000"></div>
            <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-pink-500 rounded-full blur-[150px] opacity-15 animate-pulse delay-500"></div>

            {/* HERO SECTION */}
            <section className="min-h-screen flex flex-col justify-center relative p-4 md:p-8 lg:p-16">
              {/* Floating Status Badge */}
              <div className="absolute top-8 right-8 flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/50 backdrop-blur-md px-3 py-2 border border-white/10 rounded-full">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                NEURAL_NET_ACTIVE
              </div>

              <div className="max-w-7xl mx-auto w-full">
                {/* Brand Logo + Tagline */}
                <div className="mb-12 flex items-center gap-4 animate-fade-in-up">
                  <div className="flex flex-col">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ccff00] to-pink-500 flex items-center justify-center font-display font-black text-black shadow-lg shadow-[#ccff00]/20">
                        V
                      </div>
                      <span className="font-display font-black text-2xl tracking-tight">
                        VIBE_AI
                      </span>
                      <span className="text-[10px] font-mono text-[#ccff00] bg-[#ccff00]/10 px-2 py-1 rounded border border-[#ccff00]/30">
                        BETA
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 tracking-widest">
                      /// DIGITAL_INTIMACY_PROTOCOL
                    </p>
                  </div>
                </div>

                {/* Headline */}
                <div className="mb-10">
                  <div className="text-[#ccff00] font-mono text-xs mb-6 tracking-widest">
                    /// PROTOCOL_INITIATED
                  </div>
                  <h1
                    className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[0.9] tracking-tighter text-white uppercase glitch"
                    data-text="WHERE STORIES CONNECT SOULS"
                  >
                    WHERE <br />
                    <span className="text-outline">STORIES</span> <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ccff00] via-pink-500 to-purple-500">
                      CONNECT SOULS
                    </span>
                  </h1>
                </div>

                {/* Subtext */}
                <div className="max-w-2xl mb-12">
                  <div className="inline-block mb-6 px-4 py-2 bg-[#ccff00]/10 border border-[#ccff00]/30 rounded-xl backdrop-blur-sm">
                    <span className="text-[#ccff00] text-xs font-bold tracking-widest">
                      POWERED_BY_GEMINI_3_PRO
                    </span>
                  </div>
                  <p className="font-mono text-base md:text-lg text-zinc-300 leading-relaxed border-l-4 border-[#ccff00] pl-6 mb-6">
                    Current dating protocols are{" "}
                    <span className="text-red-400 line-through">obsolete</span>{" "}
                    <span className="text-[#ccff00]">REIMAGINED</span>. <br />
                    We don't swipe. We don't judge. <br />
                    We use{" "}
                    <span className="text-[#ccff00] font-bold">
                      Gemini 3 Pro's Advanced Reasoning
                    </span>{" "}
                    to understand{" "}
                    <span className="italic">who you actually are</span>, then
                    match you with someone who genuinely gets it.
                  </p>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#ccff00]"></span>
                      One Conversation
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-pink-500"></span>
                      Real Matches
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500"></span>
                      No Swiping
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                  <button
                    onClick={handleStartVibeCheck}
                    className="group relative px-8 py-5 bg-[#ccff00] text-black font-display font-bold text-lg uppercase tracking-tight overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ccff00]/20"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <span className="w-2 h-2 bg-black rounded-full group-hover:animate-ping"></span>
                      Start Vibe Check (5 min)
                    </span>
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                  </button>
                  <button
                    onClick={() =>
                      document
                        .querySelector('[id="how-it-works"]')
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="px-8 py-5 border-2 border-white/30 text-white font-display font-bold text-lg uppercase tracking-tight hover:border-white/60 hover:bg-white/5 transition-all"
                  >
                    Learn How It Works
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 border-t border-white/10 pt-12">
                  <div className="group">
                    <h3 className="text-4xl md:text-5xl font-display font-black text-[#ccff00] group-hover:scale-110 transition-transform origin-left mb-2">
                      500+
                    </h3>
                    <p className="font-mono text-[11px] md:text-[12px] text-zinc-200 font-bold uppercase tracking-widest">
                      AI Personalities
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                      Unique matches
                    </p>
                  </div>
                  <div className="group">
                    <h3 className="text-4xl md:text-5xl font-display font-black text-white group-hover:scale-110 transition-transform origin-left mb-2">
                      99.9%
                    </h3>
                    <p className="font-mono text-[11px] md:text-[12px] text-zinc-200 font-bold uppercase tracking-widest">
                      Match Accuracy
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                      Based on reasoning
                    </p>
                  </div>
                  <div className="group">
                    <h3 className="text-4xl md:text-5xl font-display font-black text-pink-500 group-hover:scale-110 transition-transform origin-left mb-2">
                      0
                    </h3>
                    <p className="font-mono text-[11px] md:text-[12px] text-zinc-200 font-bold uppercase tracking-widest">
                      Swipes Needed
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                      No endless scrolling
                    </p>
                  </div>
                  <div className="group">
                    <h3 className="text-4xl md:text-5xl font-display font-black text-purple-500 group-hover:scale-110 transition-transform origin-left mb-2">
                      5min
                    </h3>
                    <p className="font-mono text-[11px] md:text-[12px] text-zinc-200 font-bold uppercase tracking-widest">
                      Time To Match
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                      Fast & efficient
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section
              id="how-it-works"
              className="py-24 md:py-32 px-4 md:px-8 lg:px-16 border-t border-white/10 relative"
            >
              <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                  <div className="text-[#ccff00] font-mono text-xs mb-4 tracking-widest">
                    /// HOW_IT_WORKS
                  </div>
                  <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tight">
                    Three Steps to <br />
                    <span className="text-outline">Connection</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Step 1 */}
                  <div className="group relative border border-white/10 p-8 bg-black/40 backdrop-blur-sm hover:border-[#ccff00]/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-[150px] font-display font-black text-white/5 group-hover:text-[#ccff00]/10 transition-colors">
                      01
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 border border-[#ccff00] flex items-center justify-center mb-6 group-hover:bg-[#ccff00] transition-colors">
                        <svg
                          className="w-8 h-8 text-[#ccff00] group-hover:text-black transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3 uppercase">
                        Have a Chat
                      </h3>
                      <p className="font-mono text-sm text-zinc-400 leading-relaxed">
                        No quizzes. No profiles. Just a natural conversation
                        with our AI that learns who you really are beneath the
                        surface.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="group relative border border-white/10 p-8 bg-black/40 backdrop-blur-sm hover:border-pink-500/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-[150px] font-display font-black text-white/5 group-hover:text-pink-500/10 transition-colors">
                      02
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 border border-pink-500 flex items-center justify-center mb-6 group-hover:bg-pink-500 transition-colors">
                        <svg
                          className="w-8 h-8 text-pink-500 group-hover:text-black transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3 uppercase">
                        AI Analysis
                      </h3>
                      <p className="font-mono text-sm text-zinc-400 leading-relaxed">
                        Gemini 3 builds your unique vibe profile—your values,
                        humor, attachment style, and hidden preferences.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="group relative border border-white/10 p-8 bg-black/40 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-[150px] font-display font-black text-white/5 group-hover:text-purple-500/10 transition-colors">
                      03
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 border border-purple-500 flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                        <svg
                          className="w-8 h-8 text-purple-500 group-hover:text-black transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white mb-3 uppercase">
                        Meet Matches
                      </h3>
                      <p className="font-mono text-sm text-zinc-400 leading-relaxed">
                        Get introduced to people who match your energy. Deep
                        compatibility scores explain exactly why you click.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-20 md:py-32 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent relative">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left: Text */}
                  <div>
                    <div className="text-pink-500 font-mono text-xs mb-4 tracking-widest">
                      /// WHY_DIFFERENT
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tight mb-8">
                      Not Another <br />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                        Dating App
                      </span>
                    </h2>
                    <div className="space-y-6">
                      <div className="flex gap-4 items-start group">
                        <div className="w-10 h-10 bg-[#ccff00]/20 border border-[#ccff00]/50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ccff00] transition-colors">
                          <span className="text-[#ccff00] group-hover:text-black transition-colors font-bold">
                            ✗
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-lg">
                            No Swiping
                          </h4>
                          <p className="font-mono text-sm text-zinc-400">
                            Swiping reduces humans to snapshots. We analyze
                            conversations instead.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start group">
                        <div className="w-10 h-10 bg-pink-500/20 border border-pink-500/50 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500 transition-colors">
                          <span className="text-pink-500 group-hover:text-black transition-colors font-bold">
                            ✗
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-lg">
                            No Bio Writing
                          </h4>
                          <p className="font-mono text-sm text-zinc-400">
                            Bios are performances. Our AI discovers the
                            authentic you through dialogue.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start group">
                        <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 transition-colors">
                          <span className="text-purple-500 group-hover:text-black transition-colors font-bold">
                            ✗
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-lg">
                            No Algorithms Playing Games
                          </h4>
                          <p className="font-mono text-sm text-zinc-400">
                            We don't hide matches to boost engagement. Pure
                            compatibility, nothing else.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visual Card */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-3xl"></div>
                    <div className="relative border border-white/10 bg-black/60 backdrop-blur-xl p-8 rounded-3xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl">
                          🧬
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-xl">
                            Your Vibe DNA
                          </h4>
                          <p className="font-mono text-xs text-zinc-500">
                            PERSONALITY_MATRIX_v3.1
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-zinc-400">
                              Emotional_Intelligence
                            </span>
                            <span className="text-[#ccff00]">92%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[92%] bg-gradient-to-r from-[#ccff00] to-lime-400 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-zinc-400">
                              Humor_Compatibility
                            </span>
                            <span className="text-pink-500">87%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[87%] bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-zinc-400">
                              Value_Alignment
                            </span>
                            <span className="text-purple-500">95%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[95%] bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-zinc-400">
                              Communication_Style
                            </span>
                            <span className="text-cyan-500">89%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[89%] bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-20 md:py-32 px-4 md:px-8 lg:px-16 border-t border-white/10">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <div className="text-[#ccff00] font-mono text-xs mb-4 tracking-widest">
                    /// USER_FEEDBACK
                  </div>
                  <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tight">
                    Real <span className="text-outline">Connections</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="border border-white/10 p-6 bg-black/40 backdrop-blur-sm hover:border-[#ccff00]/30 transition-all group">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-[#ccff00]">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="font-mono text-sm text-zinc-300 mb-6 leading-relaxed">
                      "Finally an app that doesn't make me feel like a product.
                      The AI actually understood my weird sense of humor and
                      matched me with someone equally unhinged."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500"></div>
                      <div>
                        <p className="font-display font-bold text-white text-sm">
                          Sarah K.
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          MATCHED_3_WEEKS_AGO
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-white/10 p-6 bg-black/40 backdrop-blur-sm hover:border-pink-500/30 transition-all group">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-pink-500">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="font-mono text-sm text-zinc-300 mb-6 leading-relaxed">
                      "The vibe analysis was scary accurate. It picked up on
                      things about myself I hadn't even articulated. My match
                      and I have been talking for hours every day."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                      <div>
                        <p className="font-display font-bold text-white text-sm">
                          Marcus T.
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          MATCHED_1_MONTH_AGO
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-white/10 p-6 bg-black/40 backdrop-blur-sm hover:border-purple-500/30 transition-all group">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-purple-500">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="font-mono text-sm text-zinc-300 mb-6 leading-relaxed">
                      "I was skeptical about AI matching but this hit different.
                      No awkward first messages—we already knew we'd click
                      before we even started talking."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ccff00] to-green-500"></div>
                      <div>
                        <p className="font-display font-bold text-white text-sm">
                          Jamie L.
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          MATCHED_2_WEEKS_AGO
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-20 md:py-32 px-4 md:px-8 lg:px-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#ccff00]/10 via-transparent to-transparent"></div>
              <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white uppercase tracking-tight mb-8">
                  Ready to <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ccff00] via-pink-500 to-purple-500">
                    Find Your Person?
                  </span>
                </h2>
                <p className="font-mono text-zinc-400 mb-12 max-w-xl mx-auto">
                  5 minutes. One conversation. Matches that actually make sense.
                  <br />
                  No credit card. No commitment. Just vibes.
                </p>
                <button
                  onClick={handleStartVibeCheck}
                  className="group relative px-12 py-6 bg-[#ccff00] text-black font-display font-bold text-2xl uppercase tracking-tight overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-4 justify-center">
                    Begin Protocol
                    <svg
                      className="w-6 h-6 group-hover:translate-x-2 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Steps Container (Centered for Chat, Profile, etc) */}
        {step !== "landing" && (
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {step === "chat" && (
              <ChatInterface
                messages={chatHistory}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                onFinish={() => handleFinishChat()}
                currentStep={
                  chatHistory.filter((m) => m.role === "user").length + 1
                }
                totalSteps={MAX_QUESTIONS}
              />
            )}

            {step === "analyzing" && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader text={loadingText} />
              </div>
            )}

            {step === "profile" && userPersona && (
              <UserProfile
                persona={userPersona}
                onContinue={handleFindMatches}
              />
            )}

            {step === "matches" && (
              <div className="space-y-8 animate-fade-in pb-10">
                <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
                  <div>
                    <div className="text-[#ccff00] font-mono text-xs mb-2">
                      /// MATCH_PROTOCOL_COMPLETE
                    </div>
                    <h2 className="text-5xl font-display font-black text-white uppercase">
                      Your Roster
                    </h2>
                  </div>
                </div>

                {/* Beta Testing Banner - User Request #5 */}
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 backdrop-blur-md mb-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-orange-200 uppercase tracking-wider mb-1">
                        Beta Test Mode Active
                      </h3>
                      <p className="text-xs text-orange-100/70 leading-relaxed">
                        You are viewing{" "}
                        <span className="text-white font-bold">
                          AI-Generated Profiles
                        </span>
                        . These candidates are synthetic personalities created
                        by Gemini to demonstrate the matching engine
                        capabilities.
                      </p>
                    </div>
                  </div>
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

      {/* Footer / Copyright - RIGHT SIDE + MOBILE VISIBLE */}
      <footer className="fixed bottom-4 right-4 z-40">
        <div className="bg-black/80 backdrop-blur-xl border border-[#ccff00]/40 rounded-xl p-3 md:p-4 shadow-2xl shadow-[#ccff00]/20 hover:border-[#ccff00]/70 hover:shadow-[#ccff00]/40 transition-all duration-300 max-w-[200px] md:max-w-none">
          <p className="text-[9px] md:text-[11px] font-bold font-mono text-[#ccff00] tracking-widest mb-1.5 md:mb-2">
            ✦ VIBE_AI © 2025
          </p>
          <p className="text-[8px] md:text-[10px] font-mono text-white mb-2 md:mb-2.5">
            Digital Matchmaking Platform
          </p>
          <div className="border-t border-[#ccff00]/20 pt-2 md:pt-2.5">
            <p className="text-[8px] md:text-[9px] font-mono text-blue-300">
              Built with{" "}
              <span className="text-[#ccff00] font-bold">Gemini 3 Pro</span>
            </p>
            <p className="text-[7px] md:text-[9px] font-mono text-pink-300">
              Advanced Reasoning + Multimodality
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
