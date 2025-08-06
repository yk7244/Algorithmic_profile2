import { getParseHistory as getParseHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 파싱 히스토리 조회 (localStorage 대체)
export async function getParseHistory(): Promise<any[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbHistory = await getParseHistoryDB(user.id);
        
        // DB에 데이터가 없으면 localStorage 확인 후 자동 마이그레이션
        if (!dbHistory || dbHistory.length === 0) {
            const parseHistory = localStorage.getItem("parseHistory");
            if (parseHistory) {
                const localData = JSON.parse(parseHistory);
                console.log('localStorage에서 파싱 히스토리 발견, 자동 마이그레이션 고려');
                return localData;
            }
            return [];
        }
        
        // DB 형식을 기존 형식으로 변환
        return dbHistory.map(item => ({
            id: item.id,
            channel: item.channel,
            date: item.date,
            keyword: item.keyword,
            keywords: item.keyword, // 호환성
            tags: item.tags,
            title: item.title,
            video_id: item.video_id,
            videoId: item.video_id, // 호환성
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('DB에서 파싱 히스토리 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        const parseHistory = localStorage.getItem("parseHistory");
        return parseHistory ? JSON.parse(parseHistory) : [];
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getParseHistorySync() {
    console.warn('getParseHistorySync is deprecated. Use getParseHistory() instead.');
    const parseHistory = localStorage.getItem("parseHistory");
    return parseHistory ? JSON.parse(parseHistory) : null;
}