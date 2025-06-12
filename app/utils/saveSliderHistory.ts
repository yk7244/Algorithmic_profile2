import { saveSliderHistory as saveSliderHistoryDB, getCurrentUserId, getProfileData, ensureUserExists } from '@/lib/database';

// [5] SliderHistory 저장 함수 - DB 저장으로 교체
export const saveSliderHistory = async (profileImages: any[]) => {
  try {
    // 사용자가 users 테이블에 존재하는지 확인하고 없으면 생성
    await ensureUserExists();
    
    // 현재 로그인된 사용자 ID 가져오기
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    // ProfileData에서 nickname과 description 가져오기 (DB 우선, fallback은 localStorage)
    let currentNickname = '새로운 사용자';
    let currentDescription = '프로필 설명이 없습니다';

    try {
      const profileData = await getProfileData(userId);
      if (profileData) {
        currentNickname = profileData.nickname || currentNickname;
        currentDescription = profileData.description || currentDescription;
      }
    } catch (profileError) {
      console.log('[saveSliderHistory] DB에서 프로필 로드 실패, localStorage fallback 시도');
      // 🆕 사용자별 localStorage에서 프로필 데이터 가져오기 (fallback)
      try {
        const profileDataKey = `ProfileData_${userId}`;
        const savedProfileData = JSON.parse(localStorage.getItem(profileDataKey) || '{}');
        currentNickname = savedProfileData.nickname || currentNickname;
        currentDescription = savedProfileData.description || currentDescription;
      } catch (localError) {
        console.log('[saveSliderHistory] 사용자별 localStorage에서도 프로필 로드 실패, 기본값 사용');
      }
    }

    // SliderHistory 데이터 생성
    const sliderHistoryData = {
      user_id: userId,
      version_type: 'upload' as const,
      nickname: currentNickname,
      description: currentDescription,
      images: profileImages
    };

    // Supabase DB에 저장
    const data = await saveSliderHistoryDB(sliderHistoryData);
    
    console.log('[saveSliderHistory] SliderHistory DB 저장 완료:', data);

    return {
      sliderHistory: [data], // 배열 형태로 반환하여 기존 호환성 유지
      success: true
    };
  } catch (error) {
    console.error('[saveSliderHistory] SliderHistory DB 저장 실패:', error);
    
    // Supabase가 설정되지 않은 경우 localStorage로 fallback
    try {
      const userId = await getCurrentUserId();
      const sliderHistoryKey = userId ? `SliderHistory_${userId}` : 'SliderHistory';
      
      const existingSliderHistory = JSON.parse(localStorage.getItem(sliderHistoryKey) || '[]');
    
      // ProfileData에서 nickname과 description 가져오기 (fallback)
      const profileDataKey = userId ? `ProfileData_${userId}` : 'profileData';
      const savedProfileData = JSON.parse(localStorage.getItem(profileDataKey) || '{}');
        const currentNickname = savedProfileData.nickname || '새로운 사용자';
        const currentDescription = savedProfileData.description || '프로필 설명이 없습니다';
    
        const newSliderHistoryItem = {
        id: new Date().getTime().toString(),
        user_id: userId || 'current_user',
        version_type: 'upload' as const,
        nickname: currentNickname,
        description: currentDescription,
        images: profileImages,
        created_at: new Date().toISOString()
        };
    
        const updatedSliderHistory = [...existingSliderHistory, newSliderHistoryItem];
      localStorage.setItem(sliderHistoryKey, JSON.stringify(updatedSliderHistory));
      
      console.log(`[saveSliderHistory] 사용자별 localStorage fallback 저장 완료: ${sliderHistoryKey}`);
    
        return {
        sliderHistory: updatedSliderHistory,
        success: true
        };
    } catch (fallbackError) {
      console.error('[saveSliderHistory] Fallback 저장도 실패:', fallbackError);
        return {
        sliderHistory: [],
        success: false,
        error
        };
    }
    }
    };