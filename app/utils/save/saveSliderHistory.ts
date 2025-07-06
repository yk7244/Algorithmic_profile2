import { getSliderHistory } from "../get/getSliderHistory";
import { getLatestProfileData } from "../get/getProfileData";

// [5] SliderHistory 저장 함수
export const saveSliderHistory = (
    profileImages: any[], 
    localStorageObj: Storage = localStorage
    ) => {
    try {
        // [5] SliderHistory 배열에 새 데이터 push
        const existingSliderHistory = getSliderHistory();
    
        // ProfileData에서 nickname과 description 가져오기
        const savedProfileData = getLatestProfileData();
        console.log('가져온 ProfileData', savedProfileData);
        const currentNickname = savedProfileData.nickname || '새로운 사용자';
        const currentDescription = savedProfileData.description || '프로필 설명이 없습니다';
    
        // 하나의 SliderHistory 항목으로 생성 (analysisHistory와 유사한 구조)
        const newSliderHistoryItem = {
        id: new Date().getTime().toString(),
        user_id: 'current_user',
        version_type: 'upload' as const,
        nickname: currentNickname, // localStorage ProfileData에서 가져온 별명
        description: currentDescription, // localStorage ProfileData에서 가져온 설명
        images: profileImages, // 모든 프로필 이미지를 배열로 저장
        created_at: new Date().toISOString()
        };
    
        // 기존 배열에 새 데이터 push
        const updatedSliderHistory = [...existingSliderHistory, newSliderHistoryItem];
        localStorageObj.setItem('SliderHistory', JSON.stringify(updatedSliderHistory));
        console.log('[saveSliderHistory] SliderHistory 업데이트됨:', updatedSliderHistory);
    
        return {
        sliderHistory: updatedSliderHistory,
        success: true
        };
    } catch (error) {
        console.error('[saveSliderHistory] SliderHistory 저장 실패:', error);
        return {
        sliderHistory: [],
        success: false,
        error
        };
    }
    };