import { useState, useCallback } from 'react';
import { VideoData } from '../../Draggable/DraggableImage';

export async function fetchAiRecommendedVideos(mainKeyword: string, keywords: string[], pageToken?: string): Promise<{ videos: VideoData[], nextPageToken?: string }> {
    if (!mainKeyword || !keywords || keywords.length === 0) return { videos: [], nextPageToken: undefined };
    try {
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!API_KEY) {
            console.error('YouTube API 키가 설정되지 않았습니다.');
            throw new Error('API 키가 없습니다.');
        }
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        const searchQuery = `${mainKeyword} ${randomKeyword}`;
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&regionCode=KR&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`
        );
        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API 오류:', errorData);
            throw new Error(`YouTube API 오류: ${response.status}`);
        }
        const data = await response.json();
        if (data.items) {
            return {
                videos: data.items.map((item: any) => ({
                    title: item.snippet.title,
                    embedId: item.id.videoId,
                })),
                nextPageToken: data.nextPageToken,
            };
        }
        return { videos: [], nextPageToken: undefined };
    } catch (error) {
        console.error('AI 추천 비디오 가져오기 오류:', error);
        return {
            videos: [{
                title: '추천 영상을 불러올 수 없습니다.',
                embedId: '',
            }],
            nextPageToken: undefined
        };
    }
}

export function useRecommend(image: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

    const fetchAndSet = useCallback(async (isLoadMore = false) => {
        if (!image.main_keyword || !image.keywords || image.keywords.length === 0) return;
        setIsLoading(true);
        try {
            const { videos: newVideos, nextPageToken: newToken } = await fetchAiRecommendedVideos(
                image.main_keyword,
                image.keywords,
                isLoadMore ? nextPageToken : undefined
            );
            setVideos(prev => isLoadMore ? [...prev, ...newVideos] : newVideos);
            setNextPageToken(newToken);
        } catch (error) {
            console.error('AI 추천 비디오 가져오기 오류:', error);
            setVideos([{ title: '추천 영상을 불러올 수 없습니다.', embedId: '' }]);
        } finally {
            setIsLoading(false);
        }
    }, [image.main_keyword, image.keywords, nextPageToken]);

    return { isLoading, videos, fetchAndSet, nextPageToken };
} 