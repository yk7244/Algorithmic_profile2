import { ExploreWatchHistory } from '@/app/types/profile';
// VideoData 타입이 프로젝트 내 어디에 정의되어 있는지에 따라 import 경로를 맞춰주세요.
// 예시: import { VideoData } from '@/app/types/video';

export interface VideoData {
embedId: string;
title: string;
description?: string;
// 필요한 필드 추가
}

export function saveWatchedVideoToLocalStorage(video: VideoData, userId = 'guest') {
const prev: ExploreWatchHistory[] = JSON.parse(localStorage.getItem('exploreWatchHistory') || '[]');
const newRecord: ExploreWatchHistory = {
    id: `${userId}-${video.embedId}`,
    user_id: userId,
    videoId: video.embedId,
    title: video.title,
    description: video.description || '',
    timestamp: new Date().toISOString(),
};
const merged = [
    newRecord,
    ...prev.filter((old: ExploreWatchHistory) => !(old.user_id === userId && old.videoId === video.embedId)),
];
localStorage.setItem('exploreWatchHistory', JSON.stringify(merged));
} 