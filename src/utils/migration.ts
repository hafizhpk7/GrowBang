import { doc, getDoc, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppState } from '../types';

export const migrateBabyData = async (uid: string, familyId: string) => {
  const oldDocRef = doc(db, 'users', uid, 'appData', 'current');
  const oldSnap = await getDoc(oldDocRef);

  if (!oldSnap.exists()) {
    console.log('No legacy data to migrate.');
    return;
  }

  const data = oldSnap.data() as AppState;
  const batch = writeBatch(db);

  data.profiles.forEach(profile => {
    const newDocRef = doc(db, 'families', familyId, 'babies', profile.id);
    batch.set(newDocRef, profile);
  });

  await batch.commit();
  await deleteDoc(oldDocRef);
  console.log('Migration successful.');
};
