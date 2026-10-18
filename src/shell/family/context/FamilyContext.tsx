import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Family, FamilyRole, FamilyMember, MemberInfo } from '../../../types/family';

interface FamilyContextType {
  status: 'loading' | 'none' | 'active';
  family: Family | null;
  role: FamilyRole | null;
  isAdmin: boolean;
  members: MemberInfo[];
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<FamilyContextType>({ status: 'loading', family: null, role: null, isAdmin: false, members: [] });

  useEffect(() => {
    if (!user) {
      setState({ status: 'none', family: null, role: null, isAdmin: false, members: [] });
      return;
    }

    // This is a simplified implementation. 
    // In a real multi-family app, we would query the memberships collection.
    // Assuming one family per user for Phase 2A.
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (userSnap) => {
      const userData = userSnap.data();
      const familyId = userData?.familyId;

      if (!familyId) {
        setState({ status: 'none', family: null, role: null, isAdmin: false, members: [] });
        return;
      }

      const familySnap = await getDoc(doc(db, 'families', familyId));
      if (!familySnap.exists()) {
        setState({ status: 'none', family: null, role: null, isAdmin: false, members: [] });
        return;
      }

      const memberSnap = await getDoc(doc(db, 'families', familyId, 'members', user.uid));
      if (!memberSnap.exists()) {
        setState({ status: 'none', family: null, role: null, isAdmin: false, members: [] });
        return;
      }

      const family = familySnap.data() as Family;
      const member = memberSnap.data() as FamilyMember;
      
      const membersSnap = await getDocs(collection(db, 'families', familyId, 'members'));
      const members = await Promise.all(membersSnap.docs.map(async (mDoc) => {
        const mData = mDoc.data() as FamilyMember;
        const uSnap = await getDoc(doc(db, 'users', mData.uid));
        const uData = uSnap.data();
        return { ...mData, displayName: uData?.displayName || 'Unknown' };
      }));
      
      setState({ 
        status: 'active', 
        family, 
        role: member.role, 
        isAdmin: member.role === 'admin',
        members
      });
    });

    return () => unsubscribe();
  }, [user]);

  return <FamilyContext.Provider value={state}>{children}</FamilyContext.Provider>;
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    return { status: 'none' as const, family: null, role: null, isAdmin: false, members: [] };
  }
  return context;
};
