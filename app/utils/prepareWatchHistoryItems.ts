// prepareWatchHistoryItems.ts
import type { ProcessedWatchHistoryItem } from './jsonParser';
import { fetchVideoMetadata } from './videoInfo';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const prepareWatchHistoryItems = async (
  items: {
    videoId: string;
    title: string;
    date: Date;
    timestamp: string;
  }[]
): Promise<ProcessedWatchHistoryItem[]> => {
  // localStorage 캐시 제거
  const videoIds = items.map(i => i.videoId);
  // Supabase DB에서 이미 저장된 영상 찾기
  const { data: cachedVideos } = await supabase
    .from('videos')
    .select('id, title, description, channel_name, channel_id, tags, keywords, url')
    .in('id', videoIds);
  const cachedMap = new Map();
  if (cachedVideos) {
    for (const v of cachedVideos) {
      cachedMap.set(v.id, v);
    }
  }
  const results: ProcessedWatchHistoryItem[] = await Promise.all(items.map(async item => {
    // Supabase DB 캐시 우선
    if (cachedMap.has(item.videoId)) {
      const v = cachedMap.get(item.videoId);
      return {
        videoId: item.videoId,
        title: v.title || item.title,
        description: v.description || '',
        channel: v.channel_name || 'Unknown Channel',
        channelId: v.channel_id ? String(v.channel_id) : undefined,
        tags: v.tags || [],
        keywords: v.keywords || [],
        url: v.url || `https://www.youtube.com/watch?v=${item.videoId}`,
        date: item.date,
        timestamp: item.timestamp
      };
    }
    // YouTube API 호출
    const enriched = await fetchVideoMetadata(item.videoId);
    if (enriched) {
      return {
        videoId: item.videoId,
        title: enriched.title || item.title,
        description: enriched.description || '',
        channel: enriched.channel || 'Unknown Channel',
        channelId: enriched.channelId || undefined,
        tags: enriched.tags || [],
        keywords: enriched.keywords || [],
        url: enriched.url || `https://www.youtube.com/watch?v=${item.videoId}`,
        date: item.date,
        timestamp: item.timestamp
      };
    } else {
      // API 실패 시 최소 정보만 저장
      return {
        videoId: item.videoId,
        title: item.title,
        description: '',
        channel: 'Unknown Channel',
        channelId: undefined,
        tags: [],
        keywords: [],
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        date: item.date,
        timestamp: item.timestamp
      };
    }
  }));
  return results;
};
