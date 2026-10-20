import React, { useState } from "react";
import { todayLocal } from "../utils/dates";
import { Plus, Target, Trash2, Edit2, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { formatRupiah } from "../../../utils/calc";
import { useFinance } from "../state/FinanceContext";
import { SavingsGoal } from "../types";
import { SavingsGoalModal } from "../components/SavingsGoalModal";
import { ContributionModal } from "../components/ContributionModal";

export const TabunganPage: React.FC = () => {
  const { savingsGoals, loading, upsertSavingsGoal, deleteSavingsGoal, adjustSavingsGoal } = useFinance();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);
  const [contribMode, setContribMode] = useState<"deposit" | "withdraw">("deposit");

  // Sort goals: unfinished goals by deadline asc (no deadline last), completed goals at bottom
  const sortedGoals = [...(savingsGoals || [])].sort((a, b) => {
    const aComplete = a.currentAmount >= a.targetAmount;
    const bComplete = b.currentAmount >= b.targetAmount;
    if (aComplete !== bComplete) {
      return aComplete ? 1 : -1;
    }
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const getDeadlineStatus = (deadline?: string, current = 0, target = 1) => {
    if (current >= target) {
      return { text: "Tercapai", tone: "bg-success-tint text-success-text border border-success/20" };
    }
    if (!deadline) {
      return { text: "Tanpa tenggat", tone: "bg-surface-sunken text-text-2 border border-border" };
    }
    const today = todayLocal();
    if (deadline < today) {
      return { text: "Lewat tenggat", tone: "bg-danger-tint text-danger border border-danger/20" };
    }
    const diffTime = new Date(deadline).getTime() - new Date(today).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { text: `${diffDays} hari lagi`, tone: "bg-primary-tint text-primary-text border border-primary/20" };
  };

  const getMonthlyNeeded = (goal: SavingsGoal) => {
    if (goal.currentAmount >= goal.targetAmount || !goal.deadline) return null;
    const today = new Date();
    const dead = new Date(goal.deadline);
    const months = (dead.getFullYear() - today.getFullYear()) * 12 + (dead.getMonth() - today.getMonth());
    if (months <= 0) return goal.targetAmount - goal.currentAmount;
    const remaining = goal.targetAmount - goal.currentAmount;
    return Math.ceil(remaining / months);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-serif font-bold text-text">Target Tabungan</h1>
          <p className="text-[13px] text-text-2">
            Pantau progres dana darurat, pendidikan, dan target finansial keluarga.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs min-h-[44px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Tambah target</span>
        </button>
      </div>

      <p className="text-[12px] text-text-3 bg-surface-sunken p-3 rounded-[10px] border border-border">
        Catatan: Kontribusi tabungan dicatat dan dikelola secara terpisah dari buku kas transaksi harian.
      </p>

      {loading ? (
        <div className="py-12 text-center text-text-2 text-[14px]">Memuat target tabungan...</div>
      ) : sortedGoals.length === 0 ? (
        <div className="bg-surface rounded-[12px] border border-border p-12 text-center space-y-3 shadow-card">
          <Target className="w-10 h-10 mx-auto text-text-3" />
          <h2 className="text-[16px] font-serif font-bold text-text">Belum ada target tabungan</h2>
          <p className="text-[13px] text-text-2 max-w-sm mx-auto">
            Mulai buat target finansial pertama Anda untuk memotivasi menabung secara berkala.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-primary text-primary-fg text-[13px] font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat target pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const deadlineStatus = getDeadlineStatus(goal.deadline, goal.currentAmount, goal.targetAmount);
            const monthlyNeeded = getMonthlyNeeded(goal);

            return (
              <div
                key={goal.id}
                className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[16px] font-serif font-bold text-text">{goal.name}</h2>
                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 text-[12px] text-text-2 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Tenggat: {goal.deadline}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${deadlineStatus.tone}`}>
                      {deadlineStatus.text}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[12px] text-text-2">Terkumpul</span>
                      <p className="text-[18px] font-bold font-serif text-text">
                        {formatRupiah(goal.currentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] text-text-2">Target</span>
                      <p className="text-[14px] font-semibold text-text">
                        {formatRupiah(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[12px] font-medium text-text-2">
                      <span>{pct}% tercapai</span>
                      <span>{formatRupiah(Math.max(0, goal.targetAmount - goal.currentAmount))} lagi</span>
                    </div>
                    <div
                      className="w-full bg-surface-sunken h-2.5 rounded-full overflow-hidden border border-border/60"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={goal.targetAmount}
                      aria-valuenow={Math.min(goal.currentAmount, goal.targetAmount)}
                      aria-label={`Progres tabungan ${goal.name}`}
                    >
                      <div
                        className="bg-primary h-full transition-all duration-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {monthlyNeeded !== null && monthlyNeeded > 0 && (
                    <p className="text-[11px] text-text-2 bg-surface-sunken p-2.5 rounded-[8px] border border-border">
                      Saran: Perlu menabung sekitar <span className="font-semibold text-text">{formatRupiah(monthlyNeeded)}</span> per bulan untuk mencapai target tepat waktu.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setContribGoal(goal);
                        setContribMode("deposit");
                        setContribModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-[8px] bg-primary-tint hover:bg-primary/25 text-primary-text font-medium text-[12px] transition cursor-pointer flex items-center gap-1 min-h-[36px]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Setor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContribGoal(goal);
                        setContribMode("withdraw");
                        setContribModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-[8px] bg-surface-sunken hover:bg-border text-text-2 hover:text-text font-medium text-[12px] transition cursor-pointer flex items-center gap-1 min-h-[36px]"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Tarik</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsGoalModalOpen(true);
                      }}
                      title="Edit target"
                      aria-label="Edit target"
                      className="p-1.5 rounded-[8px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus target tabungan "${goal.name}"?`)) {
                          deleteSavingsGoal(goal.id);
                        }
                      }}
                      title="Hapus target"
                      aria-label="Hapus target"
                      className="p-1.5 rounded-[8px] hover:bg-danger-tint text-danger transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={editingGoal}
        onSave={upsertSavingsGoal}
      />

      <ContributionModal
        isOpen={contribModalOpen}
        onClose={() => setContribModalOpen(false)}
        goal={contribGoal}
        mode={contribMode}
        onConfirm={adjustSavingsGoal}
      />
    </div>
  );
};

export default TabunganPage;
