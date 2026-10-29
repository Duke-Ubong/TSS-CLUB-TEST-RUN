import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Place, SystemPersona } from '../types.ts';
import {
  Send,
  Sparkles,
  Bot,
  User,
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  Search,
  RotateCcw,
  Coffee,
  Utensils,
  Landmark,
  ChevronRight,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, persona: SystemPersona) => void;
  onClearChat: () => void;
  onSelectPlace: (place: Place) => void;
  onRequestDirections: (place: Place) => void;
  selectedPersona: SystemPersona;
  onSelectPersona: (persona: SystemPersona) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const PERSONAS: SystemPersona[] = [
  {
    id: 'guide',
    name: 'Local Guide',
    icon: '🗺️',
    tagline: 'Neighborhood highlights & secrets',
    description: 'Expert local guide specializing in rich cultural history, scenic walking paths, and hidden architectural gems.',
  },
  {
    id: 'foodie',
    name: 'Food & Dining',
    icon: '🍽️',
    tagline: 'Best eateries & vibes',
    description: 'Culinary connoisseur focused on authentic local food, top-rated restaurants, cozy cafes, and vibrant nightlife.',
  },
  {
    id: 'family',
    name: 'Family & Parks',
    icon: '🌳',
    tagline: 'Relaxed & accessible',
    description: 'Family-friendly planner discovering safe, scenic parks, playgrounds, interactive museums, and pet-friendly spaces.',
  },
  {
    id: 'itinerary',
    name: 'Route Planner',
    icon: '🧭',
    tagline: 'Multi-stop itineraries',
    description: 'Geospatial logistics master crafting optimized day plans, transit connections, and multi-stop walking or driving tours.',
  },
];

export const STARTER_PROMPTS = [
  'Best specialty coffee shops with quiet work vibe near Central Park',
  'Top 5 historic landmarks with stunning photo spots in this area',
  'Highly-rated Italian trattorias open late with outdoor seating',
  'Plan an afternoon walking tour with 3 cultural stops and a gelato break',
];

export function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onSelectPlace,
  onRequestDirections,
  selectedPersona,
  onSelectPersona,
  selectedModel,
  onSelectModel,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const query = inputText.trim();
    setInputText('');
    onSendMessage(query, selectedPersona);
  };

  const handleStarterClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt, selectedPersona);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight text-white">MapMind AI</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Grounding Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {selectedPersona.icon} {selectedPersona.name} • {selectedModel.replace('gemini-', '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-all ${
              showSettings ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Chatbot persona & model settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClearChat}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 space-y-4 animate-in slide-in-from-top duration-200">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              AI Persona & Specialty
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPersona(p)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    selectedPersona.id === p.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-base mb-1">{p.icon}</div>
                  <div className="text-xs font-bold leading-tight">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              Gemini Model
            </label>
            <div className="flex gap-2">
              {[
                { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast & Grounded' },
                { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Lite', tag: 'Ultra Fast' },
                { id: 'gemini-4-argon', name: 'Gemini 4 Argon', tag: 'Complex Reasoning' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`flex-1 p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    selectedModel === m.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-[9px] opacity-80 mt-0.5">{m.tag}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="py-8 px-2 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 text-3xl shadow-inner">
              {selectedPersona.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ask anything about any location</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                MapMind searches live Google Maps data, web reviews, hours, and navigation routes to answer your questions and mark live pins on the map.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                Try asking:
              </span>
              <div className="space-y-1.5">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStarterClick(prompt)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-xs'
                }`}
              >
                {/* Message Body */}
                <div className="prose prose-invert prose-sm max-w-none space-y-2 leading-relaxed">
                  {message.text.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="font-bold text-white text-base mt-2 mb-1">
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h3 key={pIdx} className="font-bold text-white text-lg mt-3 mb-1">
                          {paragraph.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={pIdx} className="list-disc list-inside space-y-1 my-1">
                          {items.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-slate-300">
                              {item.replace(/^[-*]\s+/, '')}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>

                {/* Discovered Places Interactive Cards */}
                {message.places && message.places.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{message.places.length} Places Found on Map</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {message.places.map((place) => (
                        <div
                          key={place.id}
                          className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 hover:border-blue-500/50 transition-all flex flex-col gap-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs group-hover:text-blue-300 transition-colors">
                                  {place.name}
                                </span>
                                {place.rating && (
                                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                    ★ {place.rating}
                                  </span>
                                )}
                              </div>
                              {place.address && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {place.address}
                                </p>
                              )}
                            </div>
                          </div>

                          {place.description && (
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {place.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectPlace(place)}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Show on Map</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRequestDirections(place)}
                              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Directions</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounding Search Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span>Live Search Sources ({message.sources.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {message.sources.slice(0, 4).map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] px-2 py-1 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-blue-300 rounded-lg border border-slate-700/60 transition-colors truncate max-w-[200px]"
                          title={source.title}
                        >
                          <span className="truncate">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 items-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Searching live Google Maps & web grounding...</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about places, food, sights, hours, or routes..."
            disabled={isLoading}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          MapMind utilizes Gemini 3.8 Flash with Search Grounding & real-time Google Maps data.
        </p>
      </div>
    </div>
  );
}
