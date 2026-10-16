import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useFamily } from "../../../shell/family/context/FamilyContext";
import { CloudRepository } from "./CloudRepository";
import { LocalRepository } from "./LocalRepository";
import { FinanceRepository } from "./types";

export function useFinanceRepository(): {
  repository: FinanceRepository;
  userId: string | null;
} {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const { family } = useFamily();
  
  const repository = useMemo<FinanceRepository>(() => {
    if (userId) {
      return new CloudRepository(userId, family?.id);
    }
    return new LocalRepository();
  }, [userId, family?.id]);

  return { repository, userId };
}
