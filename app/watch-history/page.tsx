"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getWatchHistory, getExploreWatchHistory, getCurrentUserId } from '@/lib/database';
import { WatchHistory, ExploreWatchHistory } from '@/app/types/profile';

interface WatchHistoryItem {
  id?: string;
  videoId?: string;
  embedId?: string; // 호환성을 위해 추가
  title: string;
  description?: string;
  source?: string; // ✅ 다시 활성화 - 시청 출처 구분
  timestamp: string;
}

export default function WatchHistoryPage() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWatchHistory = async () => {
      try {
        setIsLoading(true);
        const userId = await getCurrentUserId();
        
        if (!userId) {
          console.log('[WatchHistory] 로그인되지 않음, 빈 상태로 초기화');
          setWatchHistory([]);
          setIsLoading(false);
          return;
        }

        // DB-first: WatchHistory와 ExploreWatchHistory 모두 가져와서 합치기
        try {
          const dbWatchHistory = await getWatchHistory(userId, 100); // Upload 시청기록
          const exploreWatchHistory = await getExploreWatchHistory(userId, 100); // 🆕 탐색 시청기록

          let allHistory: WatchHistoryItem[] = [];

          // WatchHistory 데이터 변환
          if (dbWatchHistory && dbWatchHistory.length > 0) {
            const watchFormatted = dbWatchHistory.map((item: any) => ({
              id: item.id,
              videoId: item.video_id,
              title: item.title,
              description: item.description,
              source: item.source || 'upload', // 기본값을 upload로 설정
              timestamp: item.timestamp
            }));
            allHistory = [...allHistory, ...watchFormatted];
          }

          // 🆕 ExploreWatchHistory 데이터 변환
          if (exploreWatchHistory && exploreWatchHistory.length > 0) {
            const exploreFormatted = exploreWatchHistory.map((item: any) => ({
              id: item.id,
              videoId: item.video_id,
              title: item.title,
              description: item.description,
              source: 'explore', // ExploreWatchHistory는 항상 explore
              timestamp: item.timestamp
            }));
            allHistory = [...allHistory, ...exploreFormatted];
          }

          if (allHistory.length > 0) {
            // 시간순 정렬 및 중복 제거
            allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const uniqueHistory = allHistory.filter((item, index, self) => 
              index === self.findIndex((t) => t.videoId === item.videoId)
            );

            setWatchHistory(uniqueHistory);
            console.log('[WatchHistory] DB에서 통합 시청기록 로드 완료:', uniqueHistory.length);
            console.log(`- Upload 기록: ${dbWatchHistory?.length || 0}개`);
            console.log(`- Explore 기록: ${exploreWatchHistory?.length || 0}개`);

          } else {
            console.log('[WatchHistory] DB에 시청기록 없음, localStorage fallback');
            await loadFromLocalStorage(userId);
          }

        } catch (dbError) {
          console.error('[WatchHistory] DB 로드 실패, localStorage fallback:', dbError);
          // 사용자별 localStorage에서 로드
          await loadFromLocalStorage(userId);
        }

      } catch (error) {
        console.error('[WatchHistory] 시청기록 로드 전체 실패:', error);
        setWatchHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    // 사용자별 localStorage fallback 함수
    const loadFromLocalStorage = async (userId: string) => {
      try {
        // 통합 시청기록 우선 확인
        const combinedKey = `watchHistory_${userId}`;
        const combinedHistory = localStorage.getItem(combinedKey);
        
        if (combinedHistory) {
          const parsed = JSON.parse(combinedHistory);
          setWatchHistory(parsed);
          console.log(`[WatchHistory] 사용자별 통합 localStorage에서 로드: ${parsed.length}개`);
          return;
        }

        // 개별 키에서 로드 시도 (레거시 호환성)
        const watchKey = `watchHistory_${userId}`;
        const exploreKey = `exploreWatchHistory_${userId}`;
        
        const watchData = localStorage.getItem(watchKey);
        const exploreData = localStorage.getItem(exploreKey);

        let history: WatchHistoryItem[] = [];
        
        if (watchData) {
          const watchParsed = JSON.parse(watchData);
          if (Array.isArray(watchParsed)) {
            history = [...history, ...watchParsed];
          }
        }

        if (exploreData) {
          const exploreParsed = JSON.parse(exploreData);
          if (Array.isArray(exploreParsed)) {
            history = [...history, ...exploreParsed];
          }
        }

        // 중복 제거 및 정렬
        const uniqueHistory = history.filter((item, index, self) => 
          index === self.findIndex((t) => (t.videoId || t.embedId) === (item.videoId || item.embedId))
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setWatchHistory(uniqueHistory);
        console.log(`[WatchHistory] 사용자별 개별 localStorage에서 로드: ${uniqueHistory.length}개`);

      } catch (fallbackError) {
        console.error('[WatchHistory] localStorage 로드 실패:', fallbackError);
        setWatchHistory([]);
      }
    };

    loadWatchHistory();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">시청 기록</h1>
          <div className="flex justify-center py-8">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">시청 기록</h1>
          <div className="grid gap-8">
            {watchHistory.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                <p className="text-gray-500 text-lg">아직 시청 기록이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">동영상을 시청하면 여기에 기록됩니다.</p>
              </div>
            ) : (
              watchHistory.map((video, idx) => (
                <div key={idx} className="space-y-2 bg-white rounded-lg p-6 shadow-sm">
                  <h5 className="text-lg font-medium text-gray-800 mb-2">{video.title}</h5>
                  <div className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.videoId || video.embedId}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">시청함</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        video.source === 'explore' 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {video.source === 'explore' ? '🌐 탐색' : '📤 업로드'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(video.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="w-full h-14 flex items-center justify-end px-8"
          style={{
            background: "linear-gradient(90deg, #cfd4f7 0%, #6d7cf7 100%)"
          }}
        >
          <Link href="/upload"> 
            <button
              className="bg-white text-black font-semibold rounded-full px-6 py-2 shadow-lg text-sm hover:bg-gray-100 transition"
              style={{ minWidth: 120 }}
            >
              프로필 업데이트 하기
            </button>
          </Link>
        </div>
      </div>
    </>
  );
} 