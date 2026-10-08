import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, Sun, Moon, Laptop, User } from "lucide-react";
import { APP_NAME } from "../../config/app";
import { useAuth } from "../../context/AuthContext";
import { useTheme, ThemeMode } from "../../context/ThemeContext";

export const ShellHeader: React.FC = () => {
  const { user, cloudSyncStatus, signOut, isGuest } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-30 transition-colors no-print">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Link */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-serif font-bold text-[22px] text-text tracking-tight hover:opacity-90 transition cursor-pointer"
        >
          <span>{APP_NAME}</span>
        </Link>

        {/* Right side controls: Theme toggle, quiet sync chip, User account */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Mode Quick Toggle */}
          <div className="flex items-center bg-surface-sunken p-1 rounded-[10px] border border-border">
            {[
              { id: "light", icon: Sun, label: "Terang" },
              { id: "dark", icon: Moon, label: "Gelap" },
              { id: "system", icon: Laptop, label: "Sistem" }
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = theme === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTheme(mode.id as ThemeMode)}
                  className={`p-1.5 rounded-[8px] transition cursor-pointer ${
                    isSelected
                      ? "bg-surface text-text border border-border shadow-2xs"
                      : "text-text-2 hover:text-text"
                  }`}
                  aria-label={`Tema ${mode.label}`}
                  title={`Tema ${mode.label}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Quiet Sync Status Chip */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-text-2 px-2 py-1 rounded-[8px] bg-surface-sunken/60 border border-border" title="Status sinkronisasi">
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudSyncStatus === "synced"
                    ? "bg-primary"
                    : cloudSyncStatus === "syncing"
                    ? "bg-warning"
                    : "bg-danger"
                }`}
              />
              <span>
                {cloudSyncStatus === "synced"
                  ? "Tersinkron"
                  : cloudSyncStatus === "syncing"
                  ? "Menyinkronkan..."
                  : "Offline"}
              </span>
            </div>
          )}

          {/* User Account / Avatar Dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => {
                if (isGuest) {
                  navigate("/pengaturan");
                } else {
                  setIsAvatarMenuOpen((prev) => !prev);
                }
              }}
              className="w-9 h-9 rounded-full bg-accent-tint text-accent-text flex items-center justify-center text-[13px] font-medium transition cursor-pointer hover:opacity-90 min-h-[44px] min-w-[44px] border border-border"
              aria-label="Menu akun"
              aria-expanded={isAvatarMenuOpen}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Akun"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span>{(user?.displayName || user?.email || (isGuest ? "Tamu" : "U")).slice(0, 1).toUpperCase()}</span>
              )}
            </button>

            {isAvatarMenuOpen && user && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-surface rounded-[12px] border border-border py-1.5 z-50 divide-y divide-border"
                style={{ boxShadow: "var(--shadow-popover)" }}
              >
                <div className="px-3.5 py-2">
                  <p className="text-[13px] font-medium text-text truncate">
                    {user.displayName || "Orang Tua"}
                  </p>
                  <p className="text-[12px] text-text-2 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      navigate("/pengaturan");
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-surface-sunken flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-text-2" />
                    <span>Pengaturan & akun</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsAvatarMenuOpen(false);
                      try {
                        await signOut();
                      } catch (e) {}
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] text-danger hover:bg-danger-tint flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
