import React from "react";

interface KulaMascotPosterProps {
  className?: string;
  progress?: number;
}

export const KulaMascotPoster: React.FC<KulaMascotPosterProps> = ({
  className = "",
  progress
}) => {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 38%, var(--stage1), var(--stage2))"
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 150"
        className="w-[72%] max-w-[260px] max-h-[170px] drop-shadow-sm transition-transform duration-300"
        fill="none"
      >
        {/* Contact Shadow */}
        <ellipse cx="100" cy="132" rx="62" ry="8" fill="#000000" opacity="0.12" />

        {/* Feet */}
        <ellipse cx="62" cy="118" rx="16" ry="12" fill="#5FB86B" />
        <ellipse cx="138" cy="118" rx="16" ry="12" fill="#5FB86B" />

        {/* Head & Features */}
        <circle cx="162" cy="86" r="26" fill="#5FB86B" />
        <circle cx="170" cy="82" r="4" fill="#2B2A26" />
        <circle cx="168" cy="98" r="4" fill="#E8825E" opacity="0.8" />

        {/* Shell Base */}
        <path d="M30 112 Q30 36 100 36 Q160 36 160 112 Z" fill="#2B6B48" />

        {/* Scutes / Petak tempurung */}
        <polygon
          points="100,52 118,62 118,82 100,92 82,82 82,62"
          fill="#3C9A5A"
        />
        <polygon
          points="62,76 78,84 78,102 62,110 46,102 46,84"
          fill="#3C9A5A"
        />
        <polygon
          points="138,76 154,84 154,102 138,110 122,102 122,84"
          fill="#3C9A5A"
        />

        {/* Sprout atop shell */}
        <path
          d="M100 36 C99 26 101 22 100 16"
          stroke="#B5E08A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse
          cx="96"
          cy="18"
          rx="5"
          ry="2.5"
          fill="#B5E08A"
          transform="rotate(-25 96 18)"
        />
        <ellipse
          cx="104"
          cy="18"
          rx="5"
          ry="2.5"
          fill="#B5E08A"
          transform="rotate(25 104 18)"
        />
      </svg>
    </div>
  );
};

export default KulaMascotPoster;
