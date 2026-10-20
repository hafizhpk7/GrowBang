import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  Timestamp
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../../../services/firebase";
import {
  Family,
  FamilyAction,
  Invite,
  Member,
  Relation,
  Role,
  FAMILY_DATA_COLLECTIONS,
  INVITE_CREATE_KEYS,
  INVITE_MAX_DAYS
} from "../types";
import {
  generateInviteCode,
  inviteStatus,
  normalizeInviteCode
} from "../utils";

// Helper to remove any undefined properties
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
}

export async function createFamily(
  user: User,
  params: { name: string; relation: Relation; displayName: string }
): Promise<string> {
  const uid = user.uid;
  const membershipRef = doc(db, "users", uid, "membership", "current");

  // Pre-check: user cannot already be in a family
  const membershipSnap = await getDoc(membershipRef);
  if (membershipSnap.exists()) {
    throw new Error("Anda sudah tergabung di sebuah keluarga. Keluar dulu untuk bergabung ke keluarga lain.");
  }

  const fid = crypto.randomUUID();
  const now = new Date().toISOString();

  const familyDoc: Family = {
    id: fid,
    name: params.name.trim(),
    ownerId: uid,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1
  };

  const memberDoc: Member = {
    uid,
    familyId: fid,
    displayName: params.displayName.trim() || user.displayName || "Anggota",
    relation: params.relation,
    role: "admin",
    isOwner: true,
    joinedAt: now,
    updatedAt: now
  };

  const membershipDoc = {
    uid,
    familyId: fid,
    createdAt: now
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "families", fid), cleanPayload(familyDoc));
  batch.set(doc(db, "families", fid, "members", uid), cleanPayload(memberDoc));
  batch.set(membershipRef, cleanPayload(membershipDoc));

  try {
    await batch.commit();
    return fid;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}`);
  }
}

export async function previewInvite(rawCode: string): Promise<{ invite: Invite; status: "valid" | "used" | "expired" }> {
  const code = normalizeInviteCode(rawCode);
  if (!code) {
    throw new Error("Kode undangan tidak ditemukan.");
  }

  try {
    const inviteRef = doc(db, "invites", code);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) {
      throw new Error("Kode undangan tidak ditemukan.");
    }

    const data = snap.data();
    const expiresAt = data.expiresAt instanceof Timestamp
      ? data.expiresAt.toDate().toISOString()
      : typeof data.expiresAt === "string"
      ? data.expiresAt
      : new Date().toISOString();

    const invite: Invite = {
      code: data.code || code,
      familyId: data.familyId,
      familyName: data.familyName,
      createdBy: data.createdBy,
      relation: data.relation,
      role: data.role,
      createdAt: data.createdAt,
      expiresAt,
      used: Boolean(data.used),
      usedBy: data.usedBy,
      usedAt: data.usedAt
    };

    const status = inviteStatus(invite);
    return { invite, status };
  } catch (err: any) {
    if (err.message && err.message.includes("Kode undangan")) {
      throw err;
    }
    handleFirestoreError(err, OperationType.GET, `invites/${code}`);
  }
}

export async function joinFamily(
  user: User,
  rawCode: string,
  displayName: string
): Promise<string> {
  const uid = user.uid;
  const membershipRef = doc(db, "users", uid, "membership", "current");

  // Pre-check 1: not already in a family
  const membershipSnap = await getDoc(membershipRef);
  if (membershipSnap.exists()) {
    throw new Error("Anda sudah tergabung di sebuah keluarga. Keluar dulu untuk bergabung ke keluarga lain.");
  }

  // Pre-check 2: invite must exist and be valid
  const { invite, status } = await previewInvite(rawCode);
  if (status === "used") {
    throw new Error("Kode undangan sudah dipakai.");
  }
  if (status === "expired") {
    throw new Error("Kode undangan sudah kedaluwarsa.");
  }
  if (status !== "valid") {
    throw new Error("Kode undangan tidak ditemukan.");
  }

  const now = new Date().toISOString();
  const fid = invite.familyId;
  const code = invite.code;

  const memberDoc: Member = {
    uid,
    familyId: fid,
    displayName: displayName.trim() || user.displayName || "Anggota",
    relation: invite.relation,
    role: invite.role,
    isOwner: false,
    joinedAt: now,
    updatedAt: now,
    inviteCode: code
  };

  const membershipDoc = {
    uid,
    familyId: fid,
    createdAt: now
  };

  const inviteUpdate = {
    used: true,
    usedBy: uid,
    usedAt: now
  };

  const batch = writeBatch(db);
  batch.update(doc(db, "invites", code), inviteUpdate);
  batch.set(doc(db, "families", fid, "members", uid), cleanPayload(memberDoc));
  batch.set(membershipRef, cleanPayload(membershipDoc));

  try {
    await batch.commit();
    return fid;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}/members/${uid}`);
  }
}

export async function leaveFamily(uid: string, fid: string): Promise<void> {
  const memberRef = doc(db, "families", fid, "members", uid);
  const membershipRef = doc(db, "users", uid, "membership", "current");

  // Check client-side if owner
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists() && memberSnap.data()?.isOwner) {
    throw new Error("Pemilik tidak bisa keluar. Transfer kepemilikan atau hapus keluarga.");
  }

  const batch = writeBatch(db);
  batch.delete(memberRef);
  batch.delete(membershipRef);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}/members/${uid}`);
  }
}

export async function removeMember(fid: string, targetUid: string): Promise<void> {
  const memberRef = doc(db, "families", fid, "members", targetUid);
  const membershipRef = doc(db, "users", targetUid, "membership", "current");

  const batch = writeBatch(db);
  batch.delete(memberRef);
  batch.delete(membershipRef);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}/members/${targetUid}`);
  }
}

export async function setMemberRoleRelation(
  fid: string,
  targetUid: string,
  updates: { role?: Role; relation?: Relation }
): Promise<void> {
  const memberRef = doc(db, "families", fid, "members", targetUid);
  const payload: Record<string, any> = {
    updatedAt: new Date().toISOString()
  };
  if (updates.role) payload.role = updates.role;
  if (updates.relation) payload.relation = updates.relation;

  try {
    await updateDoc(memberRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `families/${fid}/members/${targetUid}`);
  }
}

export async function setOwnDisplayName(fid: string, uid: string, name: string): Promise<void> {
  const memberRef = doc(db, "families", fid, "members", uid);
  try {
    await updateDoc(memberRef, {
      displayName: name.trim(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `families/${fid}/members/${uid}`);
  }
}

export async function renameFamily(fid: string, name: string): Promise<void> {
  const familyRef = doc(db, "families", fid);
  try {
    await updateDoc(familyRef, {
      name: name.trim(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `families/${fid}`);
  }
}

export async function transferOwnership(fid: string, fromUid: string, toUid: string): Promise<void> {
  const now = new Date().toISOString();
  const familyRef = doc(db, "families", fid);
  const fromMemberRef = doc(db, "families", fid, "members", fromUid);
  const toMemberRef = doc(db, "families", fid, "members", toUid);

  const batch = writeBatch(db);
  batch.update(familyRef, { ownerId: toUid, updatedAt: now });
  batch.update(fromMemberRef, { isOwner: false, role: "admin", updatedAt: now });
  batch.update(toMemberRef, { isOwner: true, role: "admin", updatedAt: now });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}`);
  }
}

export async function deleteFamily(fid: string, ownerUid: string): Promise<void> {
  // ORDER MATTERS:
  // 1) for each collection in FAMILY_DATA_COLLECTIONS: delete in batches of <= 400
  for (const collName of FAMILY_DATA_COLLECTIONS) {
    while (true) {
      const q = query(collection(db, "families", fid, collName), limit(400));
      const snaps = await getDocs(q);
      if (snaps.empty) break;

      const batch = writeBatch(db);
      snaps.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // 2) delete financeConfig/main if exists
  const configRef = doc(db, "families", fid, "financeConfig", "main");
  const configSnap = await getDoc(configRef);
  if (configSnap.exists()) {
    await deleteDoc(configRef);
  }

  // 3) query invites where("familyId","==",fid) (NO orderBy) and delete
  while (true) {
    const qInv = query(collection(db, "invites"), where("familyId", "==", fid), limit(400));
    const invSnaps = await getDocs(qInv);
    if (invSnaps.empty) break;

    const batch = writeBatch(db);
    invSnaps.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 4) delete every NON-owner member + pointer in atomic pairs (<= 400 ops = 200 pairs)
  while (true) {
    const qMembers = query(collection(db, "families", fid, "members"), limit(200));
    const memberSnaps = await getDocs(qMembers);
    const nonOwners = memberSnaps.docs.filter((d) => d.id !== ownerUid);
    if (nonOwners.length === 0) break;

    const batch = writeBatch(db);
    nonOwners.forEach((d) => {
      batch.delete(d.ref);
      batch.delete(doc(db, "users", d.id, "membership", "current"));
    });
    await batch.commit();
  }

  // 5) FINAL batch: delete families/{fid}, members/{ownerUid}, users/{ownerUid}/membership/current
  const finalBatch = writeBatch(db);
  finalBatch.delete(doc(db, "families", fid));
  finalBatch.delete(doc(db, "families", fid, "members", ownerUid));
  finalBatch.delete(doc(db, "users", ownerUid, "membership", "current"));

  try {
    await finalBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `families/${fid}`);
  }
}

export async function createInvite(
  fid: string,
  familyName: string,
  createdBy: string,
  params: { relation: Relation; role: Role }
): Promise<Invite> {
  const maxRetries = 5;
  let code = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateInviteCode();
    const candidateRef = doc(db, "invites", candidate);
    const snap = await getDoc(candidateRef);
    if (!snap.exists()) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    throw new Error("Gagal membuat kode undangan. Silakan coba lagi.");
  }

  const now = new Date();
  const expiresDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

  const inviteDoc: Record<string, any> = {
    code,
    familyId: fid,
    familyName,
    createdBy,
    relation: params.relation,
    role: params.role,
    createdAt: now.toISOString(),
    expiresAt: Timestamp.fromDate(expiresDate),
    used: false
  };

  try {
    await setDoc(doc(db, "invites", code), cleanPayload(inviteDoc));
    return {
      code,
      familyId: fid,
      familyName,
      createdBy,
      relation: params.relation,
      role: params.role,
      createdAt: inviteDoc.createdAt,
      expiresAt: expiresDate.toISOString(),
      used: false
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invites/${code}`);
  }
}

export function subscribeInvites(
  fid: string,
  onData: (invites: Invite[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, "invites"), where("familyId", "==", fid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Invite[] = [];
      const now = new Date();
      snap.docs.forEach((d) => {
        const data = d.data();
        const expiresAt = data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate().toISOString()
          : typeof data.expiresAt === "string"
          ? data.expiresAt
          : "";

        const invite: Invite = {
          code: data.code || d.id,
          familyId: data.familyId,
          familyName: data.familyName,
          createdBy: data.createdBy,
          relation: data.relation,
          role: data.role,
          createdAt: data.createdAt,
          expiresAt,
          used: Boolean(data.used),
          usedBy: data.usedBy,
          usedAt: data.usedAt
        };

        // Filter client-side: unused and not expired
        if (!invite.used && new Date(invite.expiresAt).getTime() > now.getTime()) {
          list.push(invite);
        }
      });
      // Sort client-side (createdAt desc)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function revokeInvite(code: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "invites", code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `invites/${code}`);
  }
}

export async function cleanupOrphan(uid: string): Promise<void> {
  const membershipRef = doc(db, "users", uid, "membership", "current");
  const membershipSnap = await getDoc(membershipRef);
  if (!membershipSnap.exists()) return;

  const data = membershipSnap.data();
  const fid = data.familyId;

  if (fid) {
    const memberRef = doc(db, "families", fid, "members", uid);
    try {
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const batch = writeBatch(db);
        batch.delete(memberRef);
        batch.delete(membershipRef);
        await batch.commit();
        return;
      }
    } catch {
      // Ignore if cannot read
    }
  }

  // Delete only pointer
  try {
    await deleteDoc(membershipRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/membership/current`);
  }
}

// 9.4 + I.3: Pure function to merge finance configs
export function mergeFinanceConfigs(familyConfig: any | null, personalConfig: any | null): any {
  const base = familyConfig || {
    schemaVersion: 1,
    customCategories: [],
    budgets: {},
    includeVaccineCosts: false,
    wallets: {}
  };

  if (!personalConfig) return base;

  // 1. Categories: Union by id (keep family on collision, append personal if not present)
  const existingCatIds = new Set((base.customCategories || []).map((c: any) => c.id));
  const mergedCategories = [...(base.customCategories || [])];
  for (const cat of personalConfig.customCategories || []) {
    if (!existingCatIds.has(cat.id)) {
      mergedCategories.push(cat);
      existingCatIds.add(cat.id);
    }
  }

  // 2. Budgets: Keep family budgets, add personal budgets only for categories without a family budget
  const mergedBudgets = { ...(base.budgets || {}) };
  for (const [catId, amount] of Object.entries(personalConfig.budgets || {})) {
    if (mergedBudgets[catId] === undefined) {
      mergedBudgets[catId] = amount;
    }
  }

  // 3. Wallets: Union by id (keep family wallet on collision, default wallet is shared)
  const mergedWallets = { ...(base.wallets || {}) };
  for (const [wId, wallet] of Object.entries(personalConfig.wallets || {})) {
    if (mergedWallets[wId] === undefined) {
      mergedWallets[wId] = wallet;
    }
  }

  // 4. includeVaccineCosts: from family config if defined, else from personal
  const includeVaccineCosts =
    familyConfig?.includeVaccineCosts !== undefined
      ? familyConfig.includeVaccineCosts
      : personalConfig.includeVaccineCosts !== undefined
      ? personalConfig.includeVaccineCosts
      : false;

  return {
    ...base,
    schemaVersion: 1,
    customCategories: mergedCategories,
    budgets: mergedBudgets,
    wallets: mergedWallets,
    includeVaccineCosts
  };
}

// 9.4 + I.3: Migrate personal finance data to family
export async function migratePersonalFinanceToFamily(uid: string, fid: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Migrate Transactions in chunks of <= 200 (200 sets + 200 deletes = 400 ops)
  while (true) {
    const q = query(collection(db, "users", uid, "financeTransactions"), limit(200));
    const snaps = await getDocs(q);
    if (snaps.empty) break;

    const batch = writeBatch(db);
    snaps.docs.forEach((d) => {
      const data = d.data();
      const targetRef = doc(db, "families", fid, "financeTransactions", d.id);
      batch.set(
        targetRef,
        cleanPayload({
          ...data,
          familyId: fid,
          createdBy: data.createdBy || uid,
          updatedBy: uid
        })
      );
      batch.delete(d.ref);
    });
    await batch.commit();
  }

  // 2. Migrate Savings Goals (copy by id, skip existing)
  while (true) {
    const q = query(collection(db, "users", uid, "savingsGoals"), limit(100));
    const snaps = await getDocs(q);
    if (snaps.empty) break;

    const batch = writeBatch(db);
    for (const d of snaps.docs) {
      const targetRef = doc(db, "families", fid, "savingsGoals", d.id);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) {
        batch.set(targetRef, cleanPayload({ ...d.data(), createdBy: d.data().createdBy || uid }));
      }
      batch.delete(d.ref);
    }
    await batch.commit();
  }

  // 3. Migrate Recurring Rules (copy by id, skip existing)
  while (true) {
    const q = query(collection(db, "users", uid, "recurringRules"), limit(100));
    const snaps = await getDocs(q);
    if (snaps.empty) break;

    const batch = writeBatch(db);
    for (const d of snaps.docs) {
      const targetRef = doc(db, "families", fid, "recurringRules", d.id);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) {
        batch.set(targetRef, cleanPayload({ ...d.data(), createdBy: d.data().createdBy || uid }));
      }
      batch.delete(d.ref);
    }
    await batch.commit();
  }

  // 4. Migrate and merge Config
  const personalConfigRef = doc(db, "users", uid, "financeConfig", "main");
  const familyConfigRef = doc(db, "families", fid, "financeConfig", "main");

  const personalConfigSnap = await getDoc(personalConfigRef);
  if (personalConfigSnap.exists()) {
    const familyConfigSnap = await getDoc(familyConfigRef);
    const merged = mergeFinanceConfigs(
      familyConfigSnap.exists() ? familyConfigSnap.data() : null,
      personalConfigSnap.data()
    );

    await setDoc(
      familyConfigRef,
      cleanPayload({
        ...merged,
        familyId: fid,
        updatedAt: now,
        updatedBy: uid
      })
    );

    // Delete personal config doc only after successful write
    await deleteDoc(personalConfigRef);
  }
}
