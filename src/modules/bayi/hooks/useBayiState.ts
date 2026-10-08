import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SEED_SCHEDULE } from "../../../data/seed";
import { AppState, Insurance, PaymentMode, Profile, Record, ScheduleRow } from "../../../types";
import { clearAllData as clearStorageData, getInitialState, loadAppState, saveAppState } from "../../../utils/storage";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/common/Toast";
import { saveStateToCloud, subscribeToCloudState } from "../../../services/firebase";

export function useBayiState(onNavigateToBabyHome?: () => void) {
  const { user, setCloudSyncStatus, markSynced } = useAuth();
  const { showToast } = useToast();
  const [appState, setAppState] = useState<AppState>(getInitialState);
  const isSyncingFromCloudRef = useRef(false);

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

  // H1: addProfile
  const addProfile = useCallback((newProfile: Profile) => {
    setAppState((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id
    }));
  }, []);

  // H2: selectProfile
  const selectProfile = useCallback((id: string) => {
    setAppState((prev) => ({
      ...prev,
      activeProfileId: id
    }));
  }, []);

  // H3: updateProfile
  const updateProfile = useCallback((updatedProfile: Profile) => {
    setAppState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    }));
  }, []);

  // H4: deleteProfile
  const deleteProfile = useCallback((id: string) => {
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

  // H5: updateScheduleRow
  const updateScheduleRow = useCallback((updatedRow: ScheduleRow) => {
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

  // H6: addCustomRow
  const addCustomRow = useCallback((newRow: ScheduleRow) => {
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

  // H7: deleteCustomRow
  const deleteCustomRow = useCallback((rowId: string) => {
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

  // H8: resetSchedule
  const resetSchedule = useCallback(() => {
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

  // H9: updateRecord
  const updateRecord = useCallback((updatedRec: Record) => {
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

  // H10: quickMarkGiven
  const quickMarkGiven = useCallback((row: ScheduleRow) => {
    if (!activeProfile) return;
    const previousRecord = activeProfile.records.find((r) => r.rowId === row.id);
    const todayStr = new Date().toISOString().split("T")[0];

    const newRecord: Record = {
      ...(previousRecord || { rowId: row.id }),
      rowId: row.id,
      diberikan: true,
      tanggalDiberikan: previousRecord?.tanggalDiberikan || todayStr,
      tempat: previousRecord?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Klinik"),
      biayaAktual:
        previousRecord?.biayaAktual !== undefined
          ? previousRecord.biayaAktual
          : row.gratis === "Ya"
          ? 0
          : row.min
    };

    updateRecord(newRecord);

    showToast(`Ditandai selesai: ${row.vaksin}.`, "Urungkan", () => {
      if (previousRecord) {
        updateRecord(previousRecord);
      } else {
        setAppState((prev) => ({
          ...prev,
          profiles: prev.profiles.map((p) => {
            if (p.id !== prev.activeProfileId) return p;
            return {
              ...p,
              records: p.records.filter((rec) => rec.rowId !== row.id)
            };
          })
        }));
      }
    });
  }, [activeProfile, updateRecord, showToast]);

  // H11: updateInsurance
  const updateInsurance = useCallback((updatedInsurance: Insurance) => {
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

  // H12: updatePaymentMode
  const updatePaymentMode = useCallback((mode: PaymentMode) => {
    setAppState((prev) => ({
      ...prev,
      paymentMode: mode
    }));
  }, []);

  // H13: clearAllData (Baby data clear)
  const clearAllBabyData = useCallback(() => {
    clearStorageData();
    const fresh = getInitialState();
    saveAppState(fresh);
    setAppState(fresh);

    if (user) {
      saveStateToCloud(user.uid, fresh).catch(() => {});
    }

    if (onNavigateToBabyHome) {
      onNavigateToBabyHome();
    }
  }, [user, onNavigateToBabyHome]);

  return {
    appState,
    setAppState,
    activeProfile,
    paymentMode,
    addProfile,
    selectProfile,
    updateProfile,
    deleteProfile,
    updateScheduleRow,
    addCustomRow,
    deleteCustomRow,
    resetSchedule,
    updateRecord,
    quickMarkGiven,
    updateInsurance,
    updatePaymentMode,
    clearAllBabyData
  };
}
