import { ThumbnailData } from "../../types/profile";
import { getThumbnailByKeyword } from '@/lib/database-clean';

// DB에서 main_keyword로 ThumbnailData 조회 (localStorage 대체)
export async function getThumbnailData(main_keyword: string): Promise<ThumbnailData | null> {
    try {
        const dbThumbnails = await getThumbnailByKeyword(main_keyword);
        
        // DB에 데이터가 있으면 변환해서 반환
        if (dbThumbnails && dbThumbnails.length > 0) {
            const dbThumbnail = dbThumbnails[0]; // 가장 최신 썸네일
            return {
                main_keyword: dbThumbnail.main_keyword,
                keyword: dbThumbnail.search_query || '',
                src: dbThumbnail.image_url || '',
                imageUrl: dbThumbnail.image_url || '', // 호환성
                searchQuery: dbThumbnail.search_query || '', // 호환성
                source: dbThumbnail.source || 'unknown', // 호환성
                created_at: dbThumbnail.created_at
            };
        }
        
        // DB에 없으면 localStorage 확인
        const thumbnailData = localStorage.getItem('thumbnailData');
        if (thumbnailData) {
            const arr: ThumbnailData[] = JSON.parse(thumbnailData);
            const foundThumbnail = arr.find(item => item.main_keyword === main_keyword);
            if (foundThumbnail) {
                console.log('localStorage에서 썸네일 데이터 발견:', main_keyword);
                return foundThumbnail;
            }
        }
        
        return null;
    } catch (error) {
        console.error('DB에서 썸네일 조회 중 오류:', error);
        
        // 오류 시 localStorage 백업 사용
        const thumbnailData = localStorage.getItem('thumbnailData');
        const arr: ThumbnailData[] = thumbnailData ? JSON.parse(thumbnailData) : [];
        return arr.find(item => item.main_keyword === main_keyword) || null;
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getThumbnailDataSync(main_keyword: string): ThumbnailData | null {
    console.warn('getThumbnailDataSync is deprecated. Use getThumbnailData() instead.');
    const thumbnailData = localStorage.getItem('thumbnailData');
    const arr: ThumbnailData[] = thumbnailData ? JSON.parse(thumbnailData) : [];
    return arr.find(item => item.main_keyword === main_keyword) || null;
}