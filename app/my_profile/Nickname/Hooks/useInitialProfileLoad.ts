import { useEffect, useRef } from 'react';
import { ProfileData } from '../../../types/profile'; 

interface UseInitialProfileLoadProps {
loadProfileFromStorage: () => ProfileData | null;
isProfileExpired: (profile: ProfileData) => boolean;
generateProfile: () => Promise<void>;
setProfile: React.Dispatch<React.SetStateAction<{ nickname: string; description: string }>>;
}

export function useInitialProfileLoad({
loadProfileFromStorage,
isProfileExpired,
generateProfile,
setProfile,
}: UseInitialProfileLoadProps) {
const initialLoadCompleted = useRef(false);

useEffect(() => {
    // 이미 초기 로드가 완료된 경우 실행하지 않음
    if (initialLoadCompleted.current) return;
    
    const loadInitialProfile = async () => {
    const storedProfile = loadProfileFromStorage();
    if (storedProfile && !isProfileExpired(storedProfile)) {
        console.log('[useInitialProfileLoad] 저장된 프로필을 불러왔습니다:', storedProfile);
        setProfile({
        nickname: storedProfile.nickname,
        description: storedProfile.description
        });
        initialLoadCompleted.current = true;
        return;
    }
    // 저장된 프로필이 없거나(새로운 업데이트일경우) 만료된 경우에만 새로 생성
    console.log('[useInitialProfileLoad] 새로운 프로필을 생성합니다.');
    await generateProfile();
    initialLoadCompleted.current = true;
    };
    
    loadInitialProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
}, [loadProfileFromStorage, isProfileExpired, generateProfile, setProfile]); // 의존성 배열에 함수들을 포함합니다.
} 