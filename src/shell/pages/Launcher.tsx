import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { ShellHeader } from "../components/ShellHeader";
import { MODULE_REGISTRY } from "../../modules/registry";
import { useAuth } from "../../context/AuthContext";
import { PAGE_CONTAINER } from "../../config/layout";
import { getAccountName } from "../../utils/loginIdentity";


export const LauncherPage: React.FC = () => {
  const { user, isGuest } = useAuth();

  const greetingName = isGuest
    ? "Tamu"
    : getAccountName(user).split(" ")[0] || "Orang Tua";

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <ShellHeader />

      <main className={`flex-1 ${PAGE_CONTAINER} py-8 sm:py-12 space-y-8`}>
        {/* Greeting Section */}
        <div className="space-y-2">
          <h1 className="text-[28px] sm:text-[36px] font-semibold leading-tight text-text tracking-tight">
            Halo, {greetingName}!
          </h1>
          <p className="text-[15px] sm:text-[16px] text-text-2 leading-relaxed">
            Pilih modul aplikasi untuk mengelola kebutuhan keluarga Anda.
          </p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {MODULE_REGISTRY.map((mod) => {
            const Icon = mod.icon;
            const isComingSoon = mod.status === "coming-soon";

            return (
              <Link
                key={mod.id}
                to={mod.basePath}
                className="group relative bg-surface p-5 sm:p-6 rounded-[14px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={`Modul ${mod.name}: ${mod.description}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-11 h-11 rounded-[10px] bg-primary-tint text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    {isComingSoon ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-sunken text-text-2 border border-border">
                        <Sparkles className="w-3 h-3 text-warning shrink-0" />
                        Segera hadir
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-surface-sunken group-hover:bg-primary-tint group-hover:text-primary flex items-center justify-center text-text-2 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-[18px] font-semibold text-text group-hover:text-primary transition-colors">
                      {mod.name}
                    </h2>
                    <p className="text-[13px] text-text-2 leading-relaxed mt-1">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>


    </div>
  );
};
