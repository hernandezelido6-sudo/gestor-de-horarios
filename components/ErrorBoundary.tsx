import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#0f172a', color: '#f87171', height: '100vh', fontFamily: 'system-ui' }}>
          <h1 style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '1rem'}}>Ha ocurrido un error inesperado</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Si estabas viendo una pantalla negra, este es el error capturado:</p>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '1rem' }}>{this.state.error?.toString()}</pre>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', color: '#cbd5e1' }}>{this.state.error?.stack}</pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '1rem', padding: '10px 20px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Borrar Caché y Refrescar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
