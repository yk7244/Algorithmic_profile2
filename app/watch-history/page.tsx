"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2 } from "lucide-react";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WatchHistoryItem = {
  title: string;
  embedId: string;
  timestamp: number;
};

export default function WatchHistoryPage() {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWatchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // 세션 확인
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session?.user?.id) {
          // Supabase에서 시청기록 불러오기
          const { data, error } = await supabase
            .from('WatchHistoryItem')
            .select('title, embed_id, timestamp')
            .eq('user_id', session.user.id)
            .order('watched_at', { ascending: false });

          if (error) {
            console.error('❌ Supabase 시청기록 오류:', error);
            throw new Error('시청기록을 불러오는 중 오류가 발생했습니다.');
          }

          const formatted: WatchHistoryItem[] = (data || []).map(item => ({
            title: item.title,
            embedId: item.embed_id,
            timestamp: item.timestamp,
          }));

          setWatchHistory(formatted);
        }
      } catch (err: any) {
        setError(err.message || '시청기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadWatchHistory();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">시청 기록</h1>

        {loading ? (
          <p className="text-center text-gray-500">불러오는 중...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : watchHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 시청 기록이 없습니다.</p>
        ) : (
          <div className="grid gap-8">
            {watchHistory.map((video, idx) => (
              <div key={idx} className="space-y-2 bg-white rounded-lg p-6 shadow-sm">
                <h5 className="text-lg font-medium text-gray-800 mb-2">{video.title}</h5>
                <div className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.embedId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">시청함</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(video.timestamp).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
