import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SmartSearch({ placeholder = "Search 'PG near Stanford' or 'Flat in Bangalore under 20k'..." }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    // Load search history
    const saved = localStorage.getItem('findmyroom_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }

    // Click outside listener
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e, explicitQuery = null) => {
    if (e) e.preventDefault();
    const finalQuery = explicitQuery || query;
    if (!finalQuery.trim()) {
      navigate('/rooms');
      return;
    }

    // Save to history
    const newHistory = [finalQuery, ...history.filter(h => h !== finalQuery)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('findmyroom_search_history', JSON.stringify(newHistory));

    setFocused(false);
    navigate(`/rooms?search=${encodeURIComponent(finalQuery)}`);
  };

  const handleHistoryClick = (item) => {
    setQuery(item);
    handleSearch(null, item);
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', zIndex: 50 }}>
      <form 
        onSubmit={(e) => handleSearch(e)} 
        className="glass-panel" 
        style={{ 
          display: "flex", 
          padding: "8px 8px 8px 24px", 
          borderRadius: "50px", 
          alignItems: "center",
          background: focused ? 'var(--bg-secondary)' : 'var(--bg-card)',
          borderColor: focused ? 'var(--primary)' : 'var(--border-color)',
          boxShadow: focused ? 'var(--shadow-lg)' : 'var(--shadow-md)',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ color: focused ? 'var(--primary)' : 'var(--text-muted)' }}>
          <Search size={22} />
        </div>
        <input 
          type="text" 
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          style={{ 
            flex: 1, 
            border: "none", 
            outline: "none", 
            background: "transparent", 
            fontSize: "1.1rem", 
            color: "var(--text-primary)",
            padding: "0 15px",
            fontWeight: 500
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ borderRadius: "50px", padding: "14px 28px", fontSize: '1.05rem' }}>
          Search <ArrowRight size={18} />
        </button>
      </form>

      <AnimatePresence>
        {focused && history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-panel"
            style={{ 
              position: 'absolute', 
              top: 'calc(100% + 10px)', 
              left: 0, 
              right: 0, 
              padding: '15px 0', 
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ padding: '0 20px 10px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Recent Searches
            </div>
            {history.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleHistoryClick(item)}
                style={{ 
                  padding: '12px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Clock size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '1.05rem' }}>{item}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SmartSearch;
