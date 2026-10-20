import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { doc, onSnapshot, collection, query } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/common/Toast";
import { Family, Member, Invite, Relation, Role } from "../types";
import { can, isPermissionDenied, sortMembers } from "../utils";
import * as familyService from "../service/family";

export type FamilyStatus = "loading" | "none" | "active" | "orphaned" | "error";
export type FamilyNotice = null | "removed" | "family-deleted";

interface FamilyContextType {
  status: FamilyStatus;
  family: Family | null;
  me: Member | null;
  role: Role | null;
  isAdmin: boolean;
  isOwner: boolean;
  canEditFinance: boolean;
  notice: FamilyNotice;
  members: Member[]; // Helper convenience
  actions: {
    createFamily: (params: { name: string; relation: Relation; displayName: string }) => Promise<string>;
    joinFamily: (code: string, displayName: string) => Promise<string>;
    previewInvite: (code: string) => Promise<{ invite: Invite; status: "valid" | "used" | "expired" }>;
    leaveFamily: () => Promise<void>;
    removeMember: (targetUid: string) => Promise<void>;
    setMemberRoleRelation: (targetUid: string, updates: { role?: Role; relation?: Relation }) => Promise<void>;
    setOwnDisplayName: (name: string) => Promise<void>;
    renameFamily: (name: string) => Promise<void>;
    transferOwnership: (toUid: string) => Promise<void>;
    deleteFamily: (confirmName: string) => Promise<void>;
    cleanupOrphan: () => Promise<void>;
    dismissNotice: () => void;
  };
  dismissNotice: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState<FamilyStatus>("loading");
  const [family, setFamily] = useState<Family | null>(null);
  const [me, setMe] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notice, setNotice] = useState<FamilyNotice>(null);

  const prevStatusRef = useRef<FamilyStatus>("loading");
  const selfInitiatedExitRef = useRef(false);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  useEffect(() => {
    if (!user) {
      setStatus("none");
      setFamily(null);
      setMe(null);
      setMembers([]);
      setNotice(null);
      prevStatusRef.current = "none";
      return;
    }

    setStatus("loading");
    let unsubMember: (() => void) | null = null;
    let unsubFamily: (() => void) | null = null;
    let unsubMembersList: (() => void) | null = null;

    // 1. Subscribe to users/{uid}/membership/current
    const membershipRef = doc(db, "users", user.uid, "membership", "current");
    const unsubMembership = onSnapshot(
      membershipRef,
      (pointerSnap) => {
        if (!pointerSnap.exists()) {
          // Check if previously active
          if (prevStatusRef.current === "active" && !selfInitiatedExitRef.current) {
            setNotice("removed");
          }
          selfInitiatedExitRef.current = false;
          setStatus("none");
          setFamily(null);
          setMe(null);
          setMembers([]);
          prevStatusRef.current = "none";

          if (unsubMember) { unsubMember(); unsubMember = null; }
          if (unsubFamily) { unsubFamily(); unsubFamily = null; }
          if (unsubMembersList) { unsubMembersList(); unsubMembersList = null; }
          return;
        }

        const fid = pointerSnap.data()?.familyId;
        if (!fid) {
          setStatus("orphaned");
          prevStatusRef.current = "orphaned";
          return;
        }

        // 2. Subscribe to members/{uid}
        if (unsubMember) unsubMember();
        const memberRef = doc(db, "families", fid, "members", user.uid);
        unsubMember = onSnapshot(
          memberRef,
          (memberSnap) => {
            if (!memberSnap.exists()) {
              setStatus("orphaned");
              prevStatusRef.current = "orphaned";
              setMe(null);
              return;
            }

            const memberData = memberSnap.data() as Member;
            setMe(memberData);

            // 3. Subscribe to families/{fid}
            if (!unsubFamily) {
              const familyRef = doc(db, "families", fid);
              unsubFamily = onSnapshot(
                familyRef,
                (familySnap) => {
                  if (!familySnap.exists()) {
                    setNotice("family-deleted");
                    setStatus("orphaned");
                    prevStatusRef.current = "orphaned";
                    setFamily(null);
                    return;
                  }

                  const famData = familySnap.data() as Family;
                  setFamily(famData);
                  setStatus("active");
                  prevStatusRef.current = "active";
                },
                (err) => {
                  if (isPermissionDenied(err)) {
                    setNotice("family-deleted");
                    setStatus("orphaned");
                    prevStatusRef.current = "orphaned";
                  } else {
                    console.error("Family listener error:", err);
                    setStatus("error");
                  }
                }
              );
            }

            // 4. Also keep members list in context for easy access
            if (!unsubMembersList) {
              const membersCol = collection(db, "families", fid, "members");
              unsubMembersList = onSnapshot(
                membersCol,
                (snaps) => {
                  const list: Member[] = snaps.docs.map((d) => d.data() as Member);
                  setMembers(sortMembers(list));
                },
                (err) => {
                  console.warn("Members list listener error:", err);
                }
              );
            }
          },
          (err) => {
            if (isPermissionDenied(err)) {
              setStatus("orphaned");
              prevStatusRef.current = "orphaned";
            } else {
              console.error("Member listener error:", err);
              setStatus("error");
            }
          }
        );
      },
      (err) => {
        if (isPermissionDenied(err)) {
          setStatus("none");
          prevStatusRef.current = "none";
        } else {
          console.error("Membership pointer listener error:", err);
          setStatus("error");
        }
      }
    );

    return () => {
      unsubMembership();
      if (unsubMember) unsubMember();
      if (unsubFamily) unsubFamily();
      if (unsubMembersList) unsubMembersList();
    };
  }, [user?.uid]);

  // Actions wrappers with toasts
  const handleCreateFamily = useCallback(
    async (params: { name: string; relation: Relation; displayName: string }) => {
      if (!user) throw new Error("Pengguna belum masuk.");
      const fid = await familyService.createFamily(user, params);
      showToast("Keluarga dibuat.");
      return fid;
    },
    [user, showToast]
  );

  const handleJoinFamily = useCallback(
    async (code: string, displayName: string) => {
      if (!user) throw new Error("Pengguna belum masuk.");
      const fid = await familyService.joinFamily(user, code, displayName);
      const name = family?.name || "keluarga";
      showToast(`Anda bergabung ke keluarga ${name}.`);
      return fid;
    },
    [user, family?.name, showToast]
  );

  const handlePreviewInvite = useCallback(async (code: string) => {
    return familyService.previewInvite(code);
  }, []);

  const handleLeaveFamily = useCallback(async () => {
    if (!user || !family) return;
    selfInitiatedExitRef.current = true;
    await familyService.leaveFamily(user.uid, family.id);
    showToast("Anda keluar dari keluarga.");
  }, [user, family, showToast]);

  const handleRemoveMember = useCallback(
    async (targetUid: string) => {
      if (!family) return;
      await familyService.removeMember(family.id, targetUid);
      showToast("Anggota dikeluarkan.");
    },
    [family, showToast]
  );

  const handleSetMemberRoleRelation = useCallback(
    async (targetUid: string, updates: { role?: Role; relation?: Relation }) => {
      if (!family) return;
      await familyService.setMemberRoleRelation(family.id, targetUid, updates);
      showToast("Peran anggota diperbarui.");
    },
    [family, showToast]
  );

  const handleSetOwnDisplayName = useCallback(
    async (name: string) => {
      if (!user || !family) return;
      await familyService.setOwnDisplayName(family.id, user.uid, name);
      showToast("Nama diperbarui.");
    },
    [user, family, showToast]
  );

  const handleRenameFamily = useCallback(
    async (name: string) => {
      if (!family) return;
      await familyService.renameFamily(family.id, name);
      showToast("Nama diperbarui.");
    },
    [family, showToast]
  );

  const handleTransferOwnership = useCallback(
    async (toUid: string) => {
      if (!user || !family) return;
      await familyService.transferOwnership(family.id, user.uid, toUid);
      showToast("Kepemilikan dipindahkan.");
    },
    [user, family, showToast]
  );

  const handleDeleteFamily = useCallback(
    async (confirmName: string) => {
      if (!user || !family) return;
      if (confirmName.trim() !== family.name.trim()) {
        throw new Error("Nama keluarga tidak cocok.");
      }
      selfInitiatedExitRef.current = true;
      await familyService.deleteFamily(family.id, user.uid);
      showToast("Keluarga dihapus.");
    },
    [user, family, showToast]
  );

  const handleCleanupOrphan = useCallback(async () => {
    if (!user) return;
    await familyService.cleanupOrphan(user.uid);
    setNotice(null);
    setStatus("none");
  }, [user]);

  const isAdmin = me?.role === "admin";
  const isOwner = me?.isOwner === true;
  const canEditFinance = can(me, "finance.write");

  const value: FamilyContextType = {
    status,
    family,
    me,
    role: me?.role || null,
    isAdmin,
    isOwner,
    canEditFinance,
    notice,
    members,
    actions: {
      createFamily: handleCreateFamily,
      joinFamily: handleJoinFamily,
      previewInvite: handlePreviewInvite,
      leaveFamily: handleLeaveFamily,
      removeMember: handleRemoveMember,
      setMemberRoleRelation: handleSetMemberRoleRelation,
      setOwnDisplayName: handleSetOwnDisplayName,
      renameFamily: handleRenameFamily,
      transferOwnership: handleTransferOwnership,
      deleteFamily: handleDeleteFamily,
      cleanupOrphan: handleCleanupOrphan,
      dismissNotice
    },
    dismissNotice
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    return {
      status: "none" as FamilyStatus,
      family: null,
      me: null,
      role: null,
      isAdmin: false,
      isOwner: false,
      canEditFinance: false,
      notice: null as FamilyNotice,
      members: [],
      actions: {
        createFamily: async () => "",
        joinFamily: async () => "",
        previewInvite: async () => ({ invite: {} as any, status: "expired" as const }),
        leaveFamily: async () => {},
        removeMember: async () => {},
        setMemberRoleRelation: async () => {},
        setOwnDisplayName: async () => {},
        renameFamily: async () => {},
        transferOwnership: async () => {},
        deleteFamily: async () => {},
        cleanupOrphan: async () => {},
        dismissNotice: () => {}
      },
      dismissNotice: () => {}
    };
  }
  return context;
};

export function useFamilyMembers(fid: string | undefined | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fid) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = collection(db, "families", fid, "members");
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Member[] = snap.docs.map((d) => d.data() as Member);
        setMembers(sortMembers(list));
        setLoading(false);
      },
      (err) => {
        console.warn("useFamilyMembers error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fid]);

  return { members, loading };
}

export function useFamilyInvites(fid: string | undefined | null) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fid) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = familyService.subscribeInvites(
      fid,
      (list) => {
        setInvites(list);
        setLoading(false);
      },
      (err) => {
        console.warn("useFamilyInvites error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fid]);

  return { invites, loading };
}
