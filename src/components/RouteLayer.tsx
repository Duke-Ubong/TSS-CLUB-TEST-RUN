import { useEffect, useRef, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { RouteRequest, RouteInfo } from '../types.ts';
import { Navigation2, Clock, MapPin, X, AlertCircle } from 'lucide-react';

interface RouteLayerProps {
  routeRequest: RouteRequest | null;
  onClearRoute: () => void;
  onRouteCalculated?: (info: RouteInfo) => void;
}

export function RouteLayer({ routeRequest, onClearRoute, onRouteCalculated }: RouteLayerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routesLib || !map || !routeRequest) {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      setRouteInfo(null);
      setError(null);
      return;
    }

    // Clean up any previously drawn polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setError(null);
    setLoading(true);

    const request = {
      origin: routeRequest.origin,
      destination: routeRequest.destination,
      travelMode: routeRequest.travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    // Modern Routes API wrapper Route.computeRoutes
    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        setLoading(false);
        if (!routes || routes.length === 0) {
          setError('No valid route could be calculated between these points.');
          return;
        }

        const primaryRoute = routes[0];

        // Render polylines using native createPolylines()
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: routeRequest.travelMode === 'WALKING' ? '#10b981' : '#3b82f6',
            strokeWeight: 6,
            strokeOpacity: 0.85,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        // Auto-fit bounds
        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 60);
        }

        const distanceMeters = primaryRoute.distanceMeters || 0;
        const durationMillis = primaryRoute.durationMillis || 0;

        const km = distanceMeters / 1000;
        const miles = km * 0.621371;
        const distanceText = km < 1 ? `${Math.round(distanceMeters)} m` : `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;

        const totalMinutes = Math.round(durationMillis / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const durationText = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;

        const info: RouteInfo = {
          distanceMeters,
          durationMillis,
          distanceText,
          durationText,
          travelMode: routeRequest.travelMode,
          originTitle: routeRequest.originTitle,
          destinationTitle: routeRequest.destinationTitle,
        };

        setRouteInfo(info);
        onRouteCalculated?.(info);
      })
      .catch((err: any) => {
        setLoading(false);
        console.error('Error computing routes:', err);
        setError(err.message || 'Failed to compute route.');
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, routeRequest]);

  if (!routeRequest) return null;

  return (
    <div className="absolute top-4 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4 transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Navigation2 className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Active Route Navigation</span>
        </div>
        <button
          onClick={onClearRoute}
          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          title="Close Route"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block font-medium">From</span>
            <span className="text-slate-800 font-medium truncate block">{routeRequest.originTitle}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 block font-medium">To</span>
            <span className="text-slate-800 font-medium truncate block">{routeRequest.destinationTitle}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 py-2 text-xs text-blue-600 bg-blue-50/70 rounded-xl">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Calculating optimal path...</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {routeInfo && !loading && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Est. Time</span>
              <span className="text-xs font-bold text-slate-900">{routeInfo.durationText}</span>
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Distance</span>
              <span className="text-xs font-bold text-slate-900">{routeInfo.distanceText}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
