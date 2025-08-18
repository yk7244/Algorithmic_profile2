import { useState, useCallback } from 'react';
import { VideoData } from '../../Draggable/DraggableImage';

export async function fetchAiRecommendedVideos2(mainKeyword: string, keywords: string[], pageToken?: string): Promise<{ videos: VideoData[], nextPageToken?: string }> {
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
export async function fetchAiRecommendedVideos(
    mainKeyword: string,
    keywords: string[],
    pageToken?: string,
    related_videos?: any[]
    ): Promise<{ videos: VideoData[]; nextPageToken?: string }> {
        if (!mainKeyword || !keywords || keywords.length === 0)
        return { videos: [], nextPageToken: undefined };
    
        try {
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!API_KEY) {
            console.error('YouTube API 키가 설정되지 않았습니다.');
            throw new Error('API 키가 없습니다.');
        }
        console.log('함수 호출됨', related_videos);
    
        // ---- helpers ----
        const pickVideoId = (v: any): string | undefined => {
            if (!v) return;
            if (typeof v === 'string') return v;
            return v.embedId || v.videoId || v?.id?.videoId || v.id;
        };
        const pickChannelId = (v: any): string | undefined => {
            if (!v) return;
            // 원본 search item 형태
            if (v?.snippet?.channelId) return v.snippet.channelId;
            // 내가 정의한 VideoData 확장형일 수 있음
            return v.channelId;
        };
        const chunk = <T,>(arr: T[], size: number) =>
            Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
            );
    
        const ytJson = async (url: string) => {
            const r = await fetch(url);
            if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            console.error('YouTube API 오류:', e);
            throw new Error(`YouTube API 오류: ${r.status}`);
            }
            return r.json();
        };
    
        // ---- 1) related_videos 에서 channelId 수집 (없으면 embedId -> channelId 해석) ----
        let channelIds: string[] = [];
        const fromDirect = (related_videos || [])
            .map(pickChannelId)
            .filter(Boolean) as string[];
    
        channelIds.push(...fromDirect);
    
        // channelId가 없고 embedId만 있는 경우, videos.list로 매핑
        if (channelIds.length === 0 && Array.isArray(related_videos) && related_videos.length) {
            const videoIds = (related_videos.map(pickVideoId).filter(Boolean) as string[]).slice(0, 50);
            if (videoIds.length) {
            for (const ids of chunk(videoIds, 50)) {
                const url =
                `https://www.googleapis.com/youtube/v3/videos?` +
                new URLSearchParams({
                    part: 'snippet',
                    id: ids.join(','),
                    key: API_KEY,
                }).toString();
                const data = await ytJson(url);
                const chs = (data.items || [])
                .map((it: any) => it?.snippet?.channelId)
                .filter(Boolean);
                channelIds.push(...chs);
            }
            }
        }
    
        // dedupe + 너무 많으면 상위 몇 개만
        channelIds = [...new Set(channelIds)].slice(0, 3);
    
        // ---- 2) 채널의 다른 영상 가져오기 ----
        const responses: any[] = [];
        if (channelIds.length) {
            for (let i = 0; i < channelIds.length; i++) {
            const ch = channelIds[i];
            const p = new URLSearchParams({
                part: 'snippet',
                type: 'video',
                channelId: ch,
                maxResults: '10',
                regionCode: 'KR',
                relevanceLanguage: 'ko',
                videoEmbeddable: 'true',
                // 컨텍스트 유지: 메인키워드와 연관된 영상을 우선
                q: `"${mainKeyword}"`,
                order: 'relevance', // 최신 업로드가 필요하면 'date'로 변경
                key: API_KEY,
            });
            console.log('채널',ch);
            if (i === 0 && pageToken) p.set('pageToken', pageToken);
            const url = `https://www.googleapis.com/youtube/v3/search?${p.toString()}`;
            responses.push(await ytJson(url));
            }
        } else {
            // ---- 3) 채널을 못 찾으면 키워드 검색으로 폴백 ----
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const p = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            q: `"${mainKeyword}" "${randomKeyword}"`,
            maxResults: '10',
            regionCode: 'KR',
            relevanceLanguage: 'ko',
            videoEmbeddable: 'true',
            order: 'relevance',
            key: API_KEY,
            });
            if (pageToken) p.set('pageToken', pageToken);
            const url = `https://www.googleapis.com/youtube/v3/search?${p.toString()}`;
            responses.push(await ytJson(url));
        }
    
        // 첫 호출의 nextPageToken만 그대로 전달 (단순 처리)
        const nextPageTokenOut = responses[0]?.nextPageToken;
    
        // ---- 합치기 + 중복 제거 ----
        const seen = new Set<string>();
        const items: any[] = [];
        for (const res of responses) {
            for (const it of res.items ?? []) {
            const id = it?.id?.videoId;
            if (!id || seen.has(id)) continue;
            seen.add(id);
            items.push(it);
            }
        }
    
        // ---- 반환 매핑 ----
        const videos: VideoData[] = items.map((it) => ({
            title: it.snippet.title,
            embedId: it.id.videoId,
            // 필요하면 채널/설명 등 확장 필드 추가 가능:
            // channelId: it.snippet.channelId,
            // channelTitle: it.snippet.channelTitle,
            // publishedAt: it.snippet.publishedAt,
        }));
    
        return { videos, nextPageToken: nextPageTokenOut };
        } catch (error) {
            console.error('AI 추천 비디오 가져오기 오류:', error);
            return {
            videos: [
                { title: '추천 영상을 불러올 수 없습니다.', embedId: '' },
            ],
            nextPageToken: undefined,
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