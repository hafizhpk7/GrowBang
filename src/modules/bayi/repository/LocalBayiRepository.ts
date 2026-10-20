import { AppState, PaymentMode, Record, ScheduleRow } from "../../../types";
import { clearAllData, getInitialState, loadAppState, saveAppState } from "../../../utils/storage";
import { BayiRepository } from "./types";

export class LocalBayiRepository implements BayiRepository {
  private listeners: Set<(state: AppState) => void> = new Set();

  subscribe(onData: (state: AppState) => void): () => void {
    this.listeners.add(onData);
    const initial = loadAppState();
    onData(initial);

    return () => {
      this.listeners.delete(onData);
    };
  }

  private notify() {
    const cur = loadAppState();
    this.listeners.forEach((fn) => fn(cur));
  }

  async saveState(nextState: AppState): Promise<void> {
    saveAppState(nextState);
    this.notify();
  }

  async savePreferences(activeProfileId: string, paymentMode: PaymentMode): Promise<void> {
    const cur = loadAppState();
    const updated: AppState = {
      ...cur,
      activeProfileId,
      paymentMode
    };
    saveAppState(updated);
    this.notify();
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
    saveAppState(updated);
    this.notify();
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
    saveAppState(updated);
    this.notify();
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
    saveAppState(updated);
    this.notify();
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
    saveAppState(updated);
    this.notify();
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
    saveAppState(updated);
    this.notify();
  }

  async clearAllData(): Promise<void> {
    clearAllData();
    const fresh = getInitialState();
    saveAppState(fresh);
    this.notify();
  }
}
