import { useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { InteractiveMap } from './components/InteractiveMap.tsx';
import { ChatPanel, PERSONAS } from './components/ChatPanel.tsx';
import type { Place, ChatMessage, RouteRequest, SystemPersona } from './types.ts';
import { MessageSquare, Map as MapIcon, Sparkles } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeRequest, setRouteRequest] = useState<RouteRequest | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SystemPersona>(PERSONAS[0]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [mobileTab, setMobileTab] = useState<'map' | 'chat'>('chat');

  // Google Maps Platform Quota Defense listener
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Check user geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.log('Initial geolocation check skipped or denied:', err.message);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // Send message to Gemini server
  const handleSendMessage = useCallback(
    async (text: string, persona: SystemPersona) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const payloadMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            userLocation,
            mapCenter: selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : undefined,
            systemRole: persona.description,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${res.status}`);
        }

        const data = await res.json();

        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.text || 'Here is what I found for you.',
          timestamp: new Date(),
          places: data.places,
          sources: data.sources,
          searchQueries: data.searchQueries,
        };

        setMessages((prev) => [...prev, modelMsg]);

        // Merge newly discovered places into map pins
        if (data.places && data.places.length > 0) {
          setPlaces((prev) => {
            const existingIds = new Set(prev.map((p) => p.name.toLowerCase()));
            const newPlaces = data.places.filter(
              (p: Place) => !existingIds.has(p.name.toLowerCase())
            );
            return [...prev, ...newPlaces];
          });
          // Focus the first recommended place
          setSelectedPlace(data.places[0]);
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Unable to complete query**: ${err.message || 'Please check your connection or try again.'}`,
          timestamp: new Date(),
          error: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, userLocation, selectedPlace, selectedModel]
  );

  // Ask about a specific place from the Map InfoWindow
  const handleAskAboutPlace = (place: Place) => {
    setMobileTab('chat');
    handleSendMessage(
      `Tell me in detail about ${place.name} located at ${place.address || 'this area'}. What is the atmosphere, what are the must-try items or highlights, and what are the best times to visit?`,
      selectedPersona
    );
  };

  // Trigger route computation between user (or current center) and target place
  const handleRequestDirections = (place: Place) => {
    const origin = userLocation || { lat: 40.758, lng: -73.9855 };
    const originTitle = userLocation ? 'Your Location' : 'Current Center';

    setRouteRequest({
      origin,
      destination: { lat: place.lat, lng: place.lng },
      originTitle,
      destinationTitle: place.name,
      travelMode: 'DRIVING',
    });

    setMobileTab('map');
  };

  const handleClearRoute = () => {
    setRouteRequest(null);
  };

  const handleClearChat = () => {
    setMessages([]);
    setPlaces([]);
    setSelectedPlace(null);
    setRouteRequest(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Mandatory Quota Reached Banner (Tier 2 Client Quota Defense) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Sidebar (Desktop: 440px width, Mobile: conditional or tab) */}
        <div
          className={`w-full md:w-[460px] lg:w-[480px] h-full shrink-0 z-20 transition-all ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              setMobileTab('map');
            }}
            onRequestDirections={handleRequestDirections}
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </div>

        {/* Map View Container */}
        <div
          className={`flex-1 h-full relative z-10 ${
            mobileTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <InteractiveMap
              places={places}
              selectedPlace={selectedPlace}
              onSelectPlace={setSelectedPlace}
              userLocation={userLocation}
              onUserLocationFound={(coords) => setUserLocation(coords)}
              routeRequest={routeRequest}
              onClearRoute={handleClearRoute}
              onAskAboutPlace={handleAskAboutPlace}
              onRequestDirections={handleRequestDirections}
            />
          </APIProvider>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2.5 px-4 z-40">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mobileTab === 'chat'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat AI</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mobileTab === 'map'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Interactive Map</span>
          {places.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded-full font-bold">
              {places.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
