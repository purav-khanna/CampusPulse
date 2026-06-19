import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import '../../components/ui/Components.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          textAlign: 'center',
          height: '100%',
          minHeight: '300px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          margin: 'var(--space-4)',
          width: 'calc(100% - var(--space-8))'
        }}>
          <ShieldAlert size={48} style={{ color: 'var(--danger-500)', marginBottom: 'var(--space-3)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '400px', marginBottom: 'var(--space-4)' }}>
            We encountered an unexpected error in this part of the application.
          </p>
          {this.state.error?.message && (
            <pre style={{
              fontSize: 'var(--text-xs)',
              background: 'var(--bg-primary)',
              color: 'var(--danger-400)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '90%',
              overflowX: 'auto',
              marginBottom: 'var(--space-4)',
              textAlign: 'left'
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={this.handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={14} /> Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
