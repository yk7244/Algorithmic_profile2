import { ExploreWatchHistory } from '@/app/types/profile';
import { saveWatchHistory } from '@/app/utils/save/saveWatchHistory';
// VideoData 타입이 프로젝트 내 어디에 정의되어 있는지에 따라 import 경로를 맞춰주세요.
// 예시: import { VideoData } from '@/app/types/video';

export interface VideoData {
embedId: string;
title: string;
description?: string;
// 필요한 필드 추가
}

// DB에 탐색 시청 기록 저장 (localStorage 대체)
export async function saveWatchedVideoToLocalStorage(video: VideoData, userId = 'guest') {
    console.warn('saveWatchedVideoToLocalStorage is deprecated. Consider renaming to saveWatchedVideoToDB.');
    
    const newRecord: ExploreWatchHistory = {
        id: `${userId}-${video.embedId}`,
        user_id: userId,
        videoId: video.embedId,
        title: video.title,
        description: video.description || '',
        timestamp: new Date().toISOString(),
    };

    try {
        // DB에 시청 기록 저장
        const watchHistoryItem = {
            video_id: video.embedId,
            title: video.title,
            channel_name: '', // VideoData에 채널명이 없으면 빈 문자열
            watched_at: new Date().toISOString(),
            thumbnail_url: '', // VideoData에 썸네일이 없으면 빈 문자열
            keywords: [],
            cluster_id: null
        };

        await saveWatchHistory([watchHistoryItem]);
        console.log('✅ DB에 탐색 시청 기록 저장 완료:', video.title);
        
    } catch (error) {
        console.error('❌ DB 탐색 시청 기록 저장 오류:', error);
        
        // 오류 시 localStorage 백업
        console.warn('DB 저장 실패로 localStorage 백업 수행');
        const prev: ExploreWatchHistory[] = JSON.parse(localStorage.getItem('exploreWatchHistory') || '[]');
        const merged = [
            newRecord,
            ...prev.filter((old: ExploreWatchHistory) => !(old.user_id === userId && old.videoId === video.embedId)),
        ];
        localStorage.setItem('exploreWatchHistory', JSON.stringify(merged));
    }
} 