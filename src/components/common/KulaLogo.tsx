import React from "react";
import logoMarkUrl from "../../assets/kula-logo-mark.svg";

export interface KulaLogoProps {
  /** Size in pixels (e.g. 40-64px, default 48) */
  size?: number;
  className?: string;
  alt?: string;
}

export const KulaLogo: React.FC<KulaLogoProps> = ({
  size = 48,
  className = "",
  alt = "Kula"
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-[12px] transition-colors dark:bg-[#FAF7F2] dark:p-1 shrink-0 ${className}`}
      style={{
        width: size,
        height: size
      }}
    >
      <img
        src={logoMarkUrl}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain select-none pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default KulaLogo;
