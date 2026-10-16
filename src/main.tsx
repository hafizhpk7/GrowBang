import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { FamilyProvider } from "./shell/family/context/FamilyContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <FamilyProvider>
      <App />
    </FamilyProvider>
  </AuthProvider>
);
