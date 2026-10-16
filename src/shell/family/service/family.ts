import { getFirestore, doc, setDoc, getDoc, runTransaction, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Family, FamilyInvite, FamilyMember } from '../../../types/family';

export const createFamily = async (uid: string, name: string): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    const familyRef = doc(collection(db, 'families'));
    const fid = familyRef.id;
    
    transaction.set(familyRef, {
      id: fid,
      name,
      adminUid: uid,
      createdAt: serverTimestamp()
    });
    
    const memberRef = doc(db, 'families', fid, 'members', uid);
    transaction.set(memberRef, {
      uid,
      role: 'admin',
      joinedAt: serverTimestamp()
    });
    
    return fid;
  });
};

export const createInvite = async (fid: string, role: 'admin' | 'member'): Promise<string> => {
  const code = Math.random().toString(36).substring(2, 12).toUpperCase();
  const inviteRef = doc(db, 'invites', code);
  
  await setDoc(inviteRef, {
    code,
    fid,
    role,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  });
  
  return code;
};

export const joinFamily = async (uid: string, code: string): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    const inviteRef = doc(db, 'invites', code);
    const inviteSnap = await transaction.get(inviteRef);
    
    if (!inviteSnap.exists()) throw new Error('Invite invalid');
    
    const invite = inviteSnap.data() as FamilyInvite;
    if (new Date(invite.expiresAt) < new Date()) throw new Error('Invite expired');
    
    const memberRef = doc(db, 'families', invite.fid, 'members', uid);
    transaction.set(memberRef, {
      uid,
      role: invite.role,
      joinedAt: serverTimestamp()
    });
    
    return invite.fid;
  });
};
