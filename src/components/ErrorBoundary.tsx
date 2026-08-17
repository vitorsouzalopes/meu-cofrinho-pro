import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E1A] text-white p-6 text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
            Ocorreu um erro inesperado ao carregar o aplicativo. Tente recarregar.
          </p>
          <div className="space-y-4 w-full max-w-xs">
            <Button
              variant="outline"
              className="w-full h-12 border-white/10 text-white"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Recarregar App
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Limpar dados e reiniciar
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black/50 rounded-lg text-[10px] text-left overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
