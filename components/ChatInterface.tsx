import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { transcribeAudio } from "../services/geminiService";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onFinish: () => void;
  currentStep: number;
  totalSteps: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isTyping,
  onFinish,
  currentStep,
  totalSteps,
}) => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        handleAudioTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        // The default MIME type for MediaRecorder is typically audio/webm
        const transcription = await transcribeAudio(base64Audio, "audio/webm");
        if (transcription) {
          setInput((prev) =>
            prev ? `${prev} ${transcription}` : transcription
          );
        }
      };
    } catch (error) {
      console.error("Transcription failed", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const progressPercentage = Math.min((currentStep / totalSteps) * 100, 100);
  const hasMessages = messages.filter((m) => m.role === "user").length > 0;

  return (
    <div className="flex flex-col h-[85vh] md:h-[800px] w-full max-w-2xl mx-auto glass rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                V
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none mb-1">
                VibeAI{" "}
                <span className="text-[#ccff00] text-[10px] ml-1 tracking-wider">
                  POWERED BY GEMINI 3
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Getting to know you
              </p>
            </div>
          </div>
          <button
            onClick={onFinish}
            disabled={!hasMessages}
            className={`text-xs font-medium transition-colors underline decoration-zinc-700 underline-offset-4 ${
              !hasMessages
                ? "text-zinc-600 cursor-not-allowed"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Skip to results
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
          <span>Vibe Check</span>
          <span>
            {Math.min(currentStep, totalSteps)} / {totalSteps} Steps
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-black/20">
        <div className="text-center py-4 opacity-50">
          <span className="text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
            Safe Space • AI Encrypted
          </span>
        </div>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            } animate-fade-in`}
          >
            <div
              className={`max-w-[85%] px-5 py-3 text-[15px] leading-relaxed shadow-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-[1.5rem] rounded-tr-sm"
                  : "bg-zinc-800 text-zinc-100 rounded-[1.5rem] rounded-tl-sm border border-zinc-700/50"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {(isTyping || isTranscribing) && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-zinc-800 px-4 py-3 rounded-[1.5rem] rounded-tl-sm flex gap-1 items-center h-10 border border-zinc-700/50">
              {isTranscribing ? (
                <span className="text-xs text-zinc-400 font-medium">
                  Listening...
                </span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150"></span>
                </>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900/80 border-t border-white/5 backdrop-blur-md">
        <div className="relative flex items-end gap-2 bg-zinc-800 rounded-3xl p-2 border border-zinc-700/50 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
          <button
            onClick={toggleRecording}
            disabled={isTyping || isTranscribing}
            className={`mb-1 p-2 rounded-full transition-all w-10 h-10 flex-shrink-0 flex items-center justify-center ${
              isRecording
                ? "bg-red-500/20 text-red-500 animate-pulse ring-1 ring-red-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-700"
            }`}
          >
            {isRecording ? (
              <div className="w-3 h-3 bg-current rounded-sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording ? "Recording..." : "Type or describe yourself..."
            }
            rows={1}
            className="w-full bg-transparent text-white border-none px-2 py-3 focus:outline-none placeholder-zinc-500 text-sm font-medium resize-none max-h-[120px] overflow-y-auto no-scrollbar"
            disabled={isTyping || isTranscribing}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isTyping || isTranscribing}
            className="mb-1 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all w-10 h-10 flex-shrink-0 flex items-center justify-center shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 ml-0.5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-600 mt-2 font-medium">
          Press Enter to send • Use mic to speak
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
