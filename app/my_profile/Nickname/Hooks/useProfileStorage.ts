import { ProfileData } from '../../../types/profile';
import { getUserData } from '../../../utils/get/getUserData';
import { getLatestProfileData } from '../../../utils/get/getProfileData';
import { supabase } from '@/lib/supabase-clean';

// DB에서 프로필 로드 (localStorage 대체)
const loadProfileFromStorage = async (): Promise<ProfileData | null> => {
    try {
        console.warn('loadProfileFromStorage is deprecated. Use getLatestProfileData() instead.');
        const profileData = await getLatestProfileData();
        if (profileData) {
            console.log('✅ DB에서 프로필을 불러왔습니다:', profileData.nickname);
            // DB 데이터를 프론트엔드 타입으로 변환
            return {
                ...profileData,
                description: profileData.main_description || '',
                user_id: profileData.user_id || '',
                backgroundColor: profileData.background_color || ''
            };
        }
    } catch (error) {
        console.error('❌ DB 프로필 로드 중 오류:', error);
        
        // 오류 시 localStorage 백업 시도
        try {
            const stored = localStorage.getItem('ProfileData');
            if (stored) {
                const profileData = JSON.parse(stored) as ProfileData;
                console.log('⚠️ localStorage 백업에서 프로필 로드');
                return profileData;
            }
        } catch (backupError) {
            console.error('❌ localStorage 백업 로드도 실패:', backupError);
        }
    }
    return null;
};

// 프로필 만료 여부 확인 (7일 기준)
const isProfileExpired = (profileData: ProfileData): boolean => {
    const updatedAt = new Date(profileData.created_at);
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

// 프로필 삭제 (DB + localStorage 백업)
const deleteProfileFromStorage = async () => {
    try {
        console.warn('deleteProfileFromStorage is deprecated. Direct DB operations are preferred.');
        
        // DB에서 프로필 삭제 (실제로는 비활성화하는 것이 좋음)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: false })
                .eq('user_id', user.id);
            
            if (error) {
                console.error('❌ DB 프로필 비활성화 오류:', error);
            } else {
                console.log('✅ DB에서 프로필 비활성화 완료');
            }
        }
        
        // localStorage 백업도 삭제
        localStorage.removeItem('ProfileData');
        console.log('✅ localStorage에서 프로필 삭제 완료');
        
    } catch (error) {
        console.error('❌ 프로필 삭제 중 오류:', error);
    }
};

export { loadProfileFromStorage, isProfileExpired, generateProfileId, deleteProfileFromStorage };
