"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WatchHistoryItem = {
  videoId: string;
  title: string;
  timestamp: number;
  embed_id: string;
};

export default function WatchHistoryPlayer() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 시청 기록 로드
  useEffect(() => {
    const loadWatchHistory = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session?.user?.id) {
          throw new Error('로그인이 필요합니다.');
        }

        const { data, error } = await supabase
          .from('WatchHistoryItem')
          .select('*')
          .eq('user_id', session.user.id)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        setWatchHistory(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWatchHistory();
  }, []);

  // 자동 재생
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying && watchHistory.length > 0) {
      intervalId = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= watchHistory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000); // 5초마다 다음 영상
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, watchHistory.length]);

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (watchHistory.length === 0) {
    return <div className="text-center py-4">시청 기록이 없습니다.</div>;
  }

  const currentVideo = watchHistory[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">시청 기록 재생</h2>
        
        {/* 현재 영상 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">{currentVideo.title}</h3>
          <p className="text-sm text-gray-500">
            {new Date(currentVideo.timestamp).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* YouTube 플레이어 */}
        <div className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${currentVideo.embed_id}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(prev => Math.min(watchHistory.length - 1, prev + 1))}
              disabled={currentIndex === watchHistory.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {watchHistory.length}
          </div>
        </div>

        {/* 진행 바 */}
        <div className="relative w-full h-1 bg-gray-100 rounded-full">
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{
              width: `${((currentIndex + 1) / watchHistory.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
} 