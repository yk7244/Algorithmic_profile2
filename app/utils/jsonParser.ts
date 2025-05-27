import { prepareWatchHistoryItems } from './prepareWatchHistoryItems';
import { createClient } from '@supabase/supabase-js';

export interface ProcessedWatchHistoryItem {
  videoId: string;
  title: string;
  date: Date;
  description?: string;
  channel: string;
  channelId?: string;
  tags: string[];
  keywords: string[];
  url?: string;
  timestamp: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ 유튜브 링크에서 videoId 추출
const extractVideoIdFromUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    // 1. v= 파라미터
    const parsed = new URL(url);
    const v = parsed.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    // 2. youtu.be/xxxx
    const matchShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (matchShort) return matchShort[1];

    // 3. /shorts/xxxx
    const matchShorts = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (matchShorts) return matchShorts[1];

    // 4. /embed/xxxx
    const matchEmbed = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (matchEmbed) return matchEmbed[1];

    return null;
  } catch {
    return null;
  }
};

export const parseJSONWatchHistory = async (
  file: File,
  dateRange?: { from?: Date; to?: Date },
  maxVideosPerDay: number = 5,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedWatchHistoryItem[]> => {
  try {
    console.log('📁 JSON 시청기록 파싱 시작');
    const text = await file.text();
    let rawData = JSON.parse(text);

    if (!Array.isArray(rawData)) {
      if (Array.isArray(rawData.watchHistory)) {
        rawData = rawData.watchHistory;
      } else {
        throw new Error("❌ JSON에 watchHistory 배열이 없습니다.");
      }
    }

    console.log(`🔍 총 ${rawData.length}개의 항목 발견`);

    // ✅ YouTube Music, 커뮤니티 포스트, 외부 링크 제외
    const cleaned = rawData.filter((item: any) => {
      const isMusic = item.header?.includes('YouTube Music') || item.titleUrl?.includes('music.youtube.com');
      const isCommunityPost = item.titleUrl?.includes('/post/');
      const isExternal = item.titleUrl?.includes('google.com/url?');
      const isEmptyWatch = item.titleUrl?.endsWith('watch?v=');
      return !isMusic && !isCommunityPost && !isExternal && !isEmptyWatch;
    });

    console.log(`🎵 유효 항목 필터링 후: ${cleaned.length}개`);

    const mapped = cleaned
      .map((item: any) => {
        const videoId = item.videoId || extractVideoIdFromUrl(item.titleUrl);
        if (!videoId) {
          console.warn('⚠️ videoId 추출 실패:', item.titleUrl);
          return null;
        }

        // time → timestamp 보정
        const timestamp = item.timestamp || item.time;
        if (!item.title || !timestamp) return null;

        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return null;

        return {
          videoId,
          title: item.title,
          tags: item.tags || [],
          keywords: item.keywords || [],
          date,
          timestamp,
        };
      })
      .filter((item): item is ProcessedWatchHistoryItem => item !== null);

    const filtered = mapped.filter((item) => {
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      return true;
    });

    const groupedByDate: Record<string, ProcessedWatchHistoryItem[]> = {};
    for (const item of filtered) {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      if (groupedByDate[dateKey].length < maxVideosPerDay) {
        groupedByDate[dateKey].push(item);
      }
    }

    const selectedItems = Object.values(groupedByDate).flat();
    console.log(`🧩 최종 선택된 항목: ${selectedItems.length}개`);

    // ✅ 캐싱 기반 메타데이터 처리 (API 최소화)
    const processed = await prepareWatchHistoryItems(selectedItems);

    // ✅ 진행 상태 콜백
    if (onProgress) {
      for (let i = 0; i < processed.length; i++) {
        onProgress(i + 1, processed.length);
      }
    }

    console.log(`🎉 처리 완료: ${processed.length}개`);
    return processed;
  } catch (err) {
    console.error('❌ JSON 파싱 오류:', err);
    throw err;
  }
};
