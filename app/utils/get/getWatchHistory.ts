import { WatchHistory } from "@/app/types/profile";
import { getWatchHistory as getWatchHistoryDB, saveWatchHistory } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 시청 기록 조회 (localStorage 대체)
export async function getWatchHistory(): Promise<WatchHistory[]> {
    if (typeof window === "undefined") return [];
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbHistory = await getWatchHistoryDB(user.id);
        
        // DB에 데이터가 없으면 localStorage 확인 후 자동 마이그레이션
        if (!dbHistory || dbHistory.length === 0) {
            const localHistory = JSON.parse(localStorage.getItem("watchHistory") || "[]");
            if (localHistory.length > 0) {
                console.log('localStorage에서 시청 기록 발견, 자동 마이그레이션 수행');
                const success = await saveWatchHistory(user.id, localHistory);
                if (success) {
                    console.log('시청 기록 자동 마이그레이션 완료');
                    // 마이그레이션된 데이터 다시 가져오기
                    const migratedHistory = await getWatchHistoryDB(user.id);
                    return migratedHistory.map(item => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        tags: item.tags || [],
                        keywords: item.keywords || [],
                        keyword: item.keywords || [], // 기존 코드 호환성
                        video_id: item.video_id,
                        videoId: item.video_id, // 기존 코드 호환성
                        date: item.watch_date,
                        analysis_date: item.analysis_date,
                        created_at: item.created_at
                    }));
                }
            }
            return localHistory;
        }
        
        // DB 형식을 기존 WatchHistory 형식으로 변환
        return dbHistory.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            tags: item.tags || [],
            keywords: item.keywords || [],
            keyword: item.keywords || [], // 기존 코드 호환성
            video_id: item.video_id,
            videoId: item.video_id, // 기존 코드 호환성
            date: item.watch_date,
            analysis_date: item.analysis_date,
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('DB에서 시청 기록 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        try {
            return JSON.parse(localStorage.getItem("watchHistory") || "[]");
        } catch {
            return [];
        }
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getWatchHistorySync(): WatchHistory[] {
    console.warn('getWatchHistorySync is deprecated. Use getWatchHistory() instead.');
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("watchHistory") || "[]");
    } catch {
        return [];
    }
}