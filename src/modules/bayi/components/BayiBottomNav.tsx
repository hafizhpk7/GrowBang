import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BAYI_NAV_ITEMS } from "./BayiSidebar";

export const BayiBottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] no-print"
      aria-label="Navigasi Bawah Modul Bayi"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {BAYI_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === "/bayi/biaya" && (currentPath === "/bayi/keuangan" || currentPath === "/bayi/asuransi"));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-[10px] transition-colors cursor-pointer ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-text-2 hover:text-text"
              }`}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
