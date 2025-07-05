import { ThumbnailData } from "../types/profile";


// main_keyword로 ThumbnailData 전체 객체 반환
export function getThumbnailData(main_keyword: string): ThumbnailData | null {
    const thumbnailData = localStorage.getItem('thumbnailData');
    const arr: ThumbnailData[] = thumbnailData ? JSON.parse(thumbnailData) : [];
    return arr.find(item => item.main_keyword === main_keyword) || null;
}