import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { PAGE_CONTAINER, PAGE_PAD, READING_MAX } from '../../../config/layout';

export const FamilyPage: React.FC = () => {
  const { family, status, role } = useFamily();

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className={`${PAGE_CONTAINER} ${PAGE_PAD} space-y-6 pt-6`}>
      <div className={READING_MAX}>
        <h1 className="text-2xl font-bold text-text">Manajemen Keluarga</h1>
        
        {status === 'none' ? (
          <div className="bg-surface p-6 rounded-lg border border-border">
            <p className="text-text-2">Anda belum bergabung dengan keluarga mana pun.</p>
            {/* Add create/join buttons */}
          </div>
        ) : (
          <div className="bg-surface p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-text">{family?.name}</h2>
            <p className="text-text-2">Peran: {role}</p>
          </div>
        )}
      </div>
    </div>
  );
};
