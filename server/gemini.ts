import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PlaceItem {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category?: 'restaurant' | 'cafe' | 'museum' | 'park' | 'hotel' | 'shopping' | 'landmark' | 'entertainment' | 'other';
  rating?: number;
  description?: string;
  openingHours?: string;
  priceLevel?: string;
  website?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatResponseData {
  text: string;
  places: PlaceItem[];
  sources: GroundingSource[];
  searchQueries: string[];
}

export async function handleChatRequest(params: {
  messages: ChatMessage[];
  userLocation?: { lat: number; lng: number; address?: string };
  mapCenter?: { lat: number; lng: number };
  systemRole?: string;
  model?: string;
}): Promise<ChatResponseData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const selectedModel = params.model || 'gemini-3.8-flash';

  const roleDescription = params.systemRole || 'helpful local tour guide and geospatial intelligence expert';

  const locationContext = params.userLocation
    ? `User Current Location: Latitude ${params.userLocation.lat}, Longitude ${params.userLocation.lng}${params.userLocation.address ? ` (${params.userLocation.address})` : ''}.`
    : params.mapCenter
    ? `Current Map Center: Latitude ${params.mapCenter.lat}, Longitude ${params.mapCenter.lng}.`
    : 'No specific location passed; use the city or area mentioned in the user query.';

  const systemInstruction = `You are MapMind, a real-time interactive map chatbot and ${roleDescription}.
You answer location-specific questions using accurate real-time web search and geospatial knowledge.
${locationContext}

Follow these guidelines:
1. Provide engaging, well-structured, clear answers with Markdown (headings, bullet points, highlights).
2. Share practical real-time details: vibe/atmosphere, current opening hours, must-try items, ticket info, tips, and nearby connections.
3. Whenever you recommend or reference specific geographical places, establishments, landmarks, or parks, you MUST append a structured JSON block at the very end of your response inside triple backticks with the tag \`\`\`places_json
The JSON block MUST be a valid JSON array of objects conforming to:
[
  {
    "id": "unique-slug-id",
    "name": "Establishment or Landmark Name",
    "address": "Street address or general neighborhood",
    "lat": 37.7749,
    "lng": -122.4194,
    "category": "restaurant" | "cafe" | "museum" | "park" | "hotel" | "shopping" | "landmark" | "entertainment" | "other",
    "rating": 4.7,
    "description": "Short 1-2 sentence compelling summary of why to visit",
    "openingHours": "e.g. 8:00 AM - 10:00 PM Daily or Open today 9 AM - 6 PM",
    "priceLevel": "e.g. $$ or Free"
  }
]
Always provide real, accurate latitude and longitude numbers for each place so they appear precisely on the interactive Google Map.
4. Do not talk about the JSON block in your prose text; just append it cleanly at the end.`;

  // Format contents for multi-turn chat
  const contents = params.messages.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || '';

  // Extract places_json if present
  let cleanText = rawText;
  let places: PlaceItem[] = [];

  const jsonRegex = /```places_json\s*([\s\S]*?)\s*```/i;
  const match = rawText.match(jsonRegex);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        places = parsed.map((p, index) => ({
          id: p.id || `place-${Date.now()}-${index}`,
          name: p.name || 'Unknown Place',
          address: p.address || '',
          lat: Number(p.lat) || 0,
          lng: Number(p.lng) || 0,
          category: p.category || 'other',
          rating: p.rating ? Number(p.rating) : undefined,
          description: p.description || '',
          openingHours: p.openingHours || '',
          priceLevel: p.priceLevel || '',
          website: p.website || '',
        })).filter((p) => p.lat !== 0 && p.lng !== 0);
      }
      // Remove the places_json block from the visible markdown response
      cleanText = rawText.replace(jsonRegex, '').trim();
    } catch (e) {
      console.warn('Failed to parse places_json from Gemini response:', e);
    }
  }

  // Extract grounding search sources and queries
  const sources: GroundingSource[] = [];
  const searchQueries: string[] = [];

  const candidate = response.candidates?.[0];
  const metadata = candidate?.groundingMetadata;

  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri,
        });
      }
    }
  }

  if (metadata?.webSearchQueries) {
    searchQueries.push(...metadata.webSearchQueries);
  }

  return {
    text: cleanText,
    places,
    sources,
    searchQueries,
  };
}
