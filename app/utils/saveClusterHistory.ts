import { ClusterHistory } from '../types/profile';
import { saveClusterHistory as saveClusterHistoryDB, getCurrentUserId, ensureUserExists } from '@/lib/database';

// [2] ClusterHistory 저장 함수 - DB 저장으로 교체
export const saveClusterHistory = async (
  newClusterHistoryItems: ClusterHistory[]
) => {
try {
    // 사용자가 users 테이블에 존재하는지 확인하고 없으면 생성
    await ensureUserExists();
    
    // 현재 로그인된 사용자 ID 가져오기
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('로그인이 필요합니다.');
    }

    // 사용자 ID를 각 클러스터 항목에 추가
    const clusterHistoryWithUserId = newClusterHistoryItems.map(item => ({
      ...item,
      user_id: userId
    }));

    // Supabase DB에 저장
    const data = await saveClusterHistoryDB(clusterHistoryWithUserId);
    
    console.log('[saveClusterHistory] ClusterHistory DB 저장 완료:', data);

    return {
      clusterHistory: data,
      success: true
    };
  } catch (error) {
    console.error('[saveClusterHistory] ClusterHistory DB 저장 실패:', error);
    
    // Supabase가 설정되지 않은 경우 localStorage로 fallback
    try {
      const existingClusterHistory = JSON.parse(localStorage.getItem('ClusterHistory') || '[]');
      
    const newSession = {
        id: new Date().getTime().toString(),
        date: new Date().toLocaleString(),
        clusters: newClusterHistoryItems
    };
    
    const updatedClusterHistory = [...existingClusterHistory, newSession];
      localStorage.setItem('ClusterHistory', JSON.stringify(updatedClusterHistory));
    
      console.log('[saveClusterHistory] localStorage fallback 저장 완료');

    return {
        clusterHistory: updatedClusterHistory,
        success: true
    };
    } catch (fallbackError) {
      console.error('[saveClusterHistory] Fallback 저장도 실패:', fallbackError);
    return {
        clusterHistory: [],
        success: false,
        error
    };
    }
}
};