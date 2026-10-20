import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AppState, Insurance, PaymentMode, Profile, Record, ScheduleRow } from "../../../types";
import { getInitialState, loadAppState, saveAppState } from "../../../utils/storage";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/common/Toast";
import { todayLocal } from "../../keuangan/utils/dates";
import * as transitions from "../state/transitions";
import { useBayiRepository } from "../repository/useBayiRepository";

export function useBayiState(onNavigateToBabyHome?: () => void) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { repository, mode, isAdmin } = useBayiRepository();

  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== "undefined") {
      return loadAppState();
    }
    return getInitialState();
  });

  const isSyncingFromCloudRef = useRef(false);
  const dirtyRef = useRef(false);

  // Subscribe to the active repository
  useEffect(() => {
    isSyncingFromCloudRef.current = true;

    const unsubscribe = repository.subscribe(
      (newState) => {
        setAppState(newState);
        isSyncingFromCloudRef.current = false;
      },
      (err) => {
        console.warn("Bayi repository subscription note:", err);
        isSyncingFromCloudRef.current = false;
      }
    );

    return () => {
      unsubscribe();
    };
  }, [repository]);

  // In personal or guest mode: auto-save local changes to localStorage and Firestore
  useEffect(() => {
    if (mode === "family") {
      // In family mode, do NOT write whole state to localStorage or appData
      return;
    }

    if (isSyncingFromCloudRef.current) {
      isSyncingFromCloudRef.current = false;
      return;
    }

    // Save to local storage for guest / personal mode
    saveAppState(appState);
  }, [appState, mode]);

  // Derived active profile
  const activeProfile = useMemo(() => {
    if (appState.profiles.length === 0) return null;
    const found = appState.profiles.find((p) => p.id === appState.activeProfileId);
    return found || appState.profiles[0] || null;
  }, [appState.profiles, appState.activeProfileId]);

  const paymentMode = appState.paymentMode || "HYBRID";
  const isReadOnly = mode === "family" && !isAdmin;

  const assertCanWrite = useCallback((): boolean => {
    if (isReadOnly) {
      showToast("Mode lihat saja: Hanya admin keluarga yang dapat mengubah data Bayi.");
      return false;
    }
    return true;
  }, [isReadOnly, showToast]);

  // H1: addProfile
  const addProfile = useCallback(
    (newProfile: Profile) => {
      if (!assertCanWrite()) return;
      const next = transitions.addProfile(appState, newProfile);
      setAppState(next);
      repository.saveState(next, appState).catch((err) => {
        showToast(err.message || "Gagal menyimpan data anak");
      });
    },
    [appState, assertCanWrite, repository, showToast]
  );

  // H2: selectProfile (available to everyone)
  const selectProfile = useCallback(
    (id: string) => {
      const next = transitions.selectProfile(appState, id);
      setAppState(next);
      repository.savePreferences(id, paymentMode).catch(() => {});
    },
    [appState, paymentMode, repository]
  );

  // H3: updateProfile
  const updateProfile = useCallback(
    (updatedProfile: Profile) => {
      if (!assertCanWrite()) return;
      const next = transitions.updateProfile(appState, updatedProfile);
      setAppState(next);
      repository.saveState(next, appState).catch((err) => {
        showToast(err.message || "Gagal memperbarui profil anak");
      });
    },
    [appState, assertCanWrite, repository, showToast]
  );

  // H4: deleteProfile
  const deleteProfile = useCallback(
    (id: string) => {
      if (!assertCanWrite()) return;
      const next = transitions.deleteProfile(appState, id);
      setAppState(next);
      repository.saveState(next, appState).catch((err) => {
        showToast(err.message || "Gagal menghapus profil anak");
      });
    },
    [appState, assertCanWrite, repository, showToast]
  );

  // H5: updateScheduleRow
  const updateScheduleRow = useCallback(
    (updatedRow: ScheduleRow) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;
      const next = transitions.updateScheduleRow(appState, activeProfile.id, updatedRow);
      setAppState(next);
      repository.updateScheduleRow(activeProfile.id, updatedRow).catch((err) => {
        showToast(err.message || "Gagal memperbarui jadwal");
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast]
  );

  // H6: addCustomRow
  const addCustomRow = useCallback(
    (newRow: ScheduleRow) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;
      const next = transitions.addCustomRow(appState, activeProfile.id, newRow);
      setAppState(next);
      repository.addCustomRow(activeProfile.id, newRow).catch((err) => {
        showToast(err.message || "Gagal menambah jadwal khusus");
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast]
  );

  // H7: deleteCustomRow
  const deleteCustomRow = useCallback(
    (rowId: string) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;
      const next = transitions.deleteCustomRow(appState, activeProfile.id, rowId);
      setAppState(next);
      repository.deleteCustomRow(activeProfile.id, rowId).catch((err) => {
        showToast(err.message || "Gagal menghapus jadwal");
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast]
  );

  // H8: resetSchedule
  const resetSchedule = useCallback(() => {
    if (!assertCanWrite()) return;
    if (!activeProfile) return;
    const next = transitions.resetSchedule(appState, activeProfile.id);
    setAppState(next);
    repository.resetSchedule(activeProfile.id).catch((err) => {
      showToast(err.message || "Gagal mereset jadwal");
    });
  }, [activeProfile, appState, assertCanWrite, repository, showToast]);

  // H9: updateRecord
  const updateRecord = useCallback(
    (updatedRec: Record) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;
      const next = transitions.updateRecord(appState, activeProfile.id, updatedRec);
      setAppState(next);
      repository.updateRecord(activeProfile.id, updatedRec).catch((err) => {
        showToast(err.message || "Gagal menyimpan catatan vaksin");
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast]
  );

  // H10: quickMarkGiven
  const quickMarkGiven = useCallback(
    (row: ScheduleRow) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;

      const todayStr = todayLocal();
      const { newRecord, previousRecord } = transitions.buildQuickMarkRecord(activeProfile, row, todayStr);

      updateRecord(newRecord);

      showToast(`Ditandai selesai: ${row.vaksin}.`, "Urungkan", () => {
        if (!assertCanWrite()) return;
        if (previousRecord) {
          updateRecord(previousRecord);
        } else {
          // Revert addition
          const next = transitions.deleteCustomRow(appState, activeProfile.id, row.id);
          setAppState(next);
          repository.saveState(next, appState).catch(() => {});
        }
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast, updateRecord]
  );

  // H11: updateInsurance
  const updateInsurance = useCallback(
    (updatedInsurance: Insurance) => {
      if (!assertCanWrite()) return;
      if (!activeProfile) return;
      const next = transitions.updateInsurance(appState, activeProfile.id, updatedInsurance);
      setAppState(next);
      repository.saveState(next, appState).catch((err) => {
        showToast(err.message || "Gagal memperbarui asuransi");
      });
    },
    [activeProfile, appState, assertCanWrite, repository, showToast]
  );

  // H12: updatePaymentMode (available to everyone)
  const updatePaymentMode = useCallback(
    (mode: PaymentMode) => {
      const next = transitions.updatePaymentMode(appState, mode);
      setAppState(next);
      repository.savePreferences(appState.activeProfileId, mode).catch(() => {});
    },
    [appState, repository]
  );

  // H13: clearAllBabyData
  const clearAllBabyData = useCallback(() => {
    if (!assertCanWrite()) return;
    repository.clearAllData().then(() => {
      setAppState(getInitialState());
      if (onNavigateToBabyHome) {
        onNavigateToBabyHome();
      }
    }).catch((err) => {
      showToast(err.message || "Gagal menghapus data");
    });
  }, [assertCanWrite, onNavigateToBabyHome, repository, showToast]);

  return {
    appState,
    setAppState,
    activeProfile,
    paymentMode,
    mode,
    isAdmin,
    isReadOnly,
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
