import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ShieldCheck, Sparkles, Search, MapPin, Users, Home as HomeIcon, Star, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import SmartSearch from "../components/SmartSearch";
import Roomcard from "../components/Roomcard";
import { useAuth } from "../AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    fetch("/api/rooms/trending")
      .then(res => res.json())
      .then(data => setTrending(Array.isArray(data) ? data : []))
      .catch(console.error);

    if (token && user) {
      fetch("/api/rooms/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ prefs: user })
      })
      .then(res => res.json())
      .then(data => setRecommended(Array.isArray(data) ? data : []))
      .catch(console.error);
    }
  }, [token, user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="home-page">
      <Helmet>
        <title>FindMyRoom - Premium Rentals & Roommates</title>
        <meta name="description" content="Book premium rooms, verified flats, and find compatible roommates across India's top cities with AI-powered recommendations." />
        <meta property="og:title" content="FindMyRoom - Premium Rentals" />
        <meta property="og:description" content="Discover the new standard of living." />
      </Helmet>
      
      {/* Premium Hero Section */}
      <section className="hero-section" style={{ 
        position: 'relative', 
        minHeight: '85vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '100px 20px 40px',
        marginTop: '-80px', /* Pull under navbar */
        overflow: 'hidden'
      }}>
        {/* Background Image with Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10,11,16,0.3) 0%, var(--bg-primary) 100%)',
          zIndex: -1
        }} />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '900px', width: '100%', textAlign: 'center', zIndex: 1 }}
        >
          <motion.div variants={itemVariants} className="hero-badge" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Sparkles size={14} />
            <span>Discover the new standard of living</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} style={{ fontSize: '4.5rem', fontWeight: 800, color: '#fff', marginBottom: '20px', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            Find places you'll <span style={{ color: 'var(--primary)' }}>love</span> to live.
          </motion.h1>
          
          <motion.p variants={itemVariants} style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Book premium rooms, verified flats, and find compatible roommates across India's top cities.
          </motion.p>

          <motion.div variants={itemVariants} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SmartSearch />
          </motion.div>
        </motion.div>
      </section>

      <div className="container" style={{ paddingBottom: '60px' }}>
        {/* Value Props */}
        <section style={{ padding: '80px 0' }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "30px" }}>
            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ padding: "40px 30px", textAlign: 'center' }}>
              <div style={{ background: "var(--primary-glow)", width: "70px", height: "70px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <ShieldCheck size={32} style={{ color: "var(--primary)" }} />
              </div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>100% Verified</h3>
              <p style={{ color: "var(--text-secondary)" }}>Every property and host undergoes strict background checks to ensure your safety.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ padding: "40px 30px", textAlign: 'center' }}>
              <div style={{ background: "var(--secondary-glow)", width: "70px", height: "70px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <MapPin size={32} style={{ color: "var(--secondary)" }} />
              </div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Prime Locations</h3>
              <p style={{ color: "var(--text-secondary)" }}>Find places right next to your college, office, or favorite metro station.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ padding: "40px 30px", textAlign: 'center' }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", width: "70px", height: "70px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <Users size={32} style={{ color: "var(--danger)" }} />
              </div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Smart Roommates</h3>
              <p style={{ color: "var(--text-secondary)" }}>Our AI matcher connects you with roommates sharing your lifestyle and vibe.</p>
            </motion.div>
          </div>
        </section>

        {/* Recommended & Trending */}
        {(trending.length > 0 || recommended.length > 0) && (
          <section style={{ padding: '40px 0' }}>
            {recommended.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                  <Sparkles size={28} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Recommended for You</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                  {recommended.slice(0, 3).map(room => <Roomcard key={room._id || room.id} room={room} />)}
                </div>
              </div>
            )}
            
            {trending.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                  <TrendingUp size={28} style={{ color: 'var(--secondary)' }} />
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Trending Rooms</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                  {trending.slice(0, 3).map(room => <Roomcard key={room._id || room.id} room={room} />)}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Featured Cities */}
        <section style={{ padding: '40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Popular Cities</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/rooms')}>Explore All <ArrowRight size={16} /></button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {['Bangalore', 'Mumbai', 'Hyderabad', 'Delhi'].map((city, idx) => (
              <motion.div 
                key={city}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate(`/rooms?search=${city}`)}
                className="glass-panel"
                style={{ 
                  height: '300px', 
                  borderRadius: 'var(--border-radius-lg)', 
                  overflow: 'hidden', 
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={`https://images.unsplash.com/photo-${1512343805903 + idx}?auto=format&fit=crop&w=600&q=80`} 
                  alt={city} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.8rem' }}>{city}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)' }}>Explore {Math.floor(Math.random() * 500) + 100}+ properties</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 0' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '50px' }}>Loved by Thousands</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel" style={{ padding: '30px' }}>
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '15px' }}>
                  <Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" />
                </div>
                <p style={{ fontSize: '1.05rem', fontStyle: 'italic', marginBottom: '20px' }}>
                  "FindMyRoom made moving to a new city completely stress-free. The smart search helped me find a place exactly 5 mins from my office!"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>A{i}</div>
                  <div>
                    <h4 style={{ margin: 0 }}>Arjun Kumar</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Software Engineer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;