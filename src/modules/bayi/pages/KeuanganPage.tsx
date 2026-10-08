import React from "react";
import { useOutletContext } from "react-router-dom";
import { useBayi } from "../context/BayiContext";
import { KeuanganTab } from "../components/KeuanganTab";

export const KeuanganPage: React.FC = () => {
  const { activeProfile, paymentMode, updatePaymentMode, updateInsurance } = useBayi();
  const { setRecordModalRow } = useOutletContext<any>();

  if (!activeProfile) return null;

  return (
    <KeuanganTab
      profile={activeProfile}
      paymentMode={paymentMode}
      onUpdatePaymentMode={updatePaymentMode}
      onUpdateInsurance={updateInsurance}
      onOpenRecordModal={(row) => setRecordModalRow(row)}
    />
  );
};
