/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SEED_SCHEDULE } from "./data/seed";
import { AppState, Insurance, PaymentMode, Profile, Record, ScheduleRow } from "./types";
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
import { KeuanganTab } from "./components/keuangan/KeuanganTab";
import { VaccineInfoTab } from "./components/vaccines/VaccineInfoTab";
import { SettingsTab } from "./components/settings/SettingsTab";
import { RecordModal } from "./components/schedule/RecordModal";
import { PWANotification } from "./components/common/PWANotification";
import { AuthScreen } from "./components/auth/AuthScreen";
import { calculateDueDate, formatIndonesianDate } from "./utils/dates";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./components/common/Toast";
import { saveStateToCloud, subscribeToCloudState } from "./services/firebase";

function MainApp() {
  const { user, loading: authLoading, isGuest, setCloudSyncStatus, markSynced } = useAuth();
  const { showToast } = useToast();
  const [appState, setAppState] = useState<AppState>(getInitialState);
  const [activeTab, setActiveTab] = useState<TabId>("beranda");
  const isSyncingFromCloudRef = useRef(false);

  // Global modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<"list" | "add">("list");
  const [selectedVaccineRef, setSelectedVaccineRef] = useState<string | null>(null);
  const [recordModalRow, setRecordModalRow] = useState<ScheduleRow | null>(null);

  // Initialize app state from localStorage cache
  useEffect(() => {
    try {
      const saved = loadAppState();
      setAppState(saved);
    } catch (e) {
      console.error("Gagal memuat state lokal:", e);
    }
  }, []);

  // Real-time Firestore sync listener when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCloudState(
      user.uid,
      (cloudData) => {
        if (cloudData && Array.isArray(cloudData.profiles) && cloudData.profiles.length > 0) {
          isSyncingFromCloudRef.current = true;
          setAppState(cloudData);
          saveAppState(cloudData);
          markSynced();
        } else {
          setCloudSyncStatus("syncing");
          saveStateToCloud(user.uid, appState)
            .then(() => markSynced())
            .catch(() => setCloudSyncStatus("error"));
        }
      },
      (error) => {
        console.warn("Real-time listener note:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Auto-save local changes to Firestore and localStorage
  useEffect(() => {
    if (!user) return;

    if (isSyncingFromCloudRef.current) {
      isSyncingFromCloudRef.current = false;
      return;
    }

    saveAppState(appState);
    setCloudSyncStatus("syncing");

    const timer = setTimeout(() => {
      saveStateToCloud(user.uid, appState)
        .then(() => markSynced())
        .catch((err) => {
          console.error("Auto cloud sync error:", err);
          setCloudSyncStatus("error");
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [appState, user?.uid, setCloudSyncStatus, markSynced]);

  // Active profile
  const activeProfile = useMemo(() => {
    if (appState.profiles.length === 0) return null;
    const found = appState.profiles.find((p) => p.id === appState.activeProfileId);
    return found || appState.profiles[0] || null;
  }, [appState.profiles, appState.activeProfileId]);

  const paymentMode = appState.paymentMode || "HYBRID";

  const handleUpdatePaymentMode = useCallback((mode: PaymentMode) => {
    setAppState((prev) => ({
      ...prev,
      paymentMode: mode
    }));
  }, []);

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

  const handleDeleteProfile = useCallback((id: string) => {
    setAppState((prev) => {
      const remaining = prev.profiles.filter((p) => p.id !== id);
      let nextActiveId = "";

      if (remaining.length > 0) {
        if (prev.activeProfileId === id) {
          nextActiveId = remaining[0].id;
        } else {
          nextActiveId = prev.activeProfileId;
        }
      } else {
        nextActiveId = "";
      }

      const newState: AppState = {
        ...prev,
        profiles: remaining,
        activeProfileId: nextActiveId
      };

      saveAppState(newState);
      return newState;
    });
  }, []);

  const handleUpdateScheduleRow = useCallback((updatedRow: ScheduleRow) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          schedule: p.schedule.map((r) => (r.id === updatedRow.id ? updatedRow : r))
        };
      })
    }));
  }, []);

  const handleAddCustomRow = useCallback((newRow: ScheduleRow) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          schedule: [...p.schedule, newRow]
        };
      })
    }));
  }, []);

  const handleDeleteCustomRow = useCallback((rowId: string) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          schedule: p.schedule.filter((r) => r.id !== rowId),
          records: p.records.filter((rec) => rec.rowId !== rowId)
        };
      })
    }));
  }, []);

  const handleResetSchedule = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          schedule: JSON.parse(JSON.stringify(SEED_SCHEDULE))
        };
      })
    }));
  }, []);

  // Update vaccine administration record
  const handleUpdateRecord = useCallback((updatedRec: Record) => {
    setAppState((prev) => ({
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
    }));
  }, []);

  // Quick mark vaccine as given with UNDO toast support (Section 6.1 & 8)
  const handleQuickMarkGiven = useCallback((row: ScheduleRow) => {
    if (!activeProfile) return;
    const previousRecord = activeProfile.records.find((r) => r.rowId === row.id);
    const todayStr = new Date().toISOString().split("T")[0];

    const newRecord: Record = {
      ...(previousRecord || { rowId: row.id }),
      rowId: row.id,
      diberikan: true,
      tanggalDiberikan: previousRecord?.tanggalDiberikan || todayStr,
      tempat: previousRecord?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Klinik"),
      biayaAktual: previousRecord?.biayaAktual !== undefined ? previousRecord.biayaAktual : row.gratis === "Ya" ? 0 : row.min
    };

    handleUpdateRecord(newRecord);

    // Show undo toast per Section 6.1
    showToast(
      `Ditandai selesai: ${row.vaksin}.`,
      "Urungkan",
      () => {
        if (previousRecord) {
          handleUpdateRecord(previousRecord);
        } else {
          // Revert to unrecorded
          setAppState((prev) => ({
            ...prev,
            profiles: prev.profiles.map((p) => {
              if (p.id !== prev.activeProfileId) return p;
              return {
                ...p,
                records: p.records.filter((r) => r.rowId !== row.id)
              };
            })
          }));
        }
      }
    );
  }, [activeProfile, handleUpdateRecord, showToast]);

  const handleUpdateInsurance = useCallback((updatedInsurance: Insurance) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          insurance: updatedInsurance
        };
      })
    }));
  }, []);

  const handleClearAllData = useCallback(() => {
    clearAllData();
    const fresh = getInitialState();
    saveAppState(fresh);
    setAppState(fresh);
    if (user) {
      saveStateToCloud(user.uid, fresh).catch(() => {});
    }
    setActiveTab("beranda");
  }, [user]);

  // Loading skeleton matching final layout
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-[14px] text-text-2">
          Menyiapkan aplikasi...
        </p>
      </div>
    );
  }

  // Auth gate
  if (!user && !isGuest) {
    return (
      <ErrorBoundary>
        <AuthScreen />
      </ErrorBoundary>
    );
  }

  // Onboarding if no profile
  if (!activeProfile || appState.profiles.length === 0) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-bg text-text transition-colors flex flex-col font-sans">
        {/* Top Header */}
        <Header
          profile={activeProfile}
          profiles={appState.profiles}
          onSelectProfile={handleSelectProfile}
          onOpenProfileModal={() => {
            setProfileModalMode("list");
            setProfileModalOpen(true);
          }}
          onOpenAddChild={() => {
            setProfileModalMode("add");
            setProfileModalOpen(true);
          }}
          onNavigateToSettings={() => setActiveTab("pengaturan")}
          isSettingsActive={activeTab === "pengaturan"}
        />

        {/* Main Content Layout */}
        <div className="flex-1 max-w-[960px] w-full mx-auto flex px-4 sm:px-6">
          {/* Desktop Left Sidebar */}
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Main Content View */}
          <main className="flex-1 py-6 md:pl-8 min-w-0 pb-28 md:pb-12">
            {activeTab === "beranda" && (
              <DashboardTab
                profile={activeProfile}
                paymentMode={paymentMode}
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
                paymentMode={paymentMode}
                onUpdatePaymentMode={handleUpdatePaymentMode}
                onUpdateScheduleRow={handleUpdateScheduleRow}
                onUpdateRecord={handleUpdateRecord}
                onAddCustomRow={handleAddCustomRow}
                onDeleteCustomRow={handleDeleteCustomRow}
                onResetSchedule={handleResetSchedule}
                onOpenVaccineDetail={(ref) => setSelectedVaccineRef(ref)}
              />
            )}

            {(activeTab === "keuangan" || activeTab === "biaya" || activeTab === "asuransi") && (
              <KeuanganTab
                profile={activeProfile}
                paymentMode={paymentMode}
                onUpdatePaymentMode={handleUpdatePaymentMode}
                onUpdateInsurance={handleUpdateInsurance}
                onOpenRecordModal={(row) => setRecordModalRow(row)}
              />
            )}

            {activeTab === "info-vaksin" && <VaccineInfoTab profile={activeProfile} />}

            {activeTab === "pengaturan" && (
              <SettingsTab
                appState={appState}
                activeProfile={activeProfile}
                onClearAllData={handleClearAllData}
              />
            )}

            <Footer />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Global Modals */}
        <ProfileModal
          isOpen={profileModalOpen}
          initialMode={profileModalMode}
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
              showToast(`Tersimpan: ${recordModalRow.vaksin}`);
            }}
          />
        )}

        <PWANotification />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
