import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Compass, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

function NotFound() {
  return (
    <div className="container page-container" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <Helmet>
        <title>Page Not Found | FindMyRoom</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AlertCircle size={80} color="var(--primary)" style={{ marginBottom: '20px' }} />
        
        <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: '0 0 10px 0' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Oops! Page Not Found
        </h2>
        
        <p style={{ maxWidth: '500px', margin: '0 auto 40px auto', color: 'var(--text-muted)' }}>
          We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} /> Back to Home
          </Link>
          <Link to="/rooms" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Browse Rooms
          </Link>
          <Link to="/roommates" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} /> Find Roommates
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFound;
