import { UserData, ProfileData, ImageData } from '@/app/types/profile';
import { getUser, getPublicUserProfile, convertDBImagesToLocalStorage } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// user profile의 background_color를 불러오는 함수 (localStorage 사용)
export function getUserBackgroundColor(user: UserData): string | null {
    const key = `user-profile-background-color-${user.id}`;
    return localStorage.getItem(key);
}

// DB에서 공개 사용자 프로필 조회 (탐색 기능용)
export async function getUserFullProfileById(userId: string): Promise<{
  user: UserData | undefined,
  profile: ProfileData | undefined,
  images: ImageData[]
}> {
  try {
    // DB에서 공개 사용자 프로필 조회
    const publicProfile = await getPublicUserProfile(userId);
    
    if (publicProfile) {
      console.log('✅ DB에서 공개 사용자 프로필 조회 완료:', userId);
      console.log('🔍 조회된 프로필 데이터:', publicProfile);
      
      // ✅ Supabase 조인된 데이터 구조 처리 (user 또는 users 필드 안전하게 접근)
      const userData = (publicProfile as any).user || 
                      (Array.isArray((publicProfile as any).users) ? (publicProfile as any).users[0] : (publicProfile as any).users);
      
      if (!userData) {
        console.error('❌ 사용자 데이터가 없습니다:', publicProfile);
        return { user: undefined, profile: undefined, images: [] };
      }
      
      // DB 형식을 기존 형식으로 변환
      const user: UserData = {
        id: publicProfile.id,
        nickname: publicProfile.nickname,
        email:  '', // 기본값 설정
        background_color: publicProfile.background_color || '#000000', // 기본값 설정
        open_to_connect: userData.open_to_connect,
        last_analysis_time: undefined, // 현재 DB에서 지원하지 않는 필드
        created_at: publicProfile.created_at
      };

      const profile: ProfileData = {
        id: publicProfile.id || '',
        user_id: publicProfile.user_id || userId,
        nickname: publicProfile.nickname || userData.nickname,
        description: (publicProfile as any).main_description || '',
        backgroundColor: publicProfile.background_color,
        created_at: publicProfile.created_at || userData.created_at
      };

      // 별도로 사용자의 공개 이미지 데이터 가져오기
      let images: ImageData[] = [];
      try {
        const { getPublicUserImages } = await import('@/lib/database-clean');
        const userImages = await getPublicUserImages(userId);
        console.log(`🔍 공개 사용자 이미지 로드: ${userImages.length}개`);
        

        
        // DB 형식을 ImageData 형식으로 변환 (표준 변환 함수 사용)
        images = convertDBImagesToLocalStorage(userImages);
        

      } catch (error) {
        console.error('❌ 사용자 이미지 로드 실패:', error);
        images = [];
      }

      return { user, profile, images };
    }

    // DB에서 찾지 못한 경우 빈 결과 반환
    console.warn('⚠️ DB에서 사용자를 찾지 못함:', userId);
    return { user: undefined, profile: undefined, images: [] };

  } catch (error) {
    console.error('❌ DB에서 사용자 프로필 조회 중 오류:', error);
    
    // 오류 시 빈 결과 반환
    return { user: undefined, profile: undefined, images: [] };
  }
}

// 동기 버전 (deprecated - 더미 데이터 제거됨)
export function getUserFullProfileByIdSync(userId: string): {
  user: UserData | undefined,
  profile: ProfileData | undefined,
  images: ImageData[]
} {
  console.warn('getUserFullProfileByIdSync is deprecated. Use getUserFullProfileById() instead.');
  console.warn('Dummy data removed. Returning empty result. Please use async DB version.');
  return { user: undefined, profile: undefined, images: [] };
}

// DB에서 현재 로그인한 사용자 데이터 가져오기 (localStorage 대체)
export async function getUserData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const userData = await getUser(user.id);
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// 기존 localStorage 호환성을 위한 동기 함수 (deprecated)
export function getUserDataSync() {
  console.warn('getUserDataSync is deprecated. Use getUserData() instead.');
  const raw = localStorage.getItem('UserData');
  if (raw && !sessionStorage.getItem('sync_user_data_warning_shown')) {
    console.log('⚠️ 동기 버전에서 사용자 데이터 확인했지만 더미 데이터일 가능성이 높아 null 반환');
    sessionStorage.setItem('sync_user_data_warning_shown', 'true');
  }
  return null; // 항상 null 반환하여 빈 상태 유지
}

// 프로필 스토리지 함수 (deprecated - saveProfileData 사용 권장)
export function useProfileStorage() {
  const saveProfileToStorage = (profileData: ProfileData) => {
      try {
        console.warn('useProfileStorage is deprecated. Use saveProfileData() instead.');
        localStorage.setItem('ProfileData', JSON.stringify(profileData));
        console.log('프로필이 localStorage에 저장되었습니다:', profileData);
      } catch (error) {
        console.error('프로필 저장 중 오류:', error);
      }
  };
  
  return { saveProfileToStorage };
}