import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinFamily } from '../service/family';
import { useAuth } from '../../../context/AuthContext';
import { PAGE_CONTAINER, PAGE_PAD, READING_MAX } from '../../../config/layout';

export const JoinFamilyPage: React.FC = () => {
  const [code, setCode] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!user) return;
    try {
      await joinFamily(user.uid, code);
      navigate('/keluarga');
    } catch (e) {
      alert('Gagal bergabung: ' + e);
    }
  };

  return (
    <div className={`${PAGE_CONTAINER} ${PAGE_PAD} space-y-6 pt-6`}>
      <div className={READING_MAX}>
        <h1 className="text-2xl font-bold text-text">Gabung Keluarga</h1>
        <input 
          value={code} 
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Kode Undangan"
          className="w-full p-2 border border-border rounded"
        />
        <button onClick={handleJoin} className="bg-primary text-white p-2 rounded mt-4">Gabung</button>
      </div>
    </div>
  );
};
