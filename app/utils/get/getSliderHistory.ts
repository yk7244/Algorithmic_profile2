import { SliderHistory } from "@/app/types/profile";
import { getSliderHistory as getSliderHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에서 슬라이더 히스토리 조회 (localStorage 대체)
export async function getSliderHistory(): Promise<SliderHistory[]> {
    if (typeof window === "undefined") return [];
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const dbHistory = await getSliderHistoryDB(user.id);
        
        // DB에 데이터가 없으면 localStorage 확인 후 자동 마이그레이션
        if (!dbHistory || dbHistory.length === 0) {
            const localHistory = JSON.parse(localStorage.getItem("SliderHistory") || "[]");
            if (localHistory.length > 0) {
                console.log('localStorage에서 슬라이더 히스토리 발견, 자동 마이그레이션 고려');
            }
            return localHistory;
        }
        
        // DB 형식을 기존 형식으로 변환
        return dbHistory.map(item => ({
            id: item.id,
            user_id: item.user_id,
            version_type: item.version_type,
            versionType: item.version_type, // 호환성
            nickname: item.nickname,
            description: item.description,
            main_description: item.description, // 호환성
            background_color: item.background_color,
            backgroundColor: item.background_color, // 호환성
            images: item.images_data,
            images_data: item.images_data, // 호환성
            imagesData: item.images_data, // 호환성
            created_at: item.created_at,
            timestamp: item.created_at // ✅ timestamp 호환성 추가
        }));
    } catch (error) {
        console.error('DB에서 슬라이더 히스토리 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        try {
            return JSON.parse(localStorage.getItem("SliderHistory") || "[]");
        } catch {
            return [];
        }
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getSliderHistorySync(): SliderHistory[] {
    console.warn('getSliderHistorySync is deprecated. Use getSliderHistory() instead.');
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("SliderHistory") || "[]");
    } catch {
        return [];
    }
}