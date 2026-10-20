import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useFamily } from "../../../shell/family/context/FamilyContext";
import { useToast } from "../../../components/common/Toast";
import { BayiRepository } from "./types";
import { LocalBayiRepository } from "./LocalBayiRepository";
import { PersonalCloudBayiRepository } from "./PersonalCloudBayiRepository";
import { FamilyBayiRepository } from "./FamilyBayiRepository";

export function useBayiRepository(): {
  repository: BayiRepository;
  mode: "guest" | "personal" | "family";
  familyId?: string;
  isAdmin: boolean;
} {
  const { user, setCloudSyncStatus, markSynced } = useAuth();
  const { status, family, isAdmin } = useFamily();
  const { showToast } = useToast();

  const isFamilyActive = user && status === "active" && Boolean(family?.id);

  const mode: "guest" | "personal" | "family" = !user
    ? "guest"
    : isFamilyActive
    ? "family"
    : "personal";

  const repository = useMemo<BayiRepository>(() => {
    if (!user) {
      return new LocalBayiRepository();
    }
    if (isFamilyActive && family?.id) {
      return new FamilyBayiRepository(family.id, user.uid, isAdmin);
    }
    return new PersonalCloudBayiRepository(user.uid, setCloudSyncStatus, markSynced, showToast);
  }, [user, isFamilyActive, family?.id, isAdmin, setCloudSyncStatus, markSynced, showToast]);

  return {
    repository,
    mode,
    familyId: family?.id,
    isAdmin
  };
}
