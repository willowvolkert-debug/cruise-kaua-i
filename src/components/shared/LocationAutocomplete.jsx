import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";

// Locations north of Lumahaʻi Beach - no service area (Kauai only)
const UNSUPPORTED_LOCATIONS = [
  "haena", "ha'ena", "hāʻena", "haʻena",
  "kee", "ke'e", "kēʻe", "keʻe", "kee beach",
  "tunnels", "tunnels beach", "makua beach",

  "napali", "na pali", "nā pali",
  "kalalau", "hanakapi'ai", "hanakapiai",
  "limahuli"
];

const isUnsupportedLocation = (location, island) => {
  if (!location || island !== 'Kauai') return false;
  const normalized = location.toLowerCase().trim();
  return UNSUPPORTED_LOCATIONS.some(loc => 
    normalized.includes(loc) || loc.includes(normalized)
  );
};

const ISLAND_FALLBACKS = {
  Kauai: [
    "Lihue, Kauai", "Kapaa, Kauai", "Poipu, Kauai", "Princeville, Kauai",
    "Hanalei, Kauai", "Koloa, Kauai", "Waimea, Kauai", "Kilauea, Kauai",
    "Hanapepe, Kauai", "Anahola, Kauai"
  ],
  Oahu: [
    "Honolulu, Oahu", "Waikiki, Oahu", "Kailua, Oahu", "Kaneohe, Oahu",
    "Pearl City, Oahu", "Aiea, Oahu", "Mililani, Oahu", "Waipahu, Oahu",
    "Ewa Beach, Oahu", "Kapolei, Oahu", "North Shore, Oahu", "Haleiwa, Oahu"
  ],
  Maui: [
    "Kahului, Maui", "Lahaina, Maui", "Kihei, Maui", "Wailea, Maui",
    "Paia, Maui", "Hana, Maui", "Wailuku, Maui", "Makawao, Maui",
    "Haiku, Maui", "Kaanapali, Maui"
  ],
  "Big Island": [
    "Hilo, Big Island", "Kona, Big Island", "Waimea, Big Island", "Pahoa, Big Island",
    "Volcano, Big Island", "Captain Cook, Big Island", "Honokaa, Big Island",
    "Naalehu, Big Island", "Waikoloa, Big Island", "Kohala, Big Island"
  ],
  Molokai: [
    "Kaunakakai, Molokai", "Hoolehua, Molokai", "Maunaloa, Molokai",
    "Halawa, Molokai", "Kualapuu, Molokai"
  ],
  Lanai: [
    "Lanai City, Lanai", "Manele Bay, Lanai", "Hulopo'e Beach, Lanai"
  ]
};

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  id,
  className = "",
  onValidationChange,
  island = "Kauai"
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [isUnsupported, setIsUnsupported] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Clear the input when island changes
  useEffect(() => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsUnsupported(false);
    onValidationChange?.(false);
  }, [island]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const islandLabel = island === "Big Island" ? "Hawaii Island, Hawaii" : `${island}, Hawaii`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", " + islandLabel)}&limit=5&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions = data.map(item => ({
          id: item.place_id,
          name: item.display_name.split(',').slice(0, 3).join(','),
          fullName: item.display_name
        }));
        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      const fallbacks = (ISLAND_FALLBACKS[island] || ISLAND_FALLBACKS.Kauai)
        .filter(loc => loc.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(fallbacks.map((loc, idx) => ({
        id: idx,
        name: loc,
        fullName: loc
      })));
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const unsupported = isUnsupportedLocation(newValue, island);
    setIsUnsupported(unsupported);
    onValidationChange?.(unsupported);
    
    onChange(newValue);
    setShowSuggestions(true);

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    const shortName = suggestion.name.split(',')[0].trim();
    setInputValue(shortName);
    
    const unsupported = isUnsupportedLocation(shortName, island);
    setIsUnsupported(unsupported);
    onValidationChange?.(unsupported);
    
    onChange(shortName);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setShowSuggestions(true)}
          className={`rounded-2xl pr-10 ${isUnsupported ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : isUnsupported ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      


      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}