import { useState, useCallback } from 'react';
import { VideoData } from "../../../types/profile";

export async function fetchAiRecommendedVideos(mainKeyword: string, keywords: string[]): Promise<VideoData[]> {
if (!mainKeyword || !keywords || keywords.length === 0) return [];
try {
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!API_KEY) {
    console.error('YouTube API 키가 설정되지 않았습니다.');
    return [{
        title: '⚠️ API 키가 설정되지 않았습니다',
        embedId: '',
        description: 'YouTube API 키를 환경변수에 설정해주세요.'
    }];
    }
    
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const searchQuery = `${mainKeyword} ${randomKeyword}`;
    
    console.log(`🔍 YouTube API 검색 시도: "${searchQuery}"`);
    
    const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&regionCode=KR&key=${API_KEY}`
    );
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API 오류:', errorData);
        
        // 🆕 403 에러 (할당량 초과) 전용 처리
        if (response.status === 403) {
            console.warn('⚠️ YouTube API 할당량 초과 또는 권한 부족');
            return [{
                title: '📊 YouTube API 할당량이 초과되었습니다',
                embedId: '',
                description: `검색 키워드: "${searchQuery}" - 내일 다시 시도해주세요. 또는 직접 YouTube에서 검색해보세요!`
            }];
        }
        
        // 🆕 기타 에러 처리
        return [{
            title: `❌ YouTube API 오류 (${response.status})`,
            embedId: '',
            description: `검색 키워드: "${searchQuery}" - 잠시 후 다시 시도해주세요.`
        }];
    }
    
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        console.log(`✅ YouTube API 성공: ${data.items.length}개 영상 발견`);
        return data.items.map((item: any) => ({
            title: item.snippet.title,
            embedId: item.id.videoId,
            description: item.snippet.description,
        }));
    } else {
        console.log(`⚠️ YouTube API 응답 없음: "${searchQuery}"`);
        return [{
            title: '🔍 검색 결과가 없습니다',
            embedId: '',
            description: `"${searchQuery}" 관련 영상을 찾을 수 없습니다. 다른 키워드로 직접 검색해보세요!`
        }];
    }
} catch (error) {
    console.error('AI 추천 비디오 가져오기 오류:', error);
    return [{
        title: '🌐 네트워크 연결 오류',
        embedId: '',
        description: '인터넷 연결을 확인하고 다시 시도해주세요.'
    }];
}
}

export function useRecommend(image: any) {
const [isLoading, setIsLoading] = useState(false);
const [videos, setVideos] = useState<VideoData[]>([]);

const fetchAndSet = useCallback(async () => {
    if (!image.main_keyword || !image.keywords || image.keywords.length === 0) {
        setVideos([{
            title: '❓ 키워드 정보가 부족합니다',
            embedId: '',
            description: '이 클러스터에 분석된 키워드가 없어 추천 영상을 가져올 수 없습니다.'
        }]);
        return;
    }
    
    setIsLoading(true);
    try {
        const videoList = await fetchAiRecommendedVideos(image.main_keyword, image.keywords);
        setVideos(videoList);
    } catch (error) {
        console.error('AI 추천 비디오 가져오기 오류:', error);
        setVideos([{ 
            title: '💥 예상치 못한 오류가 발생했습니다', 
            embedId: '', 
            description: '잠시 후 다시 시도해주세요.' 
        }]);
    } finally {
        setIsLoading(false);
    }
}, [image.main_keyword, image.keywords]);

return { isLoading, videos, fetchAndSet };
} 