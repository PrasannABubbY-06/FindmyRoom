import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Compass, Search, DollarSign, Filter, Map, LayoutGrid, SlidersHorizontal, Check } from "lucide-react";
import Roomcard from "../components/Roomcard";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { RoomCardSkeleton } from "../components/SkeletonLoader";

// Helper function to resolve mock coordinates for locations to display on map
function getCoordinatesForLocation(location) {
  const loc = (location || "").toLowerCase();
  
  if (loc.includes("new york") || loc.includes("ny")) return [40.7128, -74.0060];
  if (loc.includes("boston") || loc.includes("ma")) return [42.3601, -71.0589];
  if (loc.includes("san francisco") || loc.includes("sf") || loc.includes("ca")) return [37.7749, -122.4194];
  if (loc.includes("los angeles") || loc.includes("la")) return [34.0522, -118.2437];
  if (loc.includes("chicago") || loc.includes("il")) return [41.8781, -87.6298];
  if (loc.includes("austin") || loc.includes("tx")) return [30.2672, -97.7431];
  if (loc.includes("seattle") || loc.includes("wa")) return [47.6062, -122.3321];
  if (loc.includes("london") || loc.includes("uk")) return [51.5074, -0.1278];
  if (loc.includes("mumbai")) return [19.0760, 72.8777];
  if (loc.includes("bangalore") || loc.includes("bengaluru")) return [12.9716, 77.5946];
  if (loc.includes("delhi")) return [28.6139, 77.2090];
  
  let hash1 = 0, hash2 = 0;
  for (let i = 0; i < loc.length; i++) {
    hash1 = loc.charCodeAt(i) + ((hash1 << 5) - hash1);
    hash2 = loc.charCodeAt(i) + ((hash2 << 7) - hash2);
  }
  const lat = 40.7128 + (isNaN(hash1) ? 0 : (hash1 % 100) / 500);
  const lng = -74.0060 + (isNaN(hash2) ? 0 : (hash2 % 100) / 500);
  return [Number.isFinite(lat) ? lat : 40.7128, Number.isFinite(lng) ? lng : -74.0060];
}

function Rooms() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(false); // AI Smart Search Toggle
  
  // Filters
  const [locationInput, setLocationInput] = useState(initialSearch);
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [roomTypeInput, setRoomTypeInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [advancedOptions, setAdvancedOptions] = useState({
    isFurnished: false,
    hasAC: false,
    hasWiFi: false,
    hasParking: false,
    foodIncluded: false,
    petFriendly: false
  });
  
  // Active filters applied to API
  const [activeFilters, setActiveFilters] = useState({
    location: initialSearch,
    maxPrice: "",
    roomType: "",
    genderPreference: "",
    ...advancedOptions
  });

  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const markerGroupRef = useRef(null);
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchedCoordinates, setSearchedCoordinates] = useState(null);
  const [locationNotFound, setLocationNotFound] = useState(false);

  // Request Geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation error, defaulting to Hyderabad.", error);
        }
      );
    }
  }, []);

  // Fetch Rooms
  useEffect(() => {
    setLoading(true);
    let url = "/api/rooms";
    const params = new URLSearchParams();

    if (useAiSearch && activeFilters.location) {
      url = "/api/rooms/smart-search";
      params.append("q", activeFilters.location);
    } else {
      if (activeFilters.location) params.append("location", activeFilters.location);
      if (activeFilters.maxPrice) params.append("maxPrice", activeFilters.maxPrice);
      if (activeFilters.roomType) params.append("roomType", activeFilters.roomType);
      if (activeFilters.genderPreference) params.append("genderPreference", activeFilters.genderPreference);
      
      if (activeFilters.isFurnished) params.append("isFurnished", "true");
      if (activeFilters.hasAC) params.append("hasAC", "true");
      if (activeFilters.hasWiFi) params.append("hasWiFi", "true");
      if (activeFilters.hasParking) params.append("hasParking", "true");
      if (activeFilters.foodIncluded) params.append("foodIncluded", "true");
      if (activeFilters.petFriendly) params.append("petFriendly", "true");
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err);
        setLoading(false);
      });
  }, [activeFilters]);

  // Map Initialization & Updates
  useEffect(() => {
    if (!window.L) return;

    const mapElement = document.getElementById("map-element");
    if (!mapElement || mapInstanceRef.current) return;

    // Fix for React Strict Mode / hot-reloading locking the map
    mapElement._leaflet_id = null;

    try {
      const HYDERABAD_COORDS = [17.3850, 78.4867];
      const initialCenter = initialSearch ? getCoordinatesForLocation(initialSearch) : HYDERABAD_COORDS;
      const map = window.L.map("map-element", {
        scrollWheelZoom: true,
        dragging: true,
        tap: true
      }).setView(initialCenter, 12);
      
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      mapInstanceRef.current = map;
      markerGroupRef.current = window.L.featureGroup().addTo(map);

      // Ensure map dimensions are correctly recognized
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

    } catch (error) {
      console.error("Leaflet map initialization error:", error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Prevent constant map re-centering
  const initialCenterDone = useRef(false);
  const lastSearchCoords = useRef(null);

  // Update Markers when rooms change
  useEffect(() => {
    if (loading || !mapInstanceRef.current || !window.L || !markerGroupRef.current) return;

    const group = markerGroupRef.current;
    
    // Clear old markers
    group.clearLayers();
    markersRef.current = {};

    if (rooms.length > 0) {
      rooms.forEach((room) => {
        let coords;
        if (room.coordinates && !isNaN(parseFloat(room.coordinates.lat)) && !isNaN(parseFloat(room.coordinates.lng))) {
          coords = [parseFloat(room.coordinates.lat), parseFloat(room.coordinates.lng)];
        } else {
          coords = getCoordinatesForLocation(room.location);
        }
        const roomId = room.id || room._id;
        
        const normalIcon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #6366f1; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4); transition: all 0.2s ease;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = window.L.marker(coords, { icon: normalIcon })
          .bindPopup(`
            <div style="font-family: Inter; color: #f8fafc; min-width: 160px; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; font-size: 0.9rem; font-family: Outfit; font-weight: 700; color: #f8fafc;">
                ${room.title}
              </h4>
              <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #94a3b8;">${room.location}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #10b981; font-size: 0.85rem;">₹${room.price.toLocaleString('en-IN')}/mo</span>
                <a href="/rooms/${roomId}" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 0.8rem;">
                  Details &rarr;
                </a>
              </div>
            </div>
          `);
        
        marker.on('click', () => {
          const cardElement = document.getElementById(`room-card-${roomId}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });

        marker.addTo(group);
        markersRef.current[roomId] = marker;
      });
    }
  }, [rooms, loading]);

  // Handle explicit Map Centering (on search, initial load, or location access)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    const HYDERABAD_COORDS = [17.3850, 78.4867];

    // Center on explicit search
    if (searchedCoordinates && searchedCoordinates !== lastSearchCoords.current) {
      lastSearchCoords.current = searchedCoordinates;
      map.flyTo(searchedCoordinates, 12, { duration: 1.0 });
      return;
    }

    // Center on user's location exactly once when it arrives
    if (userLocation && !initialCenterDone.current && !searchedCoordinates) {
      initialCenterDone.current = true;
      map.flyTo(userLocation, 12, { duration: 1.0 });
      return;
    }

    // Default fallback center if no geolocation and no search
    if (!initialCenterDone.current && !searchedCoordinates && !userLocation) {
      // Only do this if we've waited a bit for geolocation, but let's just let it be Hyderabad by default
    }

  }, [searchedCoordinates, userLocation]);

  // Handle Hover effect
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;
    
    Object.keys(markersRef.current).forEach(id => {
      const marker = markersRef.current[id];
      const isHovered = id === hoveredRoomId;
      
      const iconHtml = isHovered 
        ? `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.6); transform: scale(1.2); transition: all 0.2s ease;"></div>`
        : `<div style="background-color: #6366f1; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4); transition: all 0.2s ease;"></div>`;
      
      const iconSize = isHovered ? [22, 22] : [18, 18];
      const iconAnchor = isHovered ? [11, 11] : [9, 9];

      if (marker && marker.setIcon) {
        marker.setIcon(window.L.divIcon({
          className: 'custom-marker',
          html: iconHtml,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        }));
      }
    });
  }, [hoveredRoomId]);

  const handleApplyFilters = async (e) => {
    e.preventDefault();
    setLocationNotFound(false);
    
    // If the user typed a location but didn't select an autocomplete suggestion,
    // we need to manually geocode it to center the map.
    let finalCoords = searchedCoordinates;
    if (locationInput && (!searchedCoordinates || activeFilters.location !== locationInput)) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          finalCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setSearchedCoordinates(finalCoords);
        } else {
          setLocationNotFound(true);
          finalCoords = null;
          setSearchedCoordinates(null);
        }
      } catch (error) {
        console.error("Geocoding failed on submit:", error);
      }
    } else if (!locationInput) {
      setSearchedCoordinates(null);
    }

    setActiveFilters({
      location: locationInput,
      maxPrice: maxPriceInput,
      roomType: roomTypeInput,
      genderPreference: genderInput,
      ...advancedOptions
    });
  };

  const handleClearFilters = () => {
    setLocationInput("");
    setMaxPriceInput("");
    setRoomTypeInput("");
    setGenderInput("");
    setAdvancedOptions({
      isFurnished: false, hasAC: false, hasWiFi: false,
      hasParking: false, foodIncluded: false, petFriendly: false
    });
    setSearchedCoordinates(null);
    setLocationNotFound(false);
    setActiveFilters({
      location: "",
      maxPrice: "",
      roomType: "",
      genderPreference: "",
      isFurnished: false, hasAC: false, hasWiFi: false,
      hasParking: false, foodIncluded: false, petFriendly: false
    });
  };

  return (
    <div className="container page-container" style={{ minHeight: "90vh" }}>
      <Helmet>
        <title>Browse Rooms | FindMyRoom</title>
        <meta name="description" content="Search for premium rental rooms and shared accommodations. Filter by price, location, and amenities." />
      </Helmet>

      {/* Search and Filter Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel filter-panel"
        style={{ display: "block" }}
      >
        <form onSubmit={handleApplyFilters}>
          <div className="filter-inputs-group" style={{ marginBottom: showAdvanced ? "15px" : "0" }}>
            {useAiSearch ? (
              <div className="filter-input-wrapper" style={{ flex: 2 }}>
                <Search size={18} style={{ color: "var(--text-secondary)" }} />
                <input 
                  type="text" 
                  className="filter-input" 
                  placeholder="Ask AI (e.g., 'Cheap 2BHK near HITEC City with AC')"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
              </div>
            ) : (
              <LocationAutocomplete 
                value={locationInput}
                onChange={setLocationInput}
                onSelect={(locationData) => {
                  setSearchedCoordinates([locationData.lat, locationData.lon]);
                  setLocationNotFound(false);
                }}
              />
            )}

            {!useAiSearch && (
              <div className="filter-input-wrapper">
                <DollarSign size={18} style={{ color: "var(--text-secondary)" }} />
                <input 
                  type="number" 
                  className="filter-input" 
                  placeholder="Max Budget"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit" 
                className="btn btn-primary"
              >
                <Filter size={16} /> Search
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button" 
                onClick={() => setUseAiSearch(!useAiSearch)}
                className={`btn ${useAiSearch ? 'btn-primary' : 'btn-secondary'}`}
                title="Toggle AI Smart Search"
              >
                AI Magic
              </motion.button>

              {!useAiSearch && (
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="btn btn-secondary"
                >
                  <SlidersHorizontal size={16} />
                </motion.button>
              )}

              {Object.values(activeFilters).some(v => v) && (
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button" 
                  onClick={handleClearFilters}
                  className="btn btn-danger"
                >
                  Clear
                </motion.button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", display: "flex", gap: "15px", paddingTop: "15px", borderTop: "1px solid var(--border-color)" }}
              >
                <select 
                  className="form-control" 
                  style={{ width: "auto" }}
                  value={roomTypeInput}
                  onChange={(e) => setRoomTypeInput(e.target.value)}
                >
                  <option value="">Any Room Type</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="PG">PG</option>
                  <option value="Apartment">Apartment</option>
                </select>

                <select 
                  className="form-control" 
                  style={{ width: "auto" }}
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value)}
                >
                  <option value="">Any Gender Preference</option>
                  <option value="Male">Male Preferred</option>
                  <option value="Female">Female Preferred</option>
                  <option value="Any">No Preference (Co-ed)</option>
                </select>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
                  {[
                    { key: 'isFurnished', label: 'Furnished' },
                    { key: 'hasAC', label: 'AC' },
                    { key: 'hasWiFi', label: 'WiFi' },
                    { key: 'hasParking', label: 'Parking' },
                    { key: 'foodIncluded', label: 'Food' },
                    { key: 'petFriendly', label: 'Pets' }
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={advancedOptions[key]} 
                        onChange={(e) => setAdvancedOptions({...advancedOptions, [key]: e.target.checked})}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Main Content Layout (Feed & Map side-by-side) */}
      <div className="feed-layout">
        {/* Instagram Feed column */}
        <div className="feed-column">
          {loading ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "30px" }}>
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </div>
          ) : locationNotFound ? (
            <div className="glass-panel text-center" style={{ padding: "60px 20px", width: "100%" }}>
              <Map size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
              <h3>Location Not Found</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
                We couldn't find coordinates for "{activeFilters.location}". Please try searching for a different area.
              </p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-panel text-center" style={{ padding: "60px 20px", width: "100%" }}>
              <Compass size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
              <h3>No Rooms Found</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
                We couldn't find any rooms matching your criteria.
              </p>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              {rooms.map((room) => (
                <Roomcard 
                  key={room.id || room._id} 
                  room={room} 
                  onMouseEnter={() => setHoveredRoomId(room.id || room._id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Map column */}
        <div className="sidebar-column">
          <div className="map-widget-container">
            <div id="map-element"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rooms;