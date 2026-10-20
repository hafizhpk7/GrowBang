import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  Copy,
  Share2,
  Trash2,
  Shield,
  Crown,
  Edit2,
  LogOut,
  AlertTriangle,
  X,
  ExternalLink,
  Check,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/common/Toast";
import { useFamily, useFamilyMembers, useFamilyInvites } from "../context/FamilyContext";
import {
  Member,
  Invite,
  Relation,
  Role,
  RELATIONS,
  RELATION_LABELS,
  ROLE_LABELS,
  MAX_FAMILY_MEMBERS_SOFT
} from "../types";
import {
  can,
  defaultRoleForRelation,
  formatInviteCode,
  buildInviteLink,
  normalizeInviteCode,
  resolveDefaultDisplayName,
  validateFamilyName,
  validateDisplayName
} from "../utils";
import * as familyService from "../service/family";
import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { db } from "../../../services/firebase";

export const FamilyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();
  const {
    status,
    family,
    me,
    isAdmin,
    isOwner,
    notice,
    actions,
    dismissNotice
  } = useFamily();

  const { members, loading: loadingMembers } = useFamilyMembers(family?.id);
  const { invites } = useFamilyInvites(family?.id);

  // Creation form state
  const [createName, setCreateName] = useState("");
  const [createRelation, setCreateRelation] = useState<Relation | "">("");
  const [createDisplayName, setCreateDisplayName] = useState(resolveDefaultDisplayName(user));
  const [migrateDataChecked, setMigrateDataChecked] = useState(true);
  const [hasPersonalCloudData, setHasPersonalCloudData] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Edit / modal state
  const [editingName, setEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");

  const [selfNameModalOpen, setSelfNameModalOpen] = useState(false);
  const [selfNameInput, setSelfNameInput] = useState("");

  // Manage member modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberRole, setMemberRole] = useState<Role>("member");
  const [memberRelation, setMemberRelation] = useState<Relation>("saudara");

  // Invite creation modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRelation, setInviteRelation] = useState<Relation>("saudara");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [roleManuallyChanged, setRoleManuallyChanged] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Confirm dialogs state
  const [confirmModal, setConfirmModal] = useState<{
    type: "leave" | "remove" | "transfer" | "delete";
    target?: Member;
  } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Check if personal cloud data exists (for migrate checkbox)
  useEffect(() => {
    if (user && status === "none") {
      setCreateDisplayName(resolveDefaultDisplayName(user));
      const checkPersonal = async () => {
        try {
          const q = query(collection(db, "users", user.uid, "financeTransactions"), limit(1));
          const txSnap = await getDocs(q);
          if (!txSnap.empty) {
            setHasPersonalCloudData(true);
            return;
          }
          const cfgSnap = await getDoc(doc(db, "users", user.uid, "financeConfig", "main"));
          setHasPersonalCloudData(cfgSnap.exists());
        } catch {
          setHasPersonalCloudData(false);
        }
      };
      checkPersonal();
    }
  }, [user, status]);

  // Copy helper
  const copyToClipboard = async (text: string, msg = "Kode disalin.") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(msg);
    } catch {
      showToast("Gagal menyalin teks.");
    }
  };

  // Handlers
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateFamilyName(createName);
    if (nameErr) {
      showToast(nameErr);
      return;
    }
    if (!createRelation) {
      showToast("Pilih hubungan Anda dalam keluarga.");
      return;
    }
    const displayErr = validateDisplayName(createDisplayName);
    if (displayErr) {
      showToast(displayErr);
      return;
    }

    setCreating(true);
    try {
      const fid = await actions.createFamily({
        name: createName,
        relation: createRelation,
        displayName: createDisplayName
      });

      if (hasPersonalCloudData && migrateDataChecked && user) {
        try {
          await familyService.migratePersonalFinanceToFamily(user.uid, fid);
          showToast("Data keuangan pribadi dipindahkan ke keluarga.");
        } catch (mErr) {
          console.warn("Migration warning:", mErr);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!family || !user) return;
    setCreatingInvite(true);
    try {
      const inv = await familyService.createInvite(family.id, family.name, user.uid, {
        relation: inviteRelation,
        role: inviteRole
      });
      setCreatedInvite(inv);
      showToast("Undangan dibuat.");
    } catch (err: any) {
      showToast(err.message || "Gagal membuat undangan.");
    } finally {
      setCreatingInvite(false);
    }
  };

  // RENDER: Loading
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg text-text pb-12">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 text-text-2 hover:text-text rounded-full" aria-label="Kembali ke Beranda utama">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Keluarga</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-6 space-y-4">
          <div className="h-32 bg-surface animate-pulse rounded-2xl border border-border" />
          <div className="h-48 bg-surface animate-pulse rounded-2xl border border-border" />
        </main>
      </div>
    );
  }

  // RENDER: Guest
  if (isGuest || !user) {
    return (
      <div className="min-h-screen bg-bg text-text pb-12">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 text-text-2 hover:text-text rounded-full" aria-label="Kembali ke Beranda utama">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Keluarga</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-6">
          <div className="p-6 bg-surface border border-border rounded-2xl text-center space-y-3">
            <Users className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold">Akun Diperlukan</h2>
            <p className="text-[13px] text-text-2 max-w-sm mx-auto">
              Mode tamu tidak dapat membuat atau bergabung ke keluarga. Masuk dengan akun terdaftar untuk berbagi catatan imunisasi dan keuangan.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // RENDER: Orphaned
  if (status === "orphaned") {
    return (
      <div className="min-h-screen bg-bg text-text pb-12">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 text-text-2 hover:text-text rounded-full" aria-label="Kembali ke Beranda utama">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Keluarga</h1>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-6">
          <div className="p-6 bg-surface border border-warning/40 rounded-2xl text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-warning mx-auto" />
            <h2 className="text-base font-bold">
              {notice === "family-deleted" ? "Keluarga ini sudah dihapus." : "Keanggotaan keluarga Anda tidak valid."}
            </h2>
            <p className="text-[13px] text-text-2">
              Status keanggotaan Anda perlu dibersihkan sebelum dapat membuat atau bergabung ke keluarga baru.
            </p>
            <button
              type="button"
              onClick={() => actions.cleanupOrphan()}
              className="px-5 py-2.5 bg-primary text-primary-text font-semibold rounded-xl text-[14px] hover:bg-primary-hover transition min-h-[44px] cursor-pointer"
            >
              Bersihkan keanggotaan
            </button>
          </div>
        </main>
      </div>
    );
  }

  // RENDER: None (Signed In, No Family)
  if (status === "none" || !family) {
    return (
      <div className="min-h-screen bg-bg text-text pb-12">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 text-text-2 hover:text-text rounded-full" aria-label="Kembali ke Beranda utama">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Keluarga</h1>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
          {/* Dismissible banner for removed/deleted notice */}
          {notice && (
            <div className="p-4 rounded-xl border border-warning/40 bg-warning-tint text-text text-[13px] flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p>
                  {notice === "removed"
                    ? "Anda tidak lagi tergabung di keluarga ini."
                    : "Keluarga ini sudah dihapus."}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissNotice}
                className="p-1 rounded-md text-text-2 hover:text-text transition cursor-pointer"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Card 1: Buat Keluarga */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary-tint flex items-center justify-center text-primary-text">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold">Buat Keluarga</h2>
                <p className="text-[12px] text-text-2">Kelola catatan dan keuangan bersama pasangan atau wali.</p>
              </div>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="create-family-name" className="block text-[13px] font-semibold text-text">
                  Nama Keluarga
                </label>
                <input
                  id="create-family-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="misal: Keluarga Ardiansyah"
                  maxLength={80}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-family-relation" className="block text-[13px] font-semibold text-text">
                  Hubungan Anda dalam keluarga
                </label>
                <select
                  id="create-family-relation"
                  value={createRelation}
                  onChange={(e) => setCreateRelation(e.target.value as Relation)}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  <option value="" disabled>
                    Pilih hubungan
                  </option>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {RELATION_LABELS[r]} {r === "ayah" || r === "ibu" ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-family-display-name" className="block text-[13px] font-semibold text-text">
                  Nama Tampilan
                </label>
                <input
                  id="create-family-display-name"
                  type="text"
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  placeholder="Nama Anda"
                  maxLength={80}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              {hasPersonalCloudData && (
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={migrateDataChecked}
                    onChange={(e) => setMigrateDataChecked(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-[13px] text-text-2 leading-relaxed">
                    Pindahkan data keuangan pribadi saya ke keluarga
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={creating || !createName.trim() || !createRelation || !createDisplayName.trim()}
                className="w-full py-2.5 px-4 bg-primary text-primary-text font-semibold rounded-xl text-[14px] hover:bg-primary-hover disabled:opacity-50 transition min-h-[44px] cursor-pointer"
              >
                {creating ? "Membuat..." : "Buat keluarga"}
              </button>
            </form>
          </div>

          {/* Card 2: Gabung dengan Kode */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold">Gabung dengan Kode</h2>
            <p className="text-[12px] text-text-2">
              Sudah menerima kode undangan dari keluarga? Masukkan kode untuk bergabung.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(formatInviteCode(e.target.value.toUpperCase()))}
                placeholder="XXXXX-XXXXX"
                maxLength={11}
                className="flex-1 px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl font-mono text-center text-[14px] uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => {
                  const norm = normalizeInviteCode(joinCodeInput);
                  if (norm) {
                    navigate(`/gabung/${norm}`);
                  } else {
                    showToast("Format kode undangan tidak valid.");
                  }
                }}
                disabled={normalizeInviteCode(joinCodeInput).length !== 10}
                className="px-5 py-2.5 bg-surface-sunken text-text hover:bg-border font-semibold rounded-xl text-[14px] transition disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                Gabung
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // RENDER: Active Family
  return (
    <div className="min-h-screen bg-bg text-text pb-16">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 text-text-2 hover:text-text rounded-full" aria-label="Kembali ke Beranda utama">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold line-clamp-1">{family.name}</h1>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-text-2 font-medium">Keluarga</span>
                <span>•</span>
                <span className="font-semibold text-primary">
                  {isAdmin ? "Admin" : "Anggota"}
                </span>
                {isOwner && (
                  <span className="px-1.5 py-0.2 rounded-sm bg-primary-tint text-primary-text font-semibold text-[10px]">
                    Pemilik
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setNameInputValue(family.name);
                setEditingName(true);
              }}
              className="text-[12px] font-medium text-text-2 hover:text-text p-2 rounded-lg hover:bg-surface transition cursor-pointer"
            >
              Ubah nama keluarga
            </button>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Info Note: Bayi data still per-account */}
        <div className="p-3.5 rounded-xl bg-surface-sunken border border-border text-[12px] text-text-2 flex items-start gap-2.5">
          <span className="shrink-0 font-bold text-text">Catatan:</span>
          <p>Data Bayi masih tersimpan per akun dan belum dibagikan ke keluarga.</p>
        </div>

        {/* Section 1: Members List */}
        <section className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Anggota Keluarga</h2>
              <p className="text-[12px] text-text-2">{members.length} anggota tergabung</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelfNameInput(me?.displayName || "");
                setSelfNameModalOpen(true);
              }}
              className="text-[12px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Ubah nama tampilan
            </button>
          </div>

          <div className="divide-y divide-border">
            {members.map((member) => {
              const isMe = member.uid === user.uid;
              return (
                <div key={member.uid} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-sunken border border-border flex items-center justify-center text-text font-bold text-[13px] shrink-0">
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[14px] text-text truncate max-w-[150px]">
                          {member.displayName}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-surface-sunken text-text-2 font-medium text-[10px] border border-border">
                            Anda
                          </span>
                        )}
                        {member.isOwner && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-primary-tint text-primary-text font-semibold text-[10px] flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>Pemilik</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-text-2">
                        {RELATION_LABELS[member.relation]} • {ROLE_LABELS[member.role]}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin on non-owner member */}
                  {isAdmin && !member.isOwner && !isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberRole(member.role);
                        setMemberRelation(member.relation);
                      }}
                      className="px-3 py-1.5 bg-surface-sunken hover:bg-border text-text rounded-lg text-[12px] font-medium transition cursor-pointer min-h-[36px]"
                    >
                      Kelola
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Invites (Admins only) */}
        {isAdmin && (
          <section className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Undangan</h2>
                <p className="text-[12px] text-text-2">Undang anggota baru ke keluarga</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInviteRelation("saudara");
                  setInviteRole(defaultRoleForRelation("saudara"));
                  setRoleManuallyChanged(false);
                  setCreatedInvite(null);
                  setInviteModalOpen(true);
                }}
                disabled={members.length >= MAX_FAMILY_MEMBERS_SOFT}
                className="px-3.5 py-2 bg-primary text-primary-text font-semibold rounded-xl text-[13px] hover:bg-primary-hover disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Buat undangan</span>
              </button>
            </div>

            {members.length >= MAX_FAMILY_MEMBERS_SOFT && (
              <p className="text-[12px] text-warning bg-warning-tint p-2.5 rounded-lg border border-warning/40">
                Batas wajar anggota keluarga ({MAX_FAMILY_MEMBERS_SOFT} anggota) telah tercapai.
              </p>
            )}

            {invites.length === 0 ? (
              <p className="text-[13px] text-text-2 py-2">Belum ada undangan aktif.</p>
            ) : (
              <div className="divide-y divide-border">
                {invites.map((inv) => (
                  <div key={inv.code} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-[15px] tracking-wider text-text">
                        {formatInviteCode(inv.code)}
                      </span>
                      <p className="text-[11px] text-text-2">
                        Sebagai {RELATION_LABELS[inv.relation]} ({ROLE_LABELS[inv.role]}) • Berlaku sampai{" "}
                        {new Date(inv.expiresAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formatInviteCode(inv.code))}
                        title="Salin kode"
                        className="p-2 rounded-lg hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer min-h-[36px]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(buildInviteLink(inv.code), "Tautan disalin.")}
                        title="Salin tautan"
                        className="p-2 rounded-lg hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer min-h-[36px]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("Cabut undangan ini?")) {
                            await familyService.revokeInvite(inv.code);
                            showToast("Undangan dicabut.");
                          }
                        }}
                        title="Cabut undangan"
                        className="p-2 rounded-lg hover:bg-danger-tint text-danger transition cursor-pointer min-h-[36px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Section 3: Danger Zone */}
        <section className="bg-surface border border-danger/30 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-danger">Area Berbahaya</h2>

          {!isOwner ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <span className="font-semibold text-[14px]">Keluar dari keluarga</span>
                <p className="text-[12px] text-text-2">
                  Anda tidak akan bisa lagi melihat data keuangan keluarga ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal({ type: "leave" })}
                className="px-4 py-2 bg-danger-tint text-danger hover:bg-danger/20 font-semibold rounded-xl text-[13px] transition cursor-pointer shrink-0 min-h-[40px]"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <p className="text-[12px] text-text-2">
                Pemilik tidak bisa keluar. Transfer kepemilikan atau hapus keluarga.
              </p>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <span className="font-semibold text-[14px]">Transfer kepemilikan</span>
                  <p className="text-[12px] text-text-2">Alihkan hak pemilik ke anggota admin lain.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ type: "transfer" })}
                  disabled={members.length <= 1}
                  className="px-4 py-2 bg-surface-sunken hover:bg-border text-text font-semibold rounded-xl text-[13px] transition cursor-pointer shrink-0 disabled:opacity-50 min-h-[40px]"
                >
                  Transfer
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <div>
                  <span className="font-semibold text-[14px] text-danger">Hapus keluarga</span>
                  <p className="text-[12px] text-text-2">
                    Menghapus data keuangan, undangan, dan keanggotaan untuk SEMUA anggota.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmName("");
                    setConfirmModal({ type: "delete" });
                  }}
                  className="px-4 py-2 bg-danger text-white font-semibold rounded-xl text-[13px] hover:bg-red-700 transition cursor-pointer shrink-0 min-h-[40px]"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal: Rename Family */}
      {editingName && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Ubah Nama Keluarga</h3>
            <input
              type="text"
              value={nameInputValue}
              onChange={(e) => setNameInputValue(e.target.value)}
              maxLength={80}
              className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="flex-1 py-2 bg-surface-sunken rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const err = validateFamilyName(nameInputValue);
                  if (err) {
                    showToast(err);
                    return;
                  }
                  await actions.renameFamily(nameInputValue);
                  setEditingName(false);
                }}
                className="flex-1 py-2 bg-primary text-primary-text rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Self Display Name */}
      {selfNameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Ubah Nama Tampilan</h3>
            <input
              type="text"
              value={selfNameInput}
              onChange={(e) => setSelfNameInput(e.target.value)}
              maxLength={80}
              className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelfNameModalOpen(false)}
                className="flex-1 py-2 bg-surface-sunken rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const err = validateDisplayName(selfNameInput);
                  if (err) {
                    showToast(err);
                    return;
                  }
                  await actions.setOwnDisplayName(selfNameInput);
                  setSelfNameModalOpen(false);
                }}
                className="flex-1 py-2 bg-primary text-primary-text rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Member Role / Relation */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Kelola Anggota</h3>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1 text-text-2 hover:text-text rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-text font-semibold">{selectedMember.displayName}</p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-text-2">Hubungan</label>
                <select
                  value={memberRelation}
                  onChange={(e) => setMemberRelation(e.target.value as Relation)}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl text-[13px] min-h-[40px]"
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {RELATION_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-text-2">Peran</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl text-[13px] min-h-[40px]"
                >
                  <option value="member">Anggota (Mode lihat saja)</option>
                  <option value="admin">Admin (Dapat mencatat & mengubah)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  await actions.setMemberRoleRelation(selectedMember.uid, {
                    role: memberRole,
                    relation: memberRelation
                  });
                  setSelectedMember(null);
                }}
                className="w-full py-2.5 bg-primary text-primary-text rounded-xl text-[14px] font-semibold min-h-[44px] cursor-pointer"
              >
                Simpan Perubahan
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedMember;
                  setSelectedMember(null);
                  setConfirmModal({ type: "remove", target });
                }}
                className="w-full py-2 text-danger hover:bg-danger-tint rounded-xl text-[13px] font-semibold transition cursor-pointer min-h-[40px]"
              >
                Keluarkan Anggota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Invite */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Buat Undangan Baru</h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 text-text-2 hover:text-text rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdInvite ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-2">Hubungan</label>
                  <select
                    value={inviteRelation}
                    onChange={(e) => {
                      const rel = e.target.value as Relation;
                      setInviteRelation(rel);
                      if (!roleManuallyChanged) {
                        setInviteRole(defaultRoleForRelation(rel));
                      }
                    }}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl text-[13px] min-h-[40px]"
                  >
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>
                        {RELATION_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-text-2">Peran</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => {
                      setInviteRole(e.target.value as Role);
                      setRoleManuallyChanged(true);
                    }}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl text-[13px] min-h-[40px]"
                  >
                    <option value="member">Anggota (Mode lihat saja)</option>
                    <option value="admin">Admin (Dapat mencatat & mengubah)</option>
                  </select>
                </div>

                <p className="text-[11px] text-text-2">
                  Kode undangan akan berlaku selama 48 jam dan hanya dapat digunakan sekali.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 py-2 bg-surface-sunken rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                    className="flex-1 py-2 bg-primary text-primary-text rounded-xl text-[14px] font-semibold min-h-[40px] cursor-pointer"
                  >
                    {creatingInvite ? "Membuat..." : "Buat"}
                  </button>
                </div>
              </div>
            ) : (
              /* Created invite success view */
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-primary-tint rounded-full flex items-center justify-center mx-auto text-primary">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] text-text-2">Kode Undangan:</span>
                  <p className="text-2xl font-mono font-bold tracking-widest text-text">
                    {formatInviteCode(createdInvite.code)}
                  </p>
                  <p className="text-[11px] text-text-2 mt-1">
                    Berlaku sampai{" "}
                    {new Date(createdInvite.expiresAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formatInviteCode(createdInvite.code))}
                    className="w-full py-2.5 bg-primary text-primary-text rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin kode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(buildInviteLink(createdInvite.code), "Tautan disalin.")}
                    className="w-full py-2.5 bg-surface-sunken text-text hover:bg-border rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Salin tautan</span>
                  </button>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: `Undangan Bergabung Keluarga ${family?.name}`,
                            text: `Yuk gabung ke keluarga ${family?.name} di Kula dengan kode: ${formatInviteCode(
                              createdInvite.code
                            )}`,
                            url: buildInviteLink(createdInvite.code)
                          });
                        } catch {
                          // cancelled or unsupported
                        }
                      }}
                      className="w-full py-2 text-text-2 hover:text-text rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Bagikan</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-danger">Konfirmasi Tindakan</h3>

            {confirmModal.type === "leave" && (
              <p className="text-[13px] text-text-2 leading-relaxed">
                Keluar dari keluarga {family?.name}? Anda tidak akan bisa lagi melihat data keuangan keluarga ini. Anda bisa
                mengunduh datanya dulu dari menu Keuangan Keluarga &gt; Pengaturan.
              </p>
            )}

            {confirmModal.type === "remove" && confirmModal.target && (
              <p className="text-[13px] text-text-2 leading-relaxed">
                Keluarkan {confirmModal.target.displayName} dari keluarga? Mereka tidak akan bisa melihat data keluarga lagi.
              </p>
            )}

            {confirmModal.type === "transfer" && (
              <div className="space-y-3">
                <p className="text-[13px] text-text-2 leading-relaxed">
                  Pilih anggota yang akan menjadi pemilik baru keluarga. Anda akan tetap menjadi admin.
                </p>
                <select
                  id="transfer-target-select"
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl text-[13px] min-h-[40px]"
                  onChange={(e) => {
                    const targetUid = e.target.value;
                    const found = members.find((m) => m.uid === targetUid);
                    setConfirmModal({ type: "transfer", target: found });
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Pilih anggota
                  </option>
                  {members
                    .filter((m) => m.uid !== user?.uid)
                    .map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.displayName} ({RELATION_LABELS[m.relation]})
                      </option>
                    ))}
                </select>
                {confirmModal.target && (
                  <p className="text-[12px] text-text-2">
                    Pindahkan kepemilikan ke {confirmModal.target.displayName}? {confirmModal.target.displayName} akan
                    menjadi pemilik dan admin. Anda tetap menjadi admin.
                  </p>
                )}
              </div>
            )}

            {confirmModal.type === "delete" && (
              <div className="space-y-3">
                <p className="text-[13px] text-text-2 leading-relaxed">
                  Hapus keluarga {family?.name}? Semua data keuangan keluarga, undangan, dan keanggotaan akan dihapus
                  permanen untuk SEMUA anggota. Data Bayi tidak ikut terhapus. Ketik nama keluarga untuk mengonfirmasi.
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={family?.name}
                  className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] min-h-[44px]"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-surface-sunken rounded-xl text-[14px] font-semibold min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  actionLoading ||
                  (confirmModal.type === "transfer" && !confirmModal.target) ||
                  (confirmModal.type === "delete" && deleteConfirmName.trim() !== family?.name.trim())
                }
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    if (confirmModal.type === "leave") {
                      await actions.leaveFamily();
                      navigate("/keluarga");
                    } else if (confirmModal.type === "remove" && confirmModal.target) {
                      await actions.removeMember(confirmModal.target.uid);
                    } else if (confirmModal.type === "transfer" && confirmModal.target) {
                      await actions.transferOwnership(confirmModal.target.uid);
                    } else if (confirmModal.type === "delete") {
                      await actions.deleteFamily(deleteConfirmName);
                      navigate("/keluarga");
                    }
                    setConfirmModal(null);
                  } catch (err: any) {
                    showToast(err.message || "Gagal melakukan tindakan.");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-[14px] font-semibold hover:bg-red-700 disabled:opacity-50 transition min-h-[44px] cursor-pointer"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPage;
