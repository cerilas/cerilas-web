import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          maxWidth: '680px',
          margin: '4rem auto',
          textAlign: 'center',
          background: 'var(--card-bg, #18181b)',
          borderRadius: '16px',
          border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          color: 'var(--text-main, #f4f4f5)'
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <AlertTriangle size={26} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #a1a1aa)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this tool workspace.
          </p>

          {this.state.error?.message && (
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              textAlign: 'left',
              overflowX: 'auto',
              color: '#f87171',
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {this.state.error.message}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: 'var(--text-main, #fff)',
                color: 'var(--bg-color, #000)',
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} /> Reload
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(150,150,150,0.1)',
                color: 'var(--text-main, #fff)',
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Home size={14} /> Tools Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
