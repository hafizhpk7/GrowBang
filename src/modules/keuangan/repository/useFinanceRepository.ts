import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useFamily } from "../../../shell/family/context/FamilyContext";
import { CloudRepository } from "./CloudRepository";
import { FamilyCloudRepository } from "./FamilyCloudRepository";
import { LocalRepository } from "./LocalRepository";
import { FinanceRepository } from "./types";

export function useFinanceRepository(): {
  repository: FinanceRepository;
  userId: string | null;
} {
  const { user, isGuest } = useAuth();
  const userId = user?.uid || null;
  const { status, family } = useFamily();

  const repository = useMemo<FinanceRepository>(() => {
    if (isGuest || !userId) {
      return new LocalRepository();
    }
    if (status === "active" && family?.id) {
      return new FamilyCloudRepository(family.id, userId);
    }
    return new CloudRepository(userId);
  }, [isGuest, userId, status, family?.id]);

  return { repository, userId };
}
