import { saveParseHistory as saveParseHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 파싱 히스토리 저장 (localStorage 대체)
export async function saveParseHistory(parseHistory: any[]): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return false;
        }

        const success = await saveParseHistoryDB(user.id, parseHistory);
        if (success) {
            console.log('✅ parseHistory DB 저장 완료:', parseHistory.length, '개');
        } else {
            console.error('❌ parseHistory DB 저장 실패');
        }

        return success;
    } catch (error) {
        console.error('parseHistory DB 저장 중 오류:', error);
        return false;
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function saveParseHistorySync(parseHistory: any) {
    console.warn('saveParseHistorySync is deprecated. Use saveParseHistory() instead.');
    localStorage.setItem('parseHistory', JSON.stringify(parseHistory));
    console.log('parseHistory localStorage 저장 완료', parseHistory);
    
    // 비동기로 DB에도 저장 시도
    if (Array.isArray(parseHistory)) {
        saveParseHistory(parseHistory).catch(console.error);
    }
}   