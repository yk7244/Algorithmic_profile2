import { getActiveProfile } from '@/lib/database-clean/profiles';
import { supabase } from '@/lib/supabase-clean';

export const getProfileData = () => {
    const profileData = localStorage.getItem('profileData');
    return profileData ? JSON.parse(profileData) : null;
};

// DB에서 현재 사용자의 활성 프로필 데이터 가져오기 (localStorage 대체)
export const getLatestProfileData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const activeProfile = await getActiveProfile(user.id);
        if (activeProfile) {
            console.log('✅ DB에서 활성 프로필 로드 성공:', activeProfile.nickname);
            console.log('🔍 DB 프로필 상세 정보:', {
                nickname: activeProfile.nickname,
                main_description: activeProfile.main_description,
                hasMainDescription: !!activeProfile.main_description
            });
            return {
                id: activeProfile.id,
                user_id: activeProfile.user_id,
                nickname: activeProfile.nickname,
                main_description: activeProfile.main_description, // ✅ 올바른 컬럼명
                description: activeProfile.main_description, // 호환성
                background_color: activeProfile.background_color,
                created_at: activeProfile.created_at,
                is_active: activeProfile.is_active
            };
        }

        // DB에서 찾지 못한 경우 localStorage 백업 확인
        const profileData = localStorage.getItem('profileData');
        if (profileData && !sessionStorage.getItem('profile_data_warning_shown')) {
            console.log('⚠️ localStorage에 프로필 데이터가 있지만 DB를 우선 사용합니다');
            sessionStorage.setItem('profile_data_warning_shown', 'true');
        }

        return null;
    } catch (error) {
        console.error('❌ DB에서 프로필 로드 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        const profileData = localStorage.getItem('profileData');
        if (!profileData) return null;
        try {
            const parsed = JSON.parse(profileData);
            if (Array.isArray(parsed) && parsed.length >= 1) {
                console.log('⚠️ 에러로 인해 localStorage 백업 사용');
                return parsed[parsed.length - 1];
            }
            return parsed;
        } catch {
            return null;
        }
    }
};
