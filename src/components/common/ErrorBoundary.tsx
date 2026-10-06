import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Terjadi Kendala Teknis</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aplikasi mendeteksi error pada tampilan. Jangan khawatir, data jadwal dan profil dapat dipulihkan ke data standar.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-slate-100 p-3 rounded-lg text-slate-700 overflow-auto text-left max-h-32 border border-slate-200">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition text-sm"
              >
                Pulihkan ke Pengaturan Awal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
