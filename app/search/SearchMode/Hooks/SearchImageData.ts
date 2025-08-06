import { ImageData } from "@/app/types/profile";
import { getPublicUserImages } from '@/lib/database-clean';

// DB에서 모든 공개 이미지를 가져오는 함수 (더미 데이터 대체)
export async function getAllPublicImages(): Promise<ImageData[]> {
    try {
        const publicImages = await getPublicUserImages(100); // 최대 100개
        
        // DB 형식을 기존 ImageData 형식으로 변환
        return publicImages.map(dbImage => ({
            id: dbImage.id,
            src: dbImage.src,
            main_keyword: dbImage.main_keyword,
            user_id: dbImage.user_id,
            sizeWeight: dbImage.size_weight,
            frameStyle: dbImage.frame_style,
            left: dbImage.css_left,
            top: dbImage.css_top,
            position: dbImage.position,
            relatedVideos: dbImage.related_videos || [],
            created_at: dbImage.created_at,
            keywords: [],
            mood_keyword: '',
            description: '',
            category: '',
            desired_self: false,
            desired_self_profile: null,
            metadata: null,
            rotate: 0,
            width: 200,
            height: 150
        }));
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