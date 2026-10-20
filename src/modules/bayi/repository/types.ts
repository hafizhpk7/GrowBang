import { AppState, PaymentMode, ScheduleRow, VaccineRecord } from "../../../types";

export interface BayiRepository {
  /**
   * Subscribes to real-time baby state.
   * Returns an unsubscribe function.
   */
  subscribe(
    onData: (state: AppState) => void,
    onError: (err: Error) => void
  ): () => void;

  /**
   * Persists entire app state or diffs in family mode.
   */
  saveState(nextState: AppState, prevState?: AppState): Promise<void>;

  /**
   * Saves per-user preferences (activeProfileId and paymentMode).
   */
  savePreferences(activeProfileId: string, paymentMode: PaymentMode): Promise<void>;

  /**
   * Transactional schedule edits.
   */
  updateScheduleRow(babyId: string, row: ScheduleRow): Promise<void>;
  addCustomRow(babyId: string, row: ScheduleRow): Promise<void>;
  deleteCustomRow(babyId: string, rowId: string): Promise<void>;
  resetSchedule(babyId: string): Promise<void>;

  /**
   * Concurrency-safe record update (per doc).
   */
  updateRecord(babyId: string, record: VaccineRecord): Promise<void>;

  /**
   * Resets all baby data.
   */
  clearAllData(): Promise<void>;
}
