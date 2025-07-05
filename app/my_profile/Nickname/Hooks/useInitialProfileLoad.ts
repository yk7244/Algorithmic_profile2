import { useEffect, useRef } from 'react';
import { ProfileData } from '../../../types/profile'; 

interface UseInitialProfileLoadProps {
  loadProfileFromStorage: () => ProfileData | null;
  generateProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<{ nickname: string; description: string }>>;
}

export function useInitialProfileLoad({
  loadProfileFromStorage,
  generateProfile,
  setProfile,
}: UseInitialProfileLoadProps) {
  const initialLoadCompleted = useRef(false);

  useEffect(() => {
    if (initialLoadCompleted.current) return;

    const loadInitialProfile = async () => {
      const storedProfile = loadProfileFromStorage();
      if (storedProfile) {
        console.log('[useInitialProfileLoad] 저장된 프로필을 불러왔습니다:', storedProfile);
        setProfile({
          nickname: storedProfile.nickname,
          description: storedProfile.description
        });
        initialLoadCompleted.current = true;
        return;
      }
      // 저장된 프로필이 없을 때만 새로 생성
      console.log('[useInitialProfileLoad] 새로운 프로필을 생성합니다.');
      await generateProfile();
      initialLoadCompleted.current = true;
    };

    loadInitialProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [loadProfileFromStorage, generateProfile, setProfile]);
} 