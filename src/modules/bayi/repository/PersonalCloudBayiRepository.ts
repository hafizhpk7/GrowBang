import { AppState, PaymentMode, Record, ScheduleRow } from "../../../types";
import { clearAllData, getInitialState, loadAppState, saveAppState } from "../../../utils/storage";
import { saveStateToCloud, subscribeToCloudState } from "../../../services/firebase";
import { BayiRepository } from "./types";

export class PersonalCloudBayiRepository implements BayiRepository {
  private seedingAttempted = false;

  constructor(
    private userId: string,
    private setSyncStatus?: (status: "idle" | "syncing" | "synced" | "error") => void,
    private markSynced?: () => void,
    private showToast?: (msg: string) => void
  ) {}

  subscribe(
    onData: (state: AppState) => void,
    onError: (err: Error) => void
  ): () => void {
    // Deliver initial local cache first
    const initial = loadAppState();
    onData(initial);

    return subscribeToCloudState(
      this.userId,
      (cloudData, metadata) => {
        if (metadata.hasPendingWrites || metadata.fromCache) return;

        if (cloudData) {
          const currentLocal = loadAppState();
          const merged: AppState = {
            schemaVersion: cloudData.schemaVersion,
            profiles: cloudData.profiles.length > 0 ? cloudData.profiles : currentLocal.profiles,
            activeProfileId: cloudData.activeProfileId || currentLocal.activeProfileId,
            paymentMode: cloudData.paymentMode ?? currentLocal.paymentMode
          };
          saveAppState(merged);
          if (this.markSynced) this.markSynced();
          onData(merged);
        } else {
          // Document missing -> seed at most once per session
          if (this.seedingAttempted) return;
          this.seedingAttempted = true;
          if (this.setSyncStatus) this.setSyncStatus("syncing");
          const localToSeed = loadAppState();
          saveStateToCloud(this.userId, localToSeed)
            .then(() => {
              if (this.markSynced) this.markSynced();
            })
            .catch(() => {
              if (this.setSyncStatus) this.setSyncStatus("error");
            });
        }
      },
      (error) => {
        if (error.message.includes("permission-denied")) {
          if (this.setSyncStatus) this.setSyncStatus("error");
          if (this.showToast) {
            this.showToast("Sync error: Permission denied. Please check your account settings.");
          }
        }
        onError(error);
      }
    );
  }

  async saveState(nextState: AppState): Promise<void> {
    saveAppState(nextState);
    if (this.setSyncStatus) this.setSyncStatus("syncing");
    try {
      await saveStateToCloud(this.userId, nextState);
      if (this.markSynced) this.markSynced();
    } catch (e) {
      if (this.setSyncStatus) this.setSyncStatus("error");
      throw e;
    }
  }

  async savePreferences(activeProfileId: string, paymentMode: PaymentMode): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      activeProfileId,
      paymentMode
    };
    return this.saveState(updated);
  }

  async updateScheduleRow(babyId: string, row: ScheduleRow): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      profiles: cur.profiles.map((p) => {
        if (p.id !== babyId) return p;
        return {
          ...p,
          schedule: p.schedule.map((r) => (r.id === row.id ? row : r))
        };
      })
    };
    return this.saveState(updated);
  }

  async addCustomRow(babyId: string, row: ScheduleRow): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      profiles: cur.profiles.map((p) => {
        if (p.id !== babyId) return p;
        return {
          ...p,
          schedule: [...p.schedule, row]
        };
      })
    };
    return this.saveState(updated);
  }

  async deleteCustomRow(babyId: string, rowId: string): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      profiles: cur.profiles.map((p) => {
        if (p.id !== babyId) return p;
        return {
          ...p,
          schedule: p.schedule.filter((r) => r.id !== rowId),
          records: p.records.filter((rec) => rec.rowId !== rowId)
        };
      })
    };
    return this.saveState(updated);
  }

  async resetSchedule(babyId: string): Promise<void> {
    const cur = loadAppState();
    const { SEED_SCHEDULE } = await import("../../../data/seed");
    const updated: AppState = {
      ...cur,
      profiles: cur.profiles.map((p) => {
        if (p.id !== babyId) return p;
        return {
          ...p,
          schedule: JSON.parse(JSON.stringify(SEED_SCHEDULE))
        };
      })
    };
    return this.saveState(updated);
  }

  async updateRecord(babyId: string, record: Record): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      profiles: cur.profiles.map((p) => {
        if (p.id !== babyId) return p;
        const exists = p.records.some((r) => r.rowId === record.rowId);
        const newRecords = exists
          ? p.records.map((r) => (r.rowId === record.rowId ? record : r))
          : [...p.records, record];
        return {
          ...p,
          records: newRecords
        };
      })
    };
    return this.saveState(updated);
  }

  async clearAllData(): Promise<void> {
    clearAllData();
    const fresh = getInitialState();
    saveAppState(fresh);
    if (this.setSyncStatus) this.setSyncStatus("syncing");
    try {
      await saveStateToCloud(this.userId, fresh);
      if (this.markSynced) this.markSynced();
    } catch {
      if (this.setSyncStatus) this.setSyncStatus("error");
    }
  }
}
