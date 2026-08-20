import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for ADB debugging
    console.error("[ErrorBoundary] Caught error:", error.message);
    console.error("[ErrorBoundary] Stack:", errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use minimal inline styles and NO external components to avoid TDZ errors
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0E1A',
          color: 'white',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Ops! Algo deu errado.</h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '32px', maxWidth: '280px' }}>
            Ocorreu um erro inesperado. Isso pode ser um problema de conexão ou cache.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              width: '100%',
              maxWidth: '280px',
              height: '48px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Recarregar Aplicativo
          </button>

          <button
            onClick={this.handleReset}
            style={{
              width: '100%',
              maxWidth: '280px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Limpar dados e reiniciar
          </button>

          <div style={{
            marginTop: '32px',
            padding: '16px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            fontSize: '10px',
            textAlign: 'left',
            maxWidth: '100%',
            maxHeight: '200px',
            overflow: 'auto',
            color: '#ef4444',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.name}: {this.state.error?.message}
            {this.state.error?.stack && `\n\nStack:\n${this.state.error.stack}`}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
