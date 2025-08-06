import { ClusterHistory, WatchHistory, WatchHistory_array } from "@/app/types/profile";
import { getWatchHistoryArrays } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 시청 기록 배열 조회 (localStorage 대체)
export async function getWatchHistory_array(): Promise<WatchHistory_array[]> {
    if (typeof window === "undefined") return [];
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbArrays = await getWatchHistoryArrays(user.id);
        
        // DB에 데이터가 없으면 localStorage 확인
        if (!dbArrays || dbArrays.length === 0) {
            const localArrays = JSON.parse(localStorage.getItem("watchHistory_array") || "[]");
            if (localArrays.length > 0) {
                console.log('localStorage에서 시청 기록 배열 발견, 자동 마이그레이션 고려');
            }
            return localArrays;
        }
        
        // DB 형식을 기존 형식으로 변환
        return dbArrays.map(item => ({
            id: item.id,
            watchHistory: item.watch_history_data,
            timestamp: item.timestamp?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            clusterHistory_id: item.cluster_history_id,
            created_at: item.timestamp
        }));
    } catch (error) {
        console.error('DB에서 시청 기록 배열 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        try {
            return JSON.parse(localStorage.getItem("watchHistory_array") || "[]");
        } catch {
            return [];
        }
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getWatchHistory_arraySync(): WatchHistory_array[] {
    console.warn('getWatchHistory_arraySync is deprecated. Use getWatchHistory_array() instead.');
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory_array") || "[]");
    } catch {
        return [];
    }
}

// 클러스터 히스토리 ID로 시청 기록 조회 (DB 버전)
export async function getWatchHistory_by_clusterHistory_id(clusterHistory: ClusterHistory): Promise<WatchHistory[]> {
    try {
        const watchHistory_array = await getWatchHistory_array();
        
        const matchingArrays = watchHistory_array.filter(item => {
            return item.clusterHistory_id === clusterHistory.id;
        });
        
        return matchingArrays.flatMap(item => item.watchHistory);
    } catch (error) {
        console.error('클러스터 히스토리 ID로 시청 기록 조회 중 오류:', error);
        return [];
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getWatchHistory_by_clusterHistory_idSync(clusterHistory: ClusterHistory): WatchHistory[] {
    console.warn('getWatchHistory_by_clusterHistory_idSync is deprecated. Use getWatchHistory_by_clusterHistory_id() instead.');
    
    const watchHistory_array = getWatchHistory_arraySync();

    const watchHistory = watchHistory_array.filter(item => {
        return item.clusterHistory_id === clusterHistory.id;
    });

    return watchHistory.flatMap(item => item.watchHistory);
}