import { WatchHistory_array } from "@/app/types/profile";
import { getWatchHistory, getWatchHistorySync } from "../get/getWatchHistory";
import { getWatchHistory_array } from "../get/getWatchHistory_array";
import { saveWatchHistory as saveWatchHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 시청 기록 저장 (localStorage 대체)
export async function saveWatchHistory(watchHistory: any[]): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return false;
        }

        const today = new Date().toISOString().slice(0, 10);
        
        const withDate = (watchHistory || [])
            .filter(item => item && typeof item === "object") // null 방지
            .map(item => ({
                ...item,
                timestamp: item.timestamp || today,
            }));

        // DB에 저장
        const success = await saveWatchHistoryDB(user.id, withDate);
        
        if (success) {
            console.log('시청 기록 DB 저장 완료', withDate.length, '개');
        }

        return success;
    } catch (error) {
        console.error('시청 기록 DB 저장 중 오류:', error);
        return false;
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function saveWatchHistorySync(watchHistory: any[], localStorageObj: Storage = localStorage) {
    console.warn('saveWatchHistorySync is deprecated. Use saveWatchHistory() instead.');
    
    // localStorage 저장은 제거하고 비동기 DB 저장만 실행
    saveWatchHistory(watchHistory).catch(console.error);
}


