import {
  FamilyAction,
  Invite,
  InviteStatus,
  Member,
  Relation,
  Role,
  NAME_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH
} from "./types";

export const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars (no I, L, O, 0, 1)

export function generateInviteCode(): string {
  const alphabetLength = INVITE_ALPHABET.length;
  // Use crypto.getRandomValues with rejection sampling to eliminate modulo bias
  const maxValidByte = 256 - (256 % alphabetLength);
  let code = "";

  while (code.length < 10) {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < randomBytes.length && code.length < 10; i++) {
      const byte = randomBytes[i];
      if (byte < maxValidByte) {
        code += INVITE_ALPHABET[byte % alphabetLength];
      }
    }
  }

  return code;
}

export function normalizeInviteCode(input: string): string {
  if (!input) return "";
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, "");
  return cleaned.length === 10 ? cleaned : "";
}

export function formatInviteCode(code: string): string {
  const norm = normalizeInviteCode(code) || code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (norm.length <= 5) return norm;
  return `${norm.slice(0, 5)}-${norm.slice(5, 10)}`;
}

export function buildInviteLink(code: string): string {
  const cleanCode = normalizeInviteCode(code) || code;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  return `${origin}${pathname}#/gabung/${cleanCode}`;
}

export function inviteStatus(invite: Invite, now = new Date()): InviteStatus {
  if (invite.used) return "used";
  const exp = new Date(invite.expiresAt);
  if (exp.getTime() <= now.getTime()) return "expired";
  return "valid";
}

export function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    // 1. Owner first
    if (a.isOwner !== b.isOwner) {
      return a.isOwner ? -1 : 1;
    }
    // 2. Admins before members
    if (a.role !== b.role) {
      return a.role === "admin" ? -1 : 1;
    }
    // 3. Display name case-insensitive A-Z
    const nameCmp = a.displayName.localeCompare(b.displayName, "id-ID", { sensitivity: "base" });
    if (nameCmp !== 0) return nameCmp;
    // 4. UID tie-break
    return a.uid.localeCompare(b.uid);
  });
}

export function defaultRoleForRelation(rel: Relation): Role {
  if (rel === "ayah" || rel === "ibu") {
    return "admin";
  }
  return "member";
}

export function can(me: Member | null, action: FamilyAction): boolean {
  if (!me) return false;

  switch (action) {
    case "finance.read":
      return true; // Any authenticated member
    case "finance.write":
    case "baby.write":
    case "members.manage":
    case "invites.manage":
      return me.role === "admin";
    case "family.rename":
    case "family.transferOwnership":
    case "family.delete":
      return me.isOwner;
    case "family.leave":
      return !me.isOwner;
    case "profile.editSelfName":
      return true;
    default:
      return false;
  }
}

export function validateFamilyName(name: string): string | null {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Nama keluarga wajib diisi";
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Nama keluarga maksimal ${NAME_MAX_LENGTH} karakter`;
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Nama tampilan wajib diisi";
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Nama tampilan maksimal ${DISPLAY_NAME_MAX_LENGTH} karakter`;
  }
  return null;
}

export function isPermissionDenied(err: any): boolean {
  if (!err) return false;
  if (err.code === "permission-denied" || err.code === "firestore/permission-denied") {
    return true;
  }
  const msg = err.message ? String(err.message) : String(err);
  return (
    msg.includes("permission-denied") ||
    msg.includes("Missing or insufficient permissions") ||
    msg.includes("insufficient permissions")
  );
}

export function resolveDefaultDisplayName(user?: { displayName?: string | null; email?: string | null } | null): string {
  if (!user) return "Anggota";
  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.email) {
    const prefix = user.email.split("@")[0];
    if (prefix) return prefix;
  }
  return "Anggota";
}
