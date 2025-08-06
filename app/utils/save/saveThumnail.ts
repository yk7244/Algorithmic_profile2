import { ThumbnailData } from "../../types/profile";
import { saveThumbnail as saveThumbnailDB } from '@/lib/database-clean';

// DB에 썸네일 데이터 저장 (localStorage 대체)
export async function saveThumbnail(main_keyword: string, thumbnailData: ThumbnailData): Promise<boolean> {
    try {
        // DB에 썸네일 저장 (upsert 방식으로 중복 처리)
        const dbResult = await saveThumbnailDB(
            main_keyword,
            thumbnailData.imageUrl || thumbnailData.src,
            thumbnailData.searchQuery || thumbnailData.keyword,
            thumbnailData.source || 'unknown'
        );

        if (dbResult) {
            console.log('✅ 썸네일 DB 저장 완료:', main_keyword);
            return true;
        } else {
            console.error('❌ 썸네일 DB 저장 실패:', main_keyword);
            return false;
        }

    } catch (error) {
        console.error('썸네일 DB 저장 중 오류:', error);
        return false;
    }
}

// 동기 버전 (기존 호환성, deprecated)  
export function saveThumbnailSync(main_keyword: string, thumbnailData: ThumbnailData, localStorageObj: Storage = localStorage) {
    console.warn('saveThumbnailSync is deprecated. Use saveThumbnail() instead.');
    
    // localStorage 저장 (기존 로직)
    const prev = localStorageObj.getItem('thumbnailData');
    const arr: ThumbnailData[] = prev ? JSON.parse(prev) : [];

    const idx = arr.findIndex(item => item.main_keyword === main_keyword);
    if (idx !== -1) {
        arr[idx] = thumbnailData;
    } else {
        arr.push(thumbnailData);
    }

    localStorageObj.setItem('thumbnailData', JSON.stringify(arr));
    
    // 비동기로 DB에도 저장 시도
    saveThumbnail(main_keyword, thumbnailData).catch(console.error);
}