import { useEffect, useState, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import type { Place, RouteRequest } from '../types.ts';
import { RouteLayer } from './RouteLayer.tsx';
import {
  Coffee,
  Utensils,
  Landmark,
  TreePine,
  Hotel,
  ShoppingBag,
  Sparkles,
  Navigation,
  Compass,
  Star,
  Clock,
  ExternalLink,
  Layers,
  Search,
  Crosshair,
  MapPin,
  MessageSquare,
} from 'lucide-react';

interface InteractiveMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onUserLocationFound: (pos: { lat: number; lng: number }) => void;
  routeRequest: RouteRequest | null;
  onClearRoute: () => void;
  onAskAboutPlace: (place: Place) => void;
  onRequestDirections: (place: Place) => void;
}

export function InteractiveMap({
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  onUserLocationFound,
  routeRequest,
  onClearRoute,
  onAskAboutPlace,
  onRequestDirections,
}: InteractiveMapProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Pan to selected place smoothly
  useEffect(() => {
    if (!map || !selectedPlace) return;
    map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    if (map.getZoom() && map.getZoom()! < 14) {
      map.setZoom(15);
    }
  }, [map, selectedPlace]);

  // Pan to user location when discovered
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        onUserLocationFound(coords);
        if (map) {
          map.panTo(coords);
          map.setZoom(15);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search places / cities using modern Place.searchByText
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !placesLib || !map) return;

    setIsSearching(true);
    try {
      const response = await (placesLib.Place as any).searchByText({
        textQuery: searchQuery.trim(),
        fields: ['displayName', 'location', 'formattedAddress', 'viewport'],
      });

      const foundPlaces = response.places || [];
      if (foundPlaces.length > 0) {
        const top = foundPlaces[0];
        if (top.viewport) {
          map.fitBounds(top.viewport);
        } else if (top.location) {
          map.panTo(top.location);
          map.setZoom(14);
        }
      }
    } catch (err) {
      console.warn('Place search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Filtered places according to category chips
  const filteredPlaces = useMemo(() => {
    if (activeCategory === 'all') return places;
    return places.filter((p) => p.category === activeCategory);
  }, [places, activeCategory]);

  // Helper for category icons
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'cafe':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'restaurant':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'museum':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'park':
        return <TreePine className="w-3.5 h-3.5" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'cafe':
        return 'bg-amber-500 text-white border-amber-600';
      case 'restaurant':
        return 'bg-rose-500 text-white border-rose-600';
      case 'museum':
        return 'bg-indigo-600 text-white border-indigo-700';
      case 'park':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'hotel':
        return 'bg-violet-600 text-white border-violet-700';
      case 'shopping':
        return 'bg-pink-600 text-white border-pink-700';
      default:
        return 'bg-blue-600 text-white border-blue-700';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-900">
      {/* Top Floating Overlay: Location Search + Map Type + Locate Me */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 rounded-2xl px-3 py-1.5 w-full max-w-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/30"
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city or landmark..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </form>

        {/* Controls right */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map Type Switcher */}
          <div className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 rounded-2xl p-1 flex items-center gap-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMapTypeId('roadmap');
                if (map) map.setMapTypeId('roadmap');
              }}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapTypeId === 'roadmap' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => {
                setMapTypeId('satellite');
                if (map) map.setMapTypeId('satellite');
              }}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapTypeId === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => {
                setMapTypeId('terrain');
                if (map) map.setMapTypeId('terrain');
              }}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapTypeId === 'terrain' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            title="Locate my position"
            className="pointer-events-auto bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 shadow-lg border border-slate-200/80 rounded-2xl p-2.5 transition-all active:scale-95 flex items-center justify-center group"
          >
            <Crosshair className="w-4 h-4 text-blue-600 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </div>

      {/* Category Pills Bar on Map */}
      {places.length > 0 && (
        <div className="absolute top-20 left-4 z-10 flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-2rem)] py-1 scrollbar-none">
          {[
            { id: 'all', label: `All Places (${places.length})` },
            { id: 'restaurant', label: 'Restaurants' },
            { id: 'cafe', label: 'Cafes' },
            { id: 'museum', label: 'Museums' },
            { id: 'park', label: 'Parks' },
            { id: 'landmark', label: 'Landmarks' },
          ].map((cat) => {
            const count = cat.id === 'all' ? places.length : places.filter((p) => p.category === cat.id).length;
            if (cat.id !== 'all' && count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-md backdrop-blur-md border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-white/90 text-slate-700 border-slate-200/70 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Map Component */}
      <Map
        defaultCenter={{ lat: 40.758, lng: -73.9855 }} // Default: Manhattan / Times Square area
        defaultZoom={13}
        mapId="DEMO_MAP_ID" // Required for AdvancedMarkerElement
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']} // MANDATORY ATTRIBUTION
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
      >
        {/* User Geolocation Marker */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            title="Your Current Location"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/25 animate-ping absolute" />
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-bold">
                <Compass className="w-3 h-3" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Dynamic Place Advanced Markers */}
        {filteredPlaces.map((place) => {
          const isSelected = selectedPlace?.id === place.id;
          const colorClass = getCategoryColor(place.category);

          return (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              onClick={() => onSelectPlace(place)}
              title={place.name}
            >
              <div
                className={`cursor-pointer transition-all duration-200 transform ${
                  isSelected ? 'scale-125 -translate-y-2 z-30' : 'hover:scale-110 -translate-y-1 z-10'
                }`}
              >
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-lg border-2 ${colorClass} ${
                    isSelected ? 'ring-4 ring-blue-400/50' : ''
                  }`}
                >
                  {getCategoryIcon(place.category)}
                  <span className="text-[11px] font-bold max-w-[110px] truncate leading-none">
                    {place.name}
                  </span>
                  {place.rating && (
                    <span className="flex items-center text-[10px] bg-black/25 px-1 rounded ml-0.5">
                      ★ {place.rating}
                    </span>
                  )}
                </div>
                {/* Pointer tip */}
                <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1 shadow-sm" />
              </div>
            </AdvancedMarker>
          );
        })}

        {/* InfoWindow for Selected Place */}
        {selectedPlace && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => onSelectPlace(null)}
            pixelOffset={[0, -32]}
          >
            <div className="p-1 max-w-xs text-slate-800 font-sans">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md mb-1">
                    {selectedPlace.category || 'Location'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {selectedPlace.name}
                  </h4>
                </div>
                {selectedPlace.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 font-bold text-xs px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedPlace.rating}</span>
                  </div>
                )}
              </div>

              {selectedPlace.description && (
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {selectedPlace.description}
                </p>
              )}

              {selectedPlace.address && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span className="line-clamp-2">{selectedPlace.address}</span>
                </div>
              )}

              {selectedPlace.openingHours && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{selectedPlace.openingHours}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onAskAboutPlace(selectedPlace)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask MapMind Details</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRequestDirections(selectedPlace)}
                    className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedPlace.name} ${selectedPlace.address || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Route Visualization Layer */}
        <RouteLayer
          routeRequest={routeRequest}
          onClearRoute={onClearRoute}
        />
      </Map>
    </div>
  );
}
