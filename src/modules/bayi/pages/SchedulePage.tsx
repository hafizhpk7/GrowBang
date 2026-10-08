import React from "react";
import { useOutletContext } from "react-router-dom";
import { useBayi } from "../context/BayiContext";
import { ScheduleTab } from "../components/ScheduleTab";

export const SchedulePage: React.FC = () => {
  const {
    activeProfile,
    paymentMode,
    updatePaymentMode,
    updateScheduleRow,
    updateRecord,
    addCustomRow,
    deleteCustomRow,
    resetSchedule
  } = useBayi();
  const { setSelectedVaccineRef } = useOutletContext<any>();

  if (!activeProfile) return null;

  return (
    <ScheduleTab
      profile={activeProfile}
      paymentMode={paymentMode}
      onUpdatePaymentMode={updatePaymentMode}
      onUpdateScheduleRow={updateScheduleRow}
      onUpdateRecord={updateRecord}
      onAddCustomRow={addCustomRow}
      onDeleteCustomRow={deleteCustomRow}
      onResetSchedule={resetSchedule}
      onOpenVaccineDetail={(ref) => setSelectedVaccineRef(ref)}
    />
  );
};
