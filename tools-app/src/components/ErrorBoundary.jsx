import React from 'react';

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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Reload
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Tools Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
