import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldX, Copy, Check } from 'lucide-react';
import { clearAllAuthStorage } from '../utils/auth';

/**
 * Top-Level & Route-Level Error Boundary Component
 * Catches unhandled JavaScript runtime exceptions in child component trees,
 * logs diagnostics, and renders a graceful, user-friendly recovery interface.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🚨 [VendorSaathi ErrorBoundary Caught]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#home';
    window.location.reload();
  };

  handleClearCacheAndReset = () => {
    try {
      clearAllAuthStorage();
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  handleCopyDiagnostics = () => {
    const diagnostics = {
      message: this.state.error?.message || 'Unknown Error',
      stack: this.state.error?.stack || '',
      componentStack: this.state.errorInfo?.componentStack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString()
    };

    navigator.clipboard?.writeText(JSON.stringify(diagnostics, null, 2)).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f8fafc'
        }}>
          <div className="vs-card animate-modal-pop" style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '36px 32px',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.15)',
            border: '1.5px solid #fee2e2',
            textAlign: 'center'
          }}>
            {/* Error Icon Badge */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 10px 24px -4px rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle size={36} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
              Something unexpected occurred
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              We encountered an issue rendering this section. Your cart and stored preferences are secure. You can reload or reset to continue.
            </p>

            {/* Error details preview (Sanitized for safety) */}
            {this.state.error && (
              <div style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '14px',
                padding: '12px 16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '12px',
                color: '#9f1239',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            {/* Recovery Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary touch-target-44"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={17} /> Reload Page
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={this.handleResetHome}
                  className="btn-outline touch-target-44"
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Home size={16} /> Return to Home
                </button>

                <button
                  type="button"
                  onClick={this.handleClearCacheAndReset}
                  className="touch-target-44"
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldX size={16} /> Clear Cache
                </button>
              </div>

              {/* Copy Diagnostics Helper */}
              <button
                type="button"
                onClick={this.handleCopyDiagnostics}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                {this.state.copied ? (
                  <>
                    <Check size={14} color="#059669" />
                    <span style={{ color: '#059669', fontWeight: '700' }}>Diagnostics Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy technical error report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
