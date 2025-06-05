import { ProfileData } from '../../../types/profile';

export function useProfileStorage() {
// localStorage에 프로필 저장
const saveProfileToStorage = (profileData: ProfileData) => {
    try {
    localStorage.setItem('ProfileData', JSON.stringify(profileData));
    console.log('프로필이 localStorage에 저장되었습니다:', profileData);
    } catch (error) {
    console.error('프로필 저장 중 오류:', error);
    }
};

// localStorage에서 프로필 로드
const loadProfileFromStorage = (): ProfileData | null => {
    try {
    const stored = localStorage.getItem('ProfileData');
    if (stored) {
        const profileData = JSON.parse(stored) as ProfileData;
        console.log('localStorage에서 프로필을 불러왔습니다:', profileData);
        return profileData;
    }
    } catch (error) {
    console.error('프로필 로드 중 오류:', error);
    }
    return null;
};

// 프로필 만료 여부 확인 (7일 기준)
const isProfileExpired = (profileData: ProfileData): boolean => {
    const updatedAt = new Date(profileData.updated_at);
    const now = new Date();
    const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7; // 7일 이상 지나면 만료
};

// UUID 생성
const generateProfileId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
};

// 프로필 삭제
const deleteProfileFromStorage = () => {
    try {
    localStorage.removeItem('ProfileData');
    console.log('프로필이 localStorage에서 삭제되었습니다');
    } catch (error) {
    console.error('프로필 삭제 중 오류:', error);
    }
};

return {
    saveProfileToStorage,
    loadProfileFromStorage,
    isProfileExpired,
    generateProfileId,
    deleteProfileFromStorage,
};
} 