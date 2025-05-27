// prepareWatchHistoryItems.ts
import { ProcessedWatchHistoryItem } from './jsonParser';
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
  const videoIds = items.map(i => i.videoId);
  const { data: cachedVideos } = await supabase
    .from('videos')
    .select('id')
    .in('id', videoIds);

  const cachedSet = new Set(cachedVideos?.map(v => v.id));

  const result: ProcessedWatchHistoryItem[] = [];

  const results = await Promise.all(items.map(async item => {
    const needFetch = !cachedSet.has(item.videoId);
    const enriched = needFetch ? await fetchVideoMetadata(item.videoId) : undefined;

    if (needFetch && !enriched) {
      console.warn('❌ YouTube API에서 메타데이터를 받아오지 못함:', item.videoId, item.title);
    }

    return {
        videoId: item.videoId,
        title: enriched?.title || item.title,
        description: enriched?.description || '',
        channel: enriched?.channel || 'Unknown Channel',
        channelId: enriched && typeof (enriched as any).channelId === 'string' ? (enriched as any).channelId : undefined,
        tags: enriched?.tags || [],
        keywords: enriched?.keywords || [],
        url: enriched?.url || `https://www.youtube.com/watch?v=${item.videoId}`,
        date: item.date,
        timestamp: item.timestamp
    };
    }));

    return results;
};
