/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SEED_SCHEDULE } from "./data/seed";
import { AppState, Insurance, Profile, Record, ScheduleRow } from "./types";
import { clearAllData, getInitialState, loadAppState, saveAppState } from "./utils/storage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Header } from "./components/common/Header";
import { DesktopSidebar, MobileBottomNav, TabId } from "./components/common/Navigation";
import { Footer } from "./components/common/Footer";
import { ProfileModal } from "./components/common/ProfileModal";
import { VaccineDetailModal } from "./components/common/VaccineDetailModal";
import { OnboardingModal } from "./components/onboarding/OnboardingModal";
import { DashboardTab } from "./components/dashboard/DashboardTab";
import { ScheduleTab } from "./components/schedule/ScheduleTab";
import { CostTab } from "./components/cost/CostTab";
import { InsuranceTab } from "./components/insurance/InsuranceTab";
import { VaccineInfoTab } from "./components/vaccines/VaccineInfoTab";
import { SettingsTab } from "./components/settings/SettingsTab";
import { RecordModal } from "./components/schedule/RecordModal";
import { PWANotification } from "./components/common/PWANotification";
import { calculateDueDate, formatIndonesianDate } from "./utils/dates";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>(getInitialState);
  const [activeTab, setActiveTab] = useState<TabId>("beranda");

  // Global modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedVaccineRef, setSelectedVaccineRef] = useState<string | null>(null);
  const [recordModalRow, setRecordModalRow] = useState<ScheduleRow | null>(null);

  // Initialize app state from localStorage
  useEffect(() => {
    try {
      const saved = loadAppState();
      setAppState(saved);
      // Ensure dark mode is permanently removed
      document.documentElement.classList.remove("dark");
    } catch (e) {
      console.error("Gagal memuat state awal:", e);
    } finally {
      // Brief smooth loading transition
      const timer = setTimeout(() => {
        setLoading(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save changes to localStorage whenever appState changes (after initial loading)
  useEffect(() => {
    if (!loading) {
      saveAppState(appState);
    }
  }, [appState, loading]);

  // Active profile
  const activeProfile = useMemo(() => {
    if (appState.profiles.length === 0) return null;
    const found = appState.profiles.find((p) => p.id === appState.activeProfileId);
    return found || appState.profiles[0] || null;
  }, [appState.profiles, appState.activeProfileId]);

  // Profile operations
  const handleSelectProfile = useCallback((id: string) => {
    setAppState((prev) => ({
      ...prev,
      activeProfileId: id
    }));
  }, []);

  const handleAddProfile = useCallback((newProfile: Profile) => {
    setAppState((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id
    }));
  }, []);

  const handleUpdateProfile = useCallback((updatedProfile: Profile) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    }));
  }, []);

  // Critical Fix: Delete Profile functionality
  const handleDeleteProfile = useCallback((id: string) => {
    setAppState((prev) => {
      const remaining = prev.profiles.filter((p) => p.id !== id);
      let nextActiveId = "";

      if (remaining.length > 0) {
        // If the deleted profile was the active one, pick the next available
        if (prev.activeProfileId === id) {
          nextActiveId = remaining[0].id;
        } else {
          nextActiveId = prev.activeProfileId;
        }
      } else {
        // If it was the only profile left, clear activeProfileId
        nextActiveId = "";
      }

      const newState: AppState = {
        ...prev,
        profiles: remaining,
        activeProfileId: nextActiveId
      };

      // Ensure immediate sync to localStorage
      saveAppState(newState);
      return newState;
    });
  }, []);

  // Schedule row update for active profile
  const handleUpdateScheduleRow = useCallback((updatedRow: ScheduleRow) => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          return {
            ...p,
            schedule: p.schedule.map((r) => (r.id === updatedRow.id ? updatedRow : r))
          };
        })
      };
    });
  }, []);

  // Add custom row for active profile
  const handleAddCustomRow = useCallback((newRow: ScheduleRow) => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          return {
            ...p,
            schedule: [...p.schedule, newRow]
          };
        })
      };
    });
  }, []);

  // Delete custom row for active profile
  const handleDeleteCustomRow = useCallback((rowId: string) => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          return {
            ...p,
            schedule: p.schedule.filter((r) => r.id !== rowId),
            records: p.records.filter((rec) => rec.rowId !== rowId)
          };
        })
      };
    });
  }, []);

  // Reset schedule to seed for active profile
  const handleResetSchedule = useCallback(() => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          return {
            ...p,
            schedule: JSON.parse(JSON.stringify(SEED_SCHEDULE))
          };
        })
      };
    });
  }, []);

  // Update vaccine administration record for active profile
  const handleUpdateRecord = useCallback((updatedRec: Record) => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          const exists = p.records.some((r) => r.rowId === updatedRec.rowId);
          const newRecords = exists
            ? p.records.map((r) => (r.rowId === updatedRec.rowId ? updatedRec : r))
            : [...p.records, updatedRec];
          return {
            ...p,
            records: newRecords
          };
        })
      };
    });
  }, []);

  // Quick mark vaccine as given
  const handleQuickMarkGiven = useCallback((row: ScheduleRow) => {
    if (!activeProfile) return;
    const existing = activeProfile.records.find((r) => r.rowId === row.id);
    const todayStr = new Date().toISOString().split("T")[0];
    const rec: Record = {
      ...(existing || { rowId: row.id }),
      rowId: row.id,
      diberikan: true,
      tanggalDiberikan: existing?.tanggalDiberikan || todayStr,
      tempat: existing?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Klinik"),
      biayaAktual: existing?.biayaAktual !== undefined ? existing.biayaAktual : row.gratis === "Ya" ? 0 : row.min
    };
    handleUpdateRecord(rec);
  }, [activeProfile, handleUpdateRecord]);

  // Update insurance policy for active profile
  const handleUpdateInsurance = useCallback((updatedInsurance: Insurance) => {
    setAppState((prev) => {
      return {
        ...prev,
        profiles: prev.profiles.map((p) => {
          if (p.id !== prev.activeProfileId) return p;
          return {
            ...p,
            insurance: updatedInsurance
          };
        })
      };
    });
  }, []);

  // Clear all data
  const handleClearAllData = useCallback(() => {
    clearAllData();
    const fresh = getInitialState();
    saveAppState(fresh);
    setAppState(fresh);
    setActiveTab("beranda");
  }, []);

  // Restore imported state
  const handleRestoreState = useCallback((newState: AppState) => {
    saveAppState(newState);
    setAppState(newState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#1F4E78] to-teal-500 text-white flex items-center justify-center animate-bounce shadow-xl shadow-blue-900/20">
          <span className="font-extrabold text-2xl">💉</span>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-700">
          Menyiapkan Pemantau Imunisasi...
        </p>
      </div>
    );
  }

  // If no profiles left (e.g. after user deleted the last profile), render Onboarding
  if (!activeProfile || appState.profiles.length === 0) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <OnboardingModal
            isOpen={true}
            onComplete={(profile) => {
              handleAddProfile(profile);
            }}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors flex flex-col font-sans">
        {/* Top Header */}
        <Header
          profile={activeProfile}
          profiles={appState.profiles}
          onSelectProfile={handleSelectProfile}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onNavigateToSettings={() => setActiveTab("pengaturan")}
          isSettingsActive={activeTab === "pengaturan"}
        />

        {/* Main Layout Area */}
        <div className="flex-1 max-w-7xl w-full mx-auto flex">
          {/* Desktop Left Sidebar */}
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            profile={activeProfile}
            onOpenProfileModal={() => setProfileModalOpen(true)}
          />

          {/* Main Content View with generous bottom padding for mobile bottom nav */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-32 md:pb-12">
            {activeTab === "beranda" && (
              <DashboardTab
                profile={activeProfile}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onOpenRecordModal={(row) => setRecordModalRow(row)}
                onOpenVaccineDetail={(ref) => setSelectedVaccineRef(ref)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onQuickMarkGiven={handleQuickMarkGiven}
              />
            )}

            {activeTab === "jadwal" && (
              <ScheduleTab
                profile={activeProfile}
                onUpdateScheduleRow={handleUpdateScheduleRow}
                onUpdateRecord={handleUpdateRecord}
                onAddCustomRow={handleAddCustomRow}
                onDeleteCustomRow={handleDeleteCustomRow}
                onResetSchedule={handleResetSchedule}
                onOpenVaccineDetail={(ref) => setSelectedVaccineRef(ref)}
              />
            )}

            {activeTab === "biaya" && <CostTab profile={activeProfile} />}

            {activeTab === "asuransi" && (
              <InsuranceTab
                profile={activeProfile}
                onUpdateInsurance={handleUpdateInsurance}
                onOpenRecordModal={(row) => setRecordModalRow(row)}
              />
            )}

            {activeTab === "info-vaksin" && <VaccineInfoTab profile={activeProfile} />}

            {activeTab === "pengaturan" && (
              <SettingsTab
                appState={appState}
                activeProfile={activeProfile}
                onRestoreState={handleRestoreState}
                onClearAllData={handleClearAllData}
              />
            )}

            {/* Permanent Medical Disclaimer in Footer */}
            <Footer />
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (iOS safe-area aware) */}
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Global Modals */}
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          profiles={appState.profiles}
          activeProfileId={appState.activeProfileId}
          onSelectProfile={(id) => {
            handleSelectProfile(id);
            setProfileModalOpen(false);
          }}
          onAddProfile={handleAddProfile}
          onUpdateProfile={handleUpdateProfile}
          onDeleteProfile={handleDeleteProfile}
        />

        <VaccineDetailModal
          vaccineRef={selectedVaccineRef}
          onClose={() => setSelectedVaccineRef(null)}
          scheduleRows={activeProfile.schedule}
        />

        {recordModalRow && (
          <RecordModal
            row={recordModalRow}
            record={activeProfile.records.find((r) => r.rowId === recordModalRow.id)}
            dueDateStr={formatIndonesianDate(calculateDueDate(activeProfile.tanggalLahir, recordModalRow.bln))}
            onClose={() => setRecordModalRow(null)}
            onSave={(rec) => {
              handleUpdateRecord(rec);
              setRecordModalRow(null);
            }}
          />
        )}

        {/* PWA Offline Ready & Update Toast Notification */}
        <PWANotification />
      </div>
    </ErrorBoundary>
  );
}
