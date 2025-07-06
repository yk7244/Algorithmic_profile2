import { getClusterHistory } from "../get/getClusterHistory";
import { getLatestProfileData } from "../get/getProfileData";

// [5] SliderHistory 저장 함수
export const saveClusterHistory = (
    profileImages: any[], 
    localStorageObj: Storage = localStorage
    ) => {
    try {
        // [5] SliderHistory 배열에 새 데이터 push
        const existingClusterHistory = getClusterHistory();
    
        // ProfileData에서 nickname과 description 가져오기
        const savedProfileData = getLatestProfileData();
        console.log('savedProfileData', savedProfileData);
        const currentNickname = savedProfileData.nickname || '새로운 사용자';
        const currentDescription = savedProfileData.description || '프로필 설명이 없습니다';
    
        // 하나의 SliderHistory 항목으로 생성 (analysisHistory와 유사한 구조)
        const newClusterHistoryItem = {
        id: new Date().getTime().toString(),
        user_id: 'current_user',
        nickname: currentNickname, // localStorage ProfileData에서 가져온 별명
        description: currentDescription, // localStorage ProfileData에서 가져온 설명
        images: profileImages, // 모든 프로필 이미지를 배열로 저장
        created_at: new Date().toISOString()
        };
    
        // 기존 배열에 새 데이터 push
        const updatedClusterHistory = [...existingClusterHistory, newClusterHistoryItem];
        localStorageObj.setItem('ClusterHistory', JSON.stringify(updatedClusterHistory));
        console.log('[saveClusterHistory] ClusterHistory 업데이트됨:', updatedClusterHistory);
    
        return {
        clusterHistory: updatedClusterHistory,
        success: true
        };
    } catch (error) {
        console.error('[saveClusterHistory] ClusterHistory 저장 실패:', error);
        return {
        clusterHistory: [],
        success: false,
        error
        };
    }
    };