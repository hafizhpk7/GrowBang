export type FamilyRole = 'admin' | 'member';

export interface FamilyMember {
  uid: string;
  role: FamilyRole;
  joinedAt: string;
}

export interface Family {
  id: string;
  name: string;
  adminUid: string;
  createdAt: string;
}

export interface FamilyInvite {
  code: string;
  fid: string;
  role: FamilyRole;
  createdAt: string;
  expiresAt: string;
}

export interface MemberInfo extends FamilyMember {
  displayName: string;
}
