import { ClusterHistory } from '../types/profile';

// [2] ClusterHistory 저장 함수 - analysisHistory와 동일한 구조
export const saveClusterHistory = (
newClusterHistoryItems: ClusterHistory[], 
localStorageObj: Storage = localStorage
) => {
try {
    // 기존 ClusterHistory 불러오기
    const existingClusterHistory = JSON.parse(localStorageObj.getItem('ClusterHistory') || '[]');
    
    // 새로운 세션 객체 생성 (analysisHistory와 동일한 구조)
    const newSession = {
        id: new Date().getTime().toString(),
        date: new Date().toLocaleString(),
        clusters: newClusterHistoryItems
    };
    
    // 배열에 새 세션 추가
    const updatedClusterHistory = [...existingClusterHistory, newSession];
    
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