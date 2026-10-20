import { AppState, Insurance, PaymentMode, Profile, Record, ScheduleRow } from "../../../types";
import { SEED_SCHEDULE } from "../../../data/seed";

export function addProfile(state: AppState, newProfile: Profile): AppState {
  return {
    ...state,
    profiles: [...state.profiles, newProfile],
    activeProfileId: newProfile.id
  };
}

export function selectProfile(state: AppState, id: string): AppState {
  return {
    ...state,
    activeProfileId: id
  };
}

export function updateProfile(state: AppState, updatedProfile: Profile): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
  };
}

export function deleteProfile(state: AppState, id: string): AppState {
  const remaining = state.profiles.filter((p) => p.id !== id);
  let nextActiveId = "";

  if (remaining.length > 0) {
    if (state.activeProfileId === id) {
      nextActiveId = remaining[0].id;
    } else {
      nextActiveId = state.activeProfileId;
    }
  } else {
    nextActiveId = "";
  }

  return {
    ...state,
    profiles: remaining,
    activeProfileId: nextActiveId
  };
}

export function updateScheduleRow(
  state: AppState,
  profileId: string,
  updatedRow: ScheduleRow
): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        schedule: p.schedule.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      };
    })
  };
}

export function addCustomRow(
  state: AppState,
  profileId: string,
  newRow: ScheduleRow
): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        schedule: [...p.schedule, newRow]
      };
    })
  };
}

export function deleteCustomRow(
  state: AppState,
  profileId: string,
  rowId: string
): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        schedule: p.schedule.filter((r) => r.id !== rowId),
        records: p.records.filter((rec) => rec.rowId !== rowId)
      };
    })
  };
}

export function resetSchedule(state: AppState, profileId: string): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        schedule: JSON.parse(JSON.stringify(SEED_SCHEDULE))
      };
    })
  };
}

export function updateRecord(
  state: AppState,
  profileId: string,
  updatedRec: Record
): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
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
}

export function updateInsurance(
  state: AppState,
  profileId: string,
  updatedInsurance: Insurance
): AppState {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        insurance: updatedInsurance
      };
    })
  };
}

export function updatePaymentMode(state: AppState, mode: PaymentMode): AppState {
  return {
    ...state,
    paymentMode: mode
  };
}

export function buildQuickMarkRecord(
  profile: Profile,
  row: ScheduleRow,
  todayStr: string
): { newRecord: Record; previousRecord?: Record } {
  const previousRecord = profile.records.find((r) => r.rowId === row.id);
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
  return { newRecord, previousRecord };
}
