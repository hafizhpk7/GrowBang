import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "firebase/auth";
import {
  signInWithGoogle as authSignInWithGoogle,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  logoutFirebase,
  onAuthUserChange,
  testFirestoreConnection
} from "../services/firebase";

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  cloudSyncStatus: CloudSyncStatus;
  lastSyncTime: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  continueAsGuest: () => void;
  signIn: () => Promise<void>; // Alias for Google sign in
  signOut: () => Promise<void>;
  setCloudSyncStatus: (status: CloudSyncStatus) => void;
  markSynced: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem("imunisasi_guest_mode") === "true";
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // 1. Connection check on boot (mandated by SKILL.md) & Auth state listener
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthUserChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem("imunisasi_guest_mode");
        setCloudSyncStatus("synced");
      } else {
        setCloudSyncStatus("idle");
      }
    });

    return () => unsubscribe();
  }, []);

  const markSynced = useCallback(() => {
    setCloudSyncStatus("synced");
    const now = new Date();
    setLastSyncTime(
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem("imunisasi_guest_mode", "true");
    setCloudSyncStatus("offline");
  }, []);

  const signInWithGoogleHandler = async () => {
    try {
      setCloudSyncStatus("syncing");
      const loggedUser = await authSignInWithGoogle();
      if (loggedUser) {
        setIsGuest(false);
        localStorage.removeItem("imunisasi_guest_mode");
        markSynced();
      }
    } catch (err) {
      setCloudSyncStatus("error");
      throw err;
    }
  };

  const signInWithEmailHandler = async (email: string, pass: string) => {
    try {
      setCloudSyncStatus("syncing");
      const loggedUser = await authSignInWithEmail(email, pass);
      if (loggedUser) {
        setIsGuest(false);
        localStorage.removeItem("imunisasi_guest_mode");
        markSynced();
      }
    } catch (err) {
      setCloudSyncStatus("error");
      throw err;
    }
  };

  const signUpWithEmailHandler = async (email: string, pass: string, displayName: string) => {
    try {
      setCloudSyncStatus("syncing");
      const newUser = await authSignUpWithEmail(email, pass, displayName);
      if (newUser) {
        setIsGuest(false);
        localStorage.removeItem("imunisasi_guest_mode");
        markSynced();
      }
    } catch (err) {
      setCloudSyncStatus("error");
      throw err;
    }
  };

  const signOutHandler = async () => {
    try {
      await logoutFirebase();
      setIsGuest(false);
      localStorage.removeItem("imunisasi_guest_mode");
      setCloudSyncStatus("idle");
    } catch (err) {
      console.warn("Logout note:", err);
      setIsGuest(false);
      localStorage.removeItem("imunisasi_guest_mode");
      setCloudSyncStatus("idle");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        cloudSyncStatus,
        lastSyncTime,
        signInWithGoogle: signInWithGoogleHandler,
        signInWithEmail: signInWithEmailHandler,
        signUpWithEmail: signUpWithEmailHandler,
        continueAsGuest,
        signIn: signInWithGoogleHandler,
        signOut: signOutHandler,
        setCloudSyncStatus,
        markSynced
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
