import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useBayi } from "../context/BayiContext";
import { DashboardTab } from "../components/DashboardTab";

export const DashboardPage: React.FC = () => {
  const { activeProfile, paymentMode, quickMarkGiven } = useBayi();
  const { setRecordModalRow, setSelectedVaccineRef, setProfileModalOpen } =
    useOutletContext<any>();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  return (
    <DashboardTab
      profile={activeProfile}
      paymentMode={paymentMode}
      onOpenProfileModal={() => setProfileModalOpen(true)}
      onOpenRecordModal={(row) => setRecordModalRow(row)}
      onOpenVaccineDetail={(ref) => setSelectedVaccineRef(ref)}
      onNavigateToTab={(tab) => {
        if (tab === "jadwal") navigate("/bayi/jadwal");
        else if (tab === "keuangan" || tab === "biaya" || tab === "asuransi")
          navigate("/bayi/biaya");
        else if (tab === "info-vaksin") navigate("/bayi/info-vaksin");
        else if (tab === "pengaturan") navigate("/bayi/pengaturan");
      }}
      onQuickMarkGiven={quickMarkGiven}
    />
  );
};
