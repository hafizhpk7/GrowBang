import React, { createContext, useContext } from "react";
import { useBayiState } from "../hooks/useBayiState";

type BayiContextType = ReturnType<typeof useBayiState>;

const BayiContext = createContext<BayiContextType | null>(null);

export const BayiProvider: React.FC<{ children: React.ReactNode; onNavigateToBabyHome?: () => void }> = ({
  children,
  onNavigateToBabyHome
}) => {
  const bayiState = useBayiState(onNavigateToBabyHome);
  return <BayiContext.Provider value={bayiState}>{children}</BayiContext.Provider>;
};

export function useBayi() {
  const context = useContext(BayiContext);
  if (!context) {
    throw new Error("useBayi must be used within a BayiProvider");
  }
  return context;
}
