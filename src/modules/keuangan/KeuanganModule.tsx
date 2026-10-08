import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { FinanceLayout } from "./components/FinanceLayout";
import { AnggaranPage } from "./pages/AnggaranPage";
import { PengaturanPage } from "./pages/PengaturanPage";
import { RingkasanPage } from "./pages/RingkasanPage";
import { TransaksiPage } from "./pages/TransaksiPage";
import { FinanceProvider } from "./state/FinanceProvider";

export const KeuanganModule: React.FC = () => {
  return (
    <FinanceProvider>
      <Routes>
        <Route element={<FinanceLayout />}>
          <Route index element={<Navigate to="ringkasan" replace />} />
          <Route path="ringkasan" element={<RingkasanPage />} />
          <Route path="transaksi" element={<TransaksiPage />} />
          <Route path="anggaran" element={<AnggaranPage />} />
          <Route path="pengaturan" element={<PengaturanPage />} />
          <Route path="*" element={<Navigate to="ringkasan" replace />} />
        </Route>
      </Routes>
    </FinanceProvider>
  );
};

export default KeuanganModule;
