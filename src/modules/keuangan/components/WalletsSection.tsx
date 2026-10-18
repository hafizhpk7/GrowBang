import React, { useState } from "react";
import { Plus, Wallet as WalletIcon, Archive, ArchiveRestore, Edit2, Check, X } from "lucide-react";
import { useFinance } from "../state/FinanceContext";

export const WalletsSection: React.FC = () => {
  const { config, addWallet, renameWallet, setWalletArchived } = useFinance();
  const [newWalletName, setNewWalletName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const wallets = Object.values(config.wallets || {});

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await addWallet(newWalletName);
    if (res.ok) {
      setNewWalletName("");
    } else if (res.error) {
      setError(res.error);
    }
  };

  const handleRenameSubmit = async (id: string) => {
    setEditError(null);
    const res = await renameWallet(id, editingName);
    if (res.ok) {
      setEditingId(null);
      setEditingName("");
    } else if (res.error) {
      setEditError(res.error);
    }
  };

  return (
    <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
      <div>
        <h2 className="text-[16px] font-serif font-bold text-text">Dompet (Wallet)</h2>
        <p className="text-[12px] text-text-2">
          Kelola beberapa rekening atau dompet kas (misal: Kas Utama, BCA, GoPay).
        </p>
      </div>

      {/* Add Wallet Form */}
      <form onSubmit={handleAddSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            maxLength={40}
            value={newWalletName}
            onChange={(e) => {
              setNewWalletName(e.target.value);
              setError(null);
            }}
            placeholder="Nama dompet baru (misal: BCA, Dompet Tunai)"
            className={`flex-1 px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
              error ? "border-danger" : "border-border hover:border-border-strong"
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah dompet</span>
          </button>
        </div>
        {error && <p className="text-[12px] text-danger font-medium">{error}</p>}
      </form>

      {/* Wallets List */}
      <div className="divide-y divide-border pt-2">
        {wallets.map((w) => {
          const isEditing = editingId === w.id;
          const isDefault = w.id === "default" || w.isDefault;

          return (
            <div key={w.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-[10px] bg-surface-sunken flex items-center justify-center text-text-2 shrink-0 border border-border">
                  <WalletIcon className="w-4 h-4" />
                </div>
                {isEditing ? (
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={40}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-[14px] rounded-[8px] border border-border bg-surface text-text"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(w.id)}
                        className="p-1.5 rounded-[8px] bg-primary text-primary-fg cursor-pointer"
                        title="Simpan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-[8px] bg-surface-sunken text-text-2 cursor-pointer"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {editError && <p className="text-[11px] text-danger">{editError}</p>}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-text truncate">{w.name}</span>
                      {isDefault && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-tint text-primary-text border border-primary/20">
                          Utama
                        </span>
                      )}
                      {w.archived && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-sunken text-text-3 border border-border">
                          Diarsipkan
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1">
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(w.id);
                        setEditingName(w.name);
                        setEditError(null);
                      }}
                      title="Ubah nama"
                      aria-label="Ubah nama"
                      className="p-1.5 rounded-[8px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => setWalletArchived(w.id, !w.archived)}
                      title={w.archived ? "Pulihkan dompet" : "Arsipkan dompet"}
                      aria-label={w.archived ? "Pulihkan dompet" : "Arsipkan dompet"}
                      className="p-1.5 rounded-[8px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
                    >
                      {w.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
