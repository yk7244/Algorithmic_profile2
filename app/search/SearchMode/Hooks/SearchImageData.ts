import { ImageData } from "@/app/types/profile";
import { getAllPublicImages as getAllPublicImagesDB, convertDBImagesToLocalStorage } from '@/lib/database-clean';

// DB에서 모든 공개 이미지를 가져오는 함수 (더미 데이터 대체)
export async function getAllPublicImages(): Promise<ImageData[]> {
    try {
        const publicImages = await getAllPublicImagesDB(100); // 최대 100개
        
        // DB 형식을 ImageData 형식으로 변환 (표준 변환 함수 사용)
        return convertDBImagesToLocalStorage(publicImages);
    } catch (error) {
        console.error('❌ 공개 이미지 로드 오류:', error);
        return [];
    }
}

// 기존 함수명과의 호환성을 위한 deprecated 함수
export function getAllDummyImages(): ImageData[] {
    console.warn('getAllDummyImages is deprecated. Use getAllPublicImages() instead.');
    console.warn('Dummy data removed. Returning empty array. Please use async DB version.');
    return [];
} 