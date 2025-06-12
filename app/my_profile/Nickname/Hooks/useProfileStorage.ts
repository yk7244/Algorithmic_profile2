import { ProfileData } from '../../../types/profile';
import { saveProfileData, getProfileData, getCurrentUserId, ensureUserExists } from '@/lib/database';

export function useProfileStorage() {
  // DB에 프로필 저장 (fallback으로 localStorage)
  const saveProfileToStorage = async (profileData: ProfileData) => {
    try {
      // 사용자가 users 테이블에 존재하는지 확인하고 없으면 생성
      await ensureUserExists();
      
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // Supabase DB에 저장
      const data = await saveProfileData(userId, profileData);
      console.log('프로필이 DB에 저장되었습니다:', data);
      
      // 🆕 성공적으로 DB에 저장되면 사용자별 localStorage도 업데이트 (캐시 목적)
      localStorage.setItem(`ProfileData_${userId}`, JSON.stringify(profileData));
      
      return data;
    } catch (error) {
      console.error('DB 프로필 저장 실패, localStorage fallback:', error);
      
      // DB 저장 실패 시 localStorage로 fallback
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          localStorage.setItem(`ProfileData_${userId}`, JSON.stringify(profileData));
          console.log('프로필이 사용자별 localStorage에 저장되었습니다 (fallback):', profileData);
        }
      } catch (localError) {
        console.error('localStorage 프로필 저장도 실패:', localError);
        throw localError;
      }
    }
  };

  // DB에서 프로필 로드 (fallback으로 localStorage)
  const loadProfileFromStorage = async (): Promise<ProfileData | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log('로그인되지 않음, 빈 프로필 반환');
        return null; // 🔥 로그인되지 않으면 localStorage 사용하지 않음
      }

      // Supabase DB에서 로드
      const profileData = await getProfileData(userId);
      if (profileData) {
        console.log('DB에서 프로필을 불러왔습니다:', profileData);
        
        // 🆕 사용자별 localStorage 키로 캐시
        localStorage.setItem(`ProfileData_${userId}`, JSON.stringify(profileData));
        
        return profileData;
      } else {
        console.log('DB에 프로필 없음, 사용자별 localStorage 확인');
        return loadFromLocalStorage(userId);
      }
    } catch (error) {
      console.error('DB 프로필 로드 실패, localStorage fallback:', error);
      const userId = await getCurrentUserId();
      return loadFromLocalStorage(userId);
    }
};

  // 🆕 사용자별 localStorage에서 프로필 로드하는 헬퍼 함수
  const loadFromLocalStorage = (userId?: string): ProfileData | null => {
    if (!userId) return null; // 사용자 ID가 없으면 localStorage 사용하지 않음
    
    try {
      const stored = localStorage.getItem(`ProfileData_${userId}`);
    if (stored) {
        const profileData = JSON.parse(stored) as ProfileData;
        console.log(`사용자 ${userId}의 localStorage에서 프로필을 불러왔습니다:`, profileData);
        return profileData;
    }
    } catch (error) {
      console.error('localStorage 프로필 로드 중 오류:', error);
    }
    return null;
};

  // 🆕 동기 버전도 사용자별 키 사용 (기존 호환성 유지)
  const loadProfileFromStorageSync = (): ProfileData | null => {
    // 동기 버전에서는 사용자 ID를 직접 가져올 수 없으므로 deprecated
    console.warn('loadProfileFromStorageSync는 deprecated입니다. loadProfileFromStorage를 사용하세요.');
    return null;
  };

// 프로필 만료 여부 확인 (7일 기준)
const isProfileExpired = (profileData: ProfileData): boolean => {
    const updatedAt = new Date(profileData.updated_at);
    const now = new Date();
    const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7; // 7일 이상 지나면 만료
};

  // UUID 생성 (Supabase에서는 자동 생성되지만 호환성 유지)
const generateProfileId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
};

  // 프로필 삭제 (DB와 localStorage 모두)
  const deleteProfileFromStorage = async () => {
    try {
      // TODO: DB에서 프로필 삭제하는 함수 필요시 추가
      // await deleteProfileData(userId);
      
      // localStorage에서 삭제
    localStorage.removeItem('ProfileData');
      console.log('프로필이 삭제되었습니다');
    } catch (error) {
    console.error('프로필 삭제 중 오류:', error);
    }
};

return {
    saveProfileToStorage,
    loadProfileFromStorage, // async 버전
    loadProfileFromStorageSync, // 기존 동기 버전 (호환성)
    isProfileExpired,
    generateProfileId,
    deleteProfileFromStorage,
};
} 