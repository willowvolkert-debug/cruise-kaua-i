import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  id,
  className = ""
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

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
    try {
      // Use Nominatim (OpenStreetMap) for location search - free and no API key needed
      // Bias search towards Kauai, Hawaii area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Kauai, Hawaii")}&limit=5&addressdetails=1`
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
      // Fallback to common Kauai locations
      const kauaiLocations = [
        "Lihue, Kauai",
        "Kapaa, Kauai", 
        "Poipu, Kauai",
        "Princeville, Kauai",
        "Hanalei, Kauai",
        "Koloa, Kauai",
        "Waimea, Kauai",
        "Kilauea, Kauai",
        "Hanapepe, Kauai",
        "Anahola, Kauai"
      ].filter(loc => loc.toLowerCase().includes(query.toLowerCase()));
      
      setSuggestions(kauaiLocations.map((loc, idx) => ({
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
          className={`rounded-2xl pr-10 ${className}`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
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