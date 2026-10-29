export interface Place {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  places?: Place[];
  sources?: GroundingSource[];
  searchQueries?: string[];
  error?: boolean;
}

export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export interface RouteRequest {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  originTitle: string;
  destinationTitle: string;
  travelMode: TravelMode;
}

export interface RouteInfo {
  distanceMeters: number;
  durationMillis: number;
  distanceText: string;
  durationText: string;
  travelMode: TravelMode;
  originTitle: string;
  destinationTitle: string;
}

export interface SystemPersona {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
}
