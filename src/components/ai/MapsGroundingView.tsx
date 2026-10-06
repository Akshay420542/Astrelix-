/**
 * Google Maps Grounded Ground Station & Spaceport Intelligence
 * Uses gemini-3.5-flash with googleMaps tool to retrieve verified facility data and URLs.
 */
import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Search,
  Radio,
  Loader2,
  Compass,
  Navigation,
  Globe2,
  Building,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MapPlace {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

interface GroundingFacility {
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: string;
}

const PRESET_FACILITIES: GroundingFacility[] = [
  {
    name: 'Kennedy Space Center Launch Complex 39',
    location: 'Cape Canaveral, Florida, USA',
    lat: 28.5729,
    lng: -80.649,
    type: 'Orbital Spaceport & Assembly'
  },
  {
    name: 'Goldstone Deep Space Communications Complex',
    location: 'Barstow, Mojave Desert, California',
    lat: 35.4267,
    lng: -116.89,
    type: 'NASA Deep Space Network (DSN)'
  },
  {
    name: 'Guiana Space Centre (CSG)',
    location: 'Kourou, French Guiana',
    lat: 5.2372,
    lng: -52.7606,
    type: 'Equatorial Launch Spaceport'
  },
  {
    name: 'Madrid Deep Space Communications Complex',
    location: 'Robledo de Chavela, Madrid, Spain',
    lat: 40.4278,
    lng: -4.2494,
    type: 'Deep Space Ground Station'
  },
  {
    name: 'Canberra Deep Space Communication Complex',
    location: 'Tidbinbilla, ACT, Australia',
    lat: -35.4014,
    lng: 148.9817,
    type: 'Southern Hemisphere DSN Station'
  },
  {
    name: 'Svalbard Satellite Station (SvalSat)',
    location: 'Longyearbyen, Spitsbergen, Norway',
    lat: 78.2298,
    lng: 15.3996,
    type: 'Polar Orbit Tracking Ground Station'
  }
];

export const MapsGroundingView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<GroundingFacility>(PRESET_FACILITIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groundedText, setGroundedText] = useState<string | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);

  const handleFetchMapsInfo = async (
    searchPrompt: string,
    lat?: number,
    lng?: number
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: searchPrompt,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed Maps grounding`);
      }

      const data = await res.json();
      setGroundedText(data.text);
      setPlaces(data.mapPlaces || []);
    } catch (err: any) {
      setError(err.message || 'Error querying Google Maps Grounding service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (facility: GroundingFacility) => {
    setSelectedFacility(facility);
    setQuery(`Provide facility overview, coordinates, active tracking antennas and visitor information for ${facility.name} in ${facility.location}`);
    handleFetchMapsInfo(
      `Provide facility overview, coordinates, active antennas and operational telemetry for ${facility.name} at ${facility.location}`,
      facility.lat,
      facility.lng
    );
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            GROUND STATION & SPACEPORT INTELLIGENCE
          </h2>
          <p className="text-[11px] text-slate-400">
            Google Maps Grounding (gemini-3.5-flash with googleMaps tool)
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>MAPS GROUNDED</span>
        </span>
      </div>

      {/* Quick Facility Selector Cards */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
          SELECT SPACEPORT OR DEEP SPACE GROUND STATION:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_FACILITIES.map((facility) => {
            const isSelected = selectedFacility.name === facility.name;
            return (
              <button
                key={facility.name}
                onClick={() => handleSelectPreset(facility)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/50 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-100 truncate pr-1">
                    {facility.name}
                  </span>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{facility.location}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                  <span>{facility.type}</span>
                  <span className="text-emerald-400/90">{facility.lat.toFixed(2)}°, {facility.lng.toFixed(2)}°</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Search Form */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
          CUSTOM MAPS GROUNDED QUERY
        </span>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spaceport, radar facility, launch complex, or ground tracking dish..."
              className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  handleFetchMapsInfo(query.trim());
                }
              }}
            />
          </div>
          <button
            onClick={() => query.trim() && handleFetchMapsInfo(query.trim())}
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>GROUND MAPS</span>
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-slate-300 font-semibold text-xs">Querying Google Maps Grounding via Gemini 3.5 Flash...</span>
          <p className="text-[11px] text-slate-500 max-w-md">
            Retrieving verified geographic locations, telemetry dish complexes, and place snippets.
          </p>
        </div>
      )}

      {/* Error View */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs">
          <strong>Maps Grounding Error: </strong>
          {error}
        </div>
      )}

      {/* Result Display */}
      {groundedText && !isLoading && (
        <div className="bg-slate-900 border border-emerald-900/60 rounded-lg overflow-hidden space-y-0">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold uppercase text-xs">
                VERIFIED GOOGLE MAPS REPORT
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              gemini-3.5-flash · googleMaps
            </span>
          </div>

          <div className="p-4 bg-slate-950/80 space-y-4">
            {/* Grounded Text Content */}
            <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {groundedText}
            </div>

            {/* Verified Google Maps Place Links */}
            {places.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VERIFIED GOOGLE MAPS PLACE LINKS & REVIEWS:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {places.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-600 rounded-lg flex flex-col justify-between group transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-white group-hover:text-emerald-300 text-xs">
                          {place.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2 mt-0.5" />
                      </div>
                      <span className="text-[10px] text-emerald-400/80 underline truncate mt-1">
                        View in Google Maps
                      </span>
                      {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                        <p className="text-[10px] text-slate-400 italic mt-1.5 border-t border-slate-800/80 pt-1">
                          "{place.reviewSnippets[0]}"
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
