import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Check, Plus, Users, LogOut, Settings as SettingsIcon, Home, LayoutGrid } from "lucide-react";
import { Profile } from "../../../types";
import { getChildAge } from "../../../utils/dates";
import { useAuth } from "../../../context/AuthContext";
import { PAGE_PAD } from "../../../config/layout";

interface Props {
  profile: Profile | null;
  profiles: Profile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  onOpenAddChild?: () => void;
}

export const BayiHeader: React.FC<Props> = ({
  profile,
  profiles,
  onSelectProfile,
  onOpenProfileModal,
  onOpenAddChild
}) => {
  const age = profile ? getChildAge(profile.tanggalLahir) : { text: "" };
  const { user, cloudSyncStatus, signOut } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-30 transition-colors no-print">
      <div className={`w-full mx-auto ${PAGE_PAD} h-16 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          {/* Mobile Back to Launcher Home button */}
          <Link
            to="/"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-[10px] bg-surface-sunken hover:bg-border text-text-2 hover:text-text transition cursor-pointer shrink-0 border border-border"
            aria-label="Kembali ke Beranda utama"
            title="Kembali ke Beranda utama"
          >
            <LayoutGrid className="w-5 h-5" />
          </Link>

          {/* Child Switcher Dropdown */}
          {profile ? (
            <div className="relative flex items-center min-w-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2.5 py-1 px-2 rounded-[10px] text-text hover:bg-surface-sunken transition-colors min-h-[44px] cursor-pointer"
                aria-label="Pilih atau kelola profil anak"
              >
                <div className="w-8 h-8 rounded-full bg-accent-tint text-accent-text flex items-center justify-center text-[13px] font-semibold shrink-0">
                  {profile.panggilan.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-semibold text-[15px] leading-tight text-text truncate max-w-[120px] sm:max-w-[200px]">
                    {profile.panggilan}
                  </div>
                  <div className="text-[12px] text-text-2 leading-tight truncate">
                    {age.text}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-2 transition-transform duration-150 shrink-0 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Child Selection Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-surface rounded-[12px] border border-border py-2 z-50 divide-y divide-border"
                  style={{ boxShadow: "var(--shadow-popover)" }}
                >
                  <div className="px-3.5 py-1.5">
                    <span className="text-[13px] font-semibold text-text">Profil anak</span>
                    <p className="text-[12px] text-text-2">{profiles.length} profil terdaftar</p>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto space-y-0.5 px-1">
                    {profiles.map((p) => {
                      const isActive = p.id === profile.id;
                      const childAge = getChildAge(p.tanggalLahir);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectProfile(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[10px] flex items-center justify-between gap-3 transition min-h-[44px] cursor-pointer ${
                            isActive
                              ? "bg-primary-tint text-primary-text font-semibold"
                              : "hover:bg-surface-sunken text-text"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] shrink-0 font-semibold ${
                                isActive
                                  ? "bg-primary text-primary-fg"
                                  : "bg-surface-sunken text-text-2"
                              }`}
                            >
                              {p.panggilan.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] truncate">{p.panggilan}</p>
                              <p className="text-[12px] text-text-2 truncate">{childAge.text}</p>
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenAddChild) onOpenAddChild();
                        else onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-primary hover:bg-primary-tint rounded-[10px] transition min-h-[40px] font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah anak baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-2 hover:bg-surface-sunken rounded-[10px] transition min-h-[40px] cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Kelola profil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="font-serif font-bold text-[18px] text-text">Kula</span>
          )}
        </div>

        {/* Right side: Quiet sync status chip & User Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-text-2" title="Status sinkronisasi">
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

          {user && (
            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-accent-tint text-accent-text flex items-center justify-center text-[13px] font-semibold transition cursor-pointer hover:opacity-90 min-h-[44px] min-w-[44px] border border-border"
                aria-label="Menu akun"
                aria-expanded={isAvatarMenuOpen}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Akun"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span>{(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}</span>
                )}
              </button>

              {isAvatarMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-60 bg-surface rounded-[12px] border border-border py-1.5 z-50 divide-y divide-border"
                  style={{ boxShadow: "var(--shadow-popover)" }}
                >
                  <div className="px-3.5 py-2">
                    <p className="text-[13px] font-semibold text-text truncate">
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
                      <SettingsIcon className="w-4 h-4 text-text-2" />
                      <span>Pengaturan akun global</span>
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
          )}
        </div>
      </div>
    </header>
  );
};
