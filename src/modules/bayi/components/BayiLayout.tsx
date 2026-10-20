import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBayi } from "../context/BayiContext";
import { BayiHeader } from "./BayiHeader";
import { BayiSidebar } from "./BayiSidebar";
import { BayiBottomNav } from "./BayiBottomNav";
import { OnboardingModal } from "./OnboardingModal";
import { ProfileModal } from "./ProfileModal";
import { VaccineDetailModal } from "./VaccineDetailModal";
import { RecordModal } from "./RecordModal";

import { ScheduleRow } from "../../../types";
import { calculateDueDate, formatIndonesianDate } from "../../../utils/dates";
import { useToast } from "../../../components/common/Toast";
import { PAGE_CONTAINER } from "../../../config/layout";

export const BayiLayout: React.FC = () => {
  const {
    appState,
    activeProfile,
    selectProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    updateRecord,
    isReadOnly
  } = useBayi();

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<"list" | "add">("list");
  const [selectedVaccineRef, setSelectedVaccineRef] = useState<string | null>(null);
  const [recordModalRow, setRecordModalRow] = useState<ScheduleRow | null>(null);

  const hasNoProfiles = appState.profiles.length === 0;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <BayiHeader
        profile={activeProfile}
        profiles={appState.profiles}
        onSelectProfile={selectProfile}
        onOpenProfileModal={() => {
          setProfileModalMode("list");
          setProfileModalOpen(true);
        }}
        onOpenAddChild={() => {
          setProfileModalMode("add");
          setProfileModalOpen(true);
        }}
      />

      <div className="flex-1 w-full flex">
        <BayiSidebar />

        <main className="flex-1 min-w-0">
          {isReadOnly && (
            <div className="bg-surface-sunken p-4 text-center text-[14px] text-text-2 border-b border-border">
              Mode lihat saja: Hanya admin keluarga yang dapat mengubah data Bayi.
            </div>
          )}
          <div className={`${PAGE_CONTAINER} py-6 pb-28 md:pb-12`}>
            {/* Onboarding Gate: If 0 profiles, show OnboardingModal in place */}
            {hasNoProfiles ? (
              <OnboardingModal
                key="onboarding"
                isOpen={true}
                onComplete={(profile) => {
                  addProfile(profile);
                }}
              />
            ) : (
              <Outlet
                key="outlet"
                context={{
                  setRecordModalRow,
                  setSelectedVaccineRef,
                  setProfileModalOpen,
                  setProfileModalMode
                }}
              />
            )}
          </div>
        </main>
      </div>

      <BayiBottomNav />

      {/* Global Modals for Bayi Module */}
      <ProfileModal
        isOpen={profileModalOpen}
        initialMode={profileModalMode}
        onClose={() => setProfileModalOpen(false)}
        profiles={appState.profiles}
        activeProfileId={appState.activeProfileId}
        onSelectProfile={(id) => {
          selectProfile(id);
          setProfileModalOpen(false);
        }}
        onAddProfile={addProfile}
        onUpdateProfile={updateProfile}
        onDeleteProfile={deleteProfile}
      />

      {activeProfile && (
        <VaccineDetailModal
          vaccineRef={selectedVaccineRef}
          onClose={() => setSelectedVaccineRef(null)}
          scheduleRows={activeProfile.schedule}
        />
      )}

      {recordModalRow && activeProfile && (
        <RecordModal
          row={recordModalRow}
          record={activeProfile.records.find((r) => r.rowId === recordModalRow.id)}
          dueDateStr={formatIndonesianDate(calculateDueDate(activeProfile.tanggalLahir, recordModalRow.bln))}
          onClose={() => setRecordModalRow(null)}
          onSave={(rec) => {
            updateRecord(rec);
            setRecordModalRow(null);
            showToast(`Tersimpan: ${recordModalRow.vaksin}`);
          }}
        />
      )}
    </div>
  );
};
