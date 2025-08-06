import { ClusterHistory } from "@/app/types/profile";
import { getClusterHistory as getClusterHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 클러스터 히스토리 조회 (localStorage 대체)
export async function getClusterHistory(): Promise<ClusterHistory[]> {
    if (typeof window === "undefined") return [];
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbHistory = await getClusterHistoryDB(user.id);
        
        // DB에 데이터가 없으면 빈 배열 반환 (더미 데이터 방지)
        if (!dbHistory || dbHistory.length === 0) {
            const localHistory = JSON.parse(localStorage.getItem("ClusterHistory") || "[]");
            if (localHistory.length > 0 && !sessionStorage.getItem('dummy_data_warning_shown')) {
                console.log('⚠️ localStorage에 클러스터 히스토리가 있지만 더미 데이터일 가능성이 높아 무시합니다');
                console.log('💡 클러스터 데이터를 생성하려면 업로드를 진행하세요');
                sessionStorage.setItem('dummy_data_warning_shown', 'true'); // 세션당 한 번만 표시
            }
            return []; // 빈 배열 반환으로 더미 데이터 방지
        }
        
        // DB 형식을 기존 ClusterHistory 형식으로 변환
        return dbHistory.map(item => ({
            id: item.id,
            user_id: item.user_id,
            nickname: item.nickname,
            description: item.description,
            main_description: item.description, // 기존 코드 호환성
            images: item.images_data,
            images_data: item.images_data,
            profile_id: item.profile_id,
            analysis_data: item.analysis_data,
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('DB에서 클러스터 히스토리 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        try {
            const clusterHistory = JSON.parse(localStorage.getItem("ClusterHistory") || "[]");
            return clusterHistory;
        } catch {
            return [];
        }
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getClusterHistorySync(): ClusterHistory[] {
    console.warn('getClusterHistorySync is deprecated. Use getClusterHistory() instead.');
    if (typeof window === "undefined") return [];
    try {
        const clusterHistory = JSON.parse(localStorage.getItem("ClusterHistory") || "[]");
        return clusterHistory;
    } catch {
        return [];
    }
}

