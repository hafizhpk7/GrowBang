import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { CloudRepository } from "./CloudRepository";
import { LocalRepository } from "./LocalRepository";
import { FinanceRepository } from "./types";

export function useFinanceRepository(): {
  repository: FinanceRepository;
  userId: string | null;
} {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const repository = useMemo<FinanceRepository>(() => {
    if (userId) {
      return new CloudRepository(userId);
    }
    return new LocalRepository();
  }, [userId]);

  return { repository, userId };
}
