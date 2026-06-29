import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

function LocationAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    setShowDropdown(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newVal);
    }, 500); // 500ms debounce
  };

  const handleSelectSuggestion = (suggestion) => {
    const locationName = suggestion.display_name.split(',')[0]; // Simplify name
    onChange(locationName);
    setShowDropdown(false);
    if (onSelect) {
      onSelect({
        name: locationName,
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon)
      });
    }
  };

  return (
    <div className="filter-input-wrapper" ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <Search size={18} style={{ color: "var(--text-secondary)" }} />
      <input 
        type="text" 
        className="filter-input" 
        placeholder="Search by city, college, or company"
        value={value}
        onChange={handleInputChange}
        onFocus={() => { if(suggestions.length > 0) setShowDropdown(true); }}
      />
      
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '8px',
          zIndex: 1000,
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Searching...
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div 
                key={suggestion.place_id}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {suggestion.display_name}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;
