import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-dark)',
          color: 'var(--text-primary)'
        }}>
          <h1 style={{ color: 'var(--accent)' }}>Oops! Something went wrong.</h1>
          <p style={{ margin: '1rem 0' }}>An unexpected error has occurred in the application.</p>
          <Link to="/" style={{
            padding: '10px 20px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '5px',
            marginTop: '1rem'
          }}>
            Return to Home
          </Link>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '2rem', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '5px', width: '80%', maxWidth: '800px', overflowX: 'auto' }}>
              <summary>Error Details</summary>
              <br />
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
