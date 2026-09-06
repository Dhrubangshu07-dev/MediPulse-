import { useState, useRef, useEffect } from "react";
import {
  ArrowRight, Brain, MessageSquare, Shield, Sparkles, Zap,
} from "lucide-react";
import { SUGGESTIONS } from "../constants/ui";
import { useLanguage } from "../contexts/LanguageContext";

export default function AIFeatures() {
  const { t, lang } = useLanguage();
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: t("aiFeatures.greeting", "Hi! Describe your symptoms and I'll suggest relevant specialists and possible conditions in seconds."),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update initial message when language changes if no conversation happened yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === "ai") {
        return [{
          from: "ai",
          text: t("aiFeatures.greeting", "Hi! Describe your symptoms and I'll suggest relevant specialists and possible conditions in seconds."),
        }];
      }
      return prev;
    });
  }, [lang, t]);

  const activeSuggestions = lang === "bn" ? [
    "বুকে ব্যথা ও শ্বাসকষ্ট",
    "টানা মাথা ব্যথা ও মাথা ঘোরা",
    "ত্বকে ফুসকুড়ি ও তীব্র চুলকানি",
  ] : SUGGESTIONS;

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    
    // Add user message
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            from: "ai",
            text: data.analysis.recommendation
          }
        ]);
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          from: "ai",
          text: t("aiFeatures.errorAnalysis", "Sorry, I'm having trouble analyzing your symptoms right now. Please try again later.")
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFocusChat = () => {
    inputRef.current?.focus();
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Decorative background blobs for glassmorphism */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 inner-3d">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/50 backdrop-blur-md border border-emerald-200/50 px-4 py-2 rounded-full shadow-sm">
            {t("aiFeatures.badge", "Next-Gen AI Platform")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-6 tracking-tight">
            {t("aiFeatures.title", "Smarter Healthcare Starts Here")}
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto text-base">
            {t("aiFeatures.subtitle", "Experience our intelligent matching engine. Our AI features work together seamlessly to connect you with the right care, faster than ever before.")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* ── Interactive Symptom Checker ── */}
          <div className="h-full transition-transform hover:scale-[1.01] duration-500">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col h-full transform-style-3d relative group">
              {/* Card Inner Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none rounded-3xl" />
              
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-6 border-b border-white/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="flex items-center gap-4 inner-3d relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner animate-float-smooth">
                    <Brain size={24} className="text-white drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-white drop-shadow-sm">
                      {t("aiFeatures.symptomChecker", "AI Symptom Checker")}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
                      <span className="text-xs text-emerald-100 font-medium">
                        {t("aiFeatures.onlineGpt", "Online · Powered by GPT-4")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex flex-col h-[400px] relative z-10 inner-3d">
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.from === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-50 border border-green-200/50 flex items-center justify-center mr-3 mt-auto shrink-0 shadow-sm animate-float-smooth">
                          <Sparkles size={14} className="text-emerald-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] text-[15px] shadow-sm rounded-2xl px-5 py-3.5 leading-relaxed ${
                          msg.from === "user"
                            ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm shadow-emerald-500/20"
                            : "bg-white/80 backdrop-blur-md border border-slate-100 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick suggestions */}
                <div className="px-5 pb-3 flex gap-2 overflow-x-auto inner-3d">
                  {activeSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs font-semibold text-emerald-700 bg-white/70 backdrop-blur-sm border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-sm shrink-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/50 flex gap-3 inner-3d-lg">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    placeholder={t("aiFeatures.placeholder", "Describe your symptoms in detail…")}
                    className="flex-1 text-[15px] bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3.5 outline-none border border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-400 transition-all shadow-inner"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            
            {/* Smart Matching */}
            <div className="transition-transform hover:scale-[1.01] duration-500">
              <div
                onClick={() => handleScrollToSection("doctors-section")}
                className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex relative group cursor-pointer hover:bg-white/90 transition-colors"
              >
                <div className="w-2 bg-gradient-to-b from-green-400 to-emerald-600 shrink-0" />
                <div className="flex-1 p-7 inner-3d">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-500">
                      <Zap size={26} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {t("aiFeatures.smartMatching", "Smart Doctor Matching")}
                        </h3>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">
                          {t("aiFeatures.accuracy", "98% Accuracy")}
                        </span>
                      </div>
                      <p className="text-[15px] text-slate-500 leading-relaxed mb-4">
                        {t("aiFeatures.smartMatchingDesc", "Our engine analyses 40+ parameters — specialty, location, availability, and patient reviews — to surface your ideal doctor instantly.")}
                      </p>
                      <button className="text-[15px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-2 group/btn">
                        {t("aiFeatures.findDoctorBtn", "Find My Doctor")}{" "}
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Health Assistant */}
            <div className="transition-transform hover:scale-[1.01] duration-500">
              <div
                onClick={handleFocusChat}
                className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex relative group cursor-pointer hover:bg-white/90 transition-colors"
              >
                <div className="w-2 bg-gradient-to-b from-teal-400 to-cyan-500 shrink-0" />
                <div className="flex-1 p-7 inner-3d">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-500">
                      <MessageSquare size={26} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {t("aiFeatures.healthAssistant", "AI Health Assistant")}
                        </h3>
                        <span className="text-xs font-bold text-cyan-700 bg-cyan-100 border border-cyan-200 px-3 py-1 rounded-full shadow-sm">
                          {t("aiFeatures.available247", "Available 24/7")}
                        </span>
                      </div>
                      <p className="text-[15px] text-slate-500 leading-relaxed mb-4">
                        {t("aiFeatures.healthAssistantDesc", "Get instant answers to health questions, medication reminders, and personalised health tips from your always-on AI companion.")}
                      </p>
                      <button className="text-[15px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-2 group/btn">
                        {t("aiFeatures.startChatBtn", "Start Chat")}{" "}
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust / Security Card */}
            <div className="transition-transform hover:scale-[1.01] duration-500">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-7 text-white border border-slate-700 shadow-2xl relative overflow-hidden group">
                {/* Glossy reflection */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-4 inner-3d">
                  <Shield size={26} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <h3 className="font-extrabold text-lg tracking-tight">
                    {t("aiFeatures.hipaaCompliant", "HIPAA Compliant & Secure")}
                  </h3>
                </div>
                <p className="text-[15px] text-slate-300 mb-6 leading-relaxed inner-3d">
                  {t("aiFeatures.securityDesc", "All health data is encrypted end-to-end. Experience world-class security wrapped in a next-generation interface. We never share your information without explicit consent.")}
                </p>
                <div className="flex gap-2 flex-wrap inner-3d">
                  {["ISO 27001", "HIPAA", "256-bit SSL", "SOC 2"].map((badge) => (
                    <span
                      key={badge}
                      className="text-xs font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-inner hover:bg-white/20 transition-colors cursor-default"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
