import { getSliderHistory, getSliderHistorySync } from "../get/getSliderHistory";
import { getLatestProfileData } from "../get/getProfileData";
import { getProfileImages } from "../get/getImageData";
import { saveSliderHistory as saveSliderHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean'; 

// DB에 슬라이더 히스토리 저장 (localStorage 대체)
export const saveSliderHistory = async (
    versionType: 'upload' | 'self' = 'self'
): Promise<{ sliderHistory: any[], success: boolean, error?: any }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return { sliderHistory: [], success: false, error: 'No user found' };
        }

        console.log('🔄 saveSliderHistory: 데이터 조회 시작');
        
        // ✅ 프로필 이미지 조회 (재시도 로직)
        let profileImages = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`🔄 프로필 이미지 조회 시도 ${retryCount + 1}/${maxRetries}`);
                profileImages = await getProfileImages();
                
                if (profileImages && profileImages.length > 0) {
                    console.log('✅ 프로필 이미지 조회 성공:', profileImages.length, '개');
                    break;
                } else {
                    console.log('⚠️ 프로필 이미지가 비어있음, 1초 후 재시도...');
                    if (retryCount < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                console.error(`❌ 프로필 이미지 조회 실패 (${retryCount + 1}/${maxRetries}):`, error);
                if (retryCount < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            retryCount++;
        }
        
        const savedProfileData = await getLatestProfileData();
        console.log('✅ 프로필 데이터 조회 완료:', savedProfileData);
        
        // ✅ 닉네임 fallback 로직 (cluster_history와 동일)
        let currentNickname = savedProfileData?.nickname;
        let currentDescription = savedProfileData?.main_description;
        
        if (!currentNickname) {
            const { getUserData } = await import('../get/getUserData');
            const userData = await getUserData();
            currentNickname = userData?.nickname || userData?.email?.split('@')[0] || '알고리즘 탐험가';
            console.log('⚠️ 프로필이 없어서 사용자 데이터에서 닉네임 가져옴:', currentNickname);
        }
        
        if (!currentDescription) {
            currentDescription = '나만의 알고리즘 자화상을 만들어보세요';
        }

        // DB에 저장
        const dbResult = await saveSliderHistoryDB(
            user.id,
            versionType,
            currentNickname,
            currentDescription,
            savedProfileData?.background_color || '#ffffff',
            profileImages || []
        );

        if (dbResult) {
            console.log('✅ 슬라이더 히스토리 DB 저장 완료');
            
            // DB에서 업데이트된 히스토리 가져오기
            const updatedHistory = await getSliderHistory();
            return {
                sliderHistory: updatedHistory,
                success: true
            };
        } else {
            console.error('❌ 슬라이더 히스토리 DB 저장 실패');
            return { sliderHistory: [], success: false, error: 'DB save failed' };
        }

    } catch (error) {
        console.error('[saveSliderHistory] DB 저장 중 오류:', error);
        return {
            sliderHistory: [],
            success: false,
            error
        };
    }
};

// 동기 버전 (기존 호환성, deprecated)
export const saveSliderHistorySync = (
    localStorageObj: Storage = localStorage
) => {
    console.warn('saveSliderHistorySync is deprecated. Use saveSliderHistory() instead.');
    
    try {
        // localStorage 저장은 제거하고 비동기 DB 저장만 실행
        saveSliderHistory('upload').catch(console.error);
    
        return {
            sliderHistory: [],
            success: true
        };
    } catch (error) {
        console.error('[saveSliderHistorySync] SliderHistory 저장 실패:', error);
        return {
            sliderHistory: [],
            success: false,
            error
        };
    }
};