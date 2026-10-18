import { describe, it, expect, beforeEach } from "vitest";
import { validateSavingsGoalInput } from "../../modules/keuangan/utils/validation";
import { LocalRepository } from "../../modules/keuangan/repository/LocalRepository";
import { SavingsGoal } from "../../modules/keuangan/types";

describe("Phase 4: Savings Goals Tests", () => {
  let repo: LocalRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalRepository();
  });

  it("validates savings goal input correctly", () => {
    const valid = validateSavingsGoalInput({ name: "Dana Darurat", targetAmount: 10000000 });
    expect(valid.ok).toBe(true);

    const invalid = validateSavingsGoalInput({ name: "", targetAmount: -500 });
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.targetAmount).toBeDefined();
  });

  it("performs CRUD and clamps currentAmount at 0 on adjustment in LocalRepository", async () => {
    const goal: SavingsGoal = {
      id: "goal1",
      name: "Pendidikan",
      targetAmount: 5000000,
      currentAmount: 1000000
    };

    await repo.upsertSavingsGoal(goal);
    let raw = repo.getRawData();
    expect(raw.savingsGoals.length).toBe(1);
    expect(raw.savingsGoals[0].currentAmount).toBe(1000000);

    // Adjust positive
    await repo.adjustSavingsGoal("goal1", 500000);
    raw = repo.getRawData();
    expect(raw.savingsGoals[0].currentAmount).toBe(1500000);

    // Adjust negative beyond 0 (clamps at 0)
    await repo.adjustSavingsGoal("goal1", -3000000);
    raw = repo.getRawData();
    expect(raw.savingsGoals[0].currentAmount).toBe(0);

    // Delete
    await repo.deleteSavingsGoal("goal1");
    raw = repo.getRawData();
    expect(raw.savingsGoals.length).toBe(0);
  });
});
