import React, { Suspense, useEffect, useState, useMemo } from "react";
import { KulaMascotPoster } from "./KulaMascotPoster";

const LazyKulaMascot = React.lazy(() => import("./KulaMascot"));

export interface KulaMascotViewProps {
  progress: number;
  mood?: "idle" | "sleepy";
  celebrateSignal?: number;
  className?: string;
  greeting?: string;
  subtitle?: string;
}

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

class MascotErrorBoundary extends React.Component<
  { fallback: React.ReactNode; onError?: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    console.warn("Kura 3D mascot failed, falling back to 2D poster:", err);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const KulaMascotView: React.FC<KulaMascotViewProps> = ({
  progress,
  mood = "idle",
  celebrateSignal,
  className = "",
  greeting = "Halo!",
  subtitle = "Apa yang ingin dirawat hari ini?"
}) => {
  const [hasError, setHasError] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);

  const canUseWebGL = useMemo(() => isWebGLAvailable(), []);

  return (
    <div
      role="img"
      aria-label="Kura, maskot kura-kura Kula"
      className={`relative w-full h-[210px] sm:h-[230px] rounded-[24px] overflow-hidden border border-border select-none shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 38%, var(--stage1), var(--stage2))",
        touchAction: "pan-y"
      }}
    >
      {/* 1. Static Poster: Always present as base so there is NEVER a black/blank flash */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          is3DReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <KulaMascotPoster progress={progress} />
      </div>

      {/* 2. 3D Canvas loaded lazily when WebGL is available */}
      {canUseWebGL && !hasError && (
        <MascotErrorBoundary
          fallback={<KulaMascotPoster progress={progress} />}
          onError={() => setHasError(true)}
        >
          <Suspense fallback={null}>
            <div
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                is3DReady ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <LazyKulaMascot
                progress={progress}
                mood={mood}
                celebrateSignal={celebrateSignal}
                onFirstRender={() => setIs3DReady(true)}
                onError={() => setHasError(true)}
              />
            </div>
          </Suspense>
        </MascotErrorBoundary>
      )}

      {/* 3. Non-intrusive HUD Overlays from prototype */}
      <div className="absolute left-4 top-3.5 right-4 pointer-events-none z-10">
        <b className="font-serif text-[18px] text-text block leading-tight tracking-tight">
          {greeting}
        </b>
        <span className="text-[12.5px] text-text-2 font-medium">
          {subtitle}
        </span>
      </div>

      <div className="absolute right-3.5 bottom-3.5 bg-surface/90 backdrop-blur-xs border border-border rounded-full px-3 py-1 text-[12px] font-semibold text-text pointer-events-none z-10 shadow-2xs">
        Imunisasi {Math.round(progress)}%
      </div>
    </div>
  );
};

export default KulaMascotView;
