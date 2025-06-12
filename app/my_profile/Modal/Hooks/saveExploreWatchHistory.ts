import { ExploreWatchHistory } from '@/app/types/profile';
import { saveExploreWatchHistoryItem, getCurrentUserId, ensureUserExists } from '@/lib/database';
// VideoData 타입이 프로젝트 내 어디에 정의되어 있는지에 따라 import 경로를 맞춰주세요.
// 예시: import { VideoData } from '@/app/types/video';

export interface VideoData {
embedId: string;
title: string;
description?: string;
// 필요한 필드 추가
}

// 🆕 ExploreWatchHistory 전용으로 완전히 분리
export async function saveWatchedVideoToLocalStorage(video: VideoData, userId?: string) {
  try {
    // 사용자 ID 확인
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) {
      console.log('[ExploreWatchHistory] 로그인되지 않음, localStorage fallback');
      saveToLocalStorageOnly(video, 'guest');
      return;
    }

    // 사용자 존재 확인
    await ensureUserExists();

    // 🆕 ExploreWatchHistory 테이블에 저장 (WatchHistory와 완전 분리)
    const newRecord: Omit<ExploreWatchHistory, 'id'> = {
      user_id: currentUserId,
      videoId: video.embedId,
      title: video.title,
      description: video.description || '',
      timestamp: new Date().toISOString(),
    };

    await saveExploreWatchHistoryItem(newRecord);
    console.log('[ExploreWatchHistory] DB 저장 완료 (explore_watch_history 테이블):', video.title);

    // 성공 시 localStorage에도 캐시
    saveToLocalStorageOnly(video, currentUserId);

  } catch (error) {
    console.error('[ExploreWatchHistory] DB 저장 실패, localStorage fallback:', error);
    // DB 저장 실패 시 localStorage로 fallback
    const fallbackUserId = userId || 'guest';
    saveToLocalStorageOnly(video, fallbackUserId);
  }
}

// localStorage 저장 헬퍼 함수
function saveToLocalStorageOnly(video: VideoData, userId: string) {
  try {
    // 🆕 사용자별 localStorage 키 사용
    const cacheKey = userId === 'guest' ? 'exploreWatchHistory' : `exploreWatchHistory_${userId}`;
    const prev: ExploreWatchHistory[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    
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
    
    localStorage.setItem(cacheKey, JSON.stringify(merged));
    console.log(`[ExploreWatchHistory] 사용자별 localStorage 저장 완료: ${cacheKey}`);
  } catch (error) {
    console.error('[ExploreWatchHistory] localStorage 저장도 실패:', error);
  }
} 