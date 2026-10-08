import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error di ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("imunisasi-app-v1");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div
            className="max-w-[420px] w-full bg-surface rounded-[12px] border border-border p-6 text-center space-y-4"
            style={{ boxShadow: "var(--shadow-popover)" }}
          >
            <div className="w-12 h-12 bg-danger-tint text-danger rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-[20px] font-serif font-medium text-text">
              Terjadi kendala teknis
            </h2>
            <p className="text-[14px] text-text-2 leading-relaxed">
              Aplikasi mendeteksi kendala pada tampilan. Jangan khawatir, data jadwal dan profil dapat dimuat ulang.
            </p>
            {this.state.error && (
              <pre className="text-[12px] bg-surface-sunken p-3 rounded-[8px] text-text-2 overflow-auto text-left max-h-32 border border-border">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-[10px] text-[14px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Muat ulang halaman
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2 text-[13px] text-text-2 hover:text-text cursor-pointer"
              >
                Pulihkan data bawaan
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
