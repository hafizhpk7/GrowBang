import React from "react";
import { useBayi } from "../context/BayiContext";
import { VaccineInfoTab } from "../components/VaccineInfoTab";

export const VaccineInfoPage: React.FC = () => {
  const { activeProfile } = useBayi();
  if (!activeProfile) return null;
  return <VaccineInfoTab profile={activeProfile} />;
};
