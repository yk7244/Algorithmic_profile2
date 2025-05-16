import { fetchVideoMetadata } from './videoInfo';

export interface JSONWatchHistoryItem {
  titleUrl?: string;
  title: string;
  time: string;
  subtitles?: Array<{ name: string }>;
  header?: string;
}

export interface ProcessedWatchHistoryItem {
  videoId: string;
  title: string;
  date: Date;
  description?: string;
  channel: string;
  tags: string[];
  keywords: string[];
  timestamp: string;
}

// JSON 파일 파싱 함수
export const parseJSONWatchHistory = async (
  file: File,
  dateRange?: { from?: Date; to?: Date },
  maxVideosPerDay: number = 5,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedWatchHistoryItem[]> => {
  try {
    console.log('📁 Starting JSON watch history parsing...');
    const text = await file.text();
    let rawData = JSON.parse(text);

    // watchHistory 내부에 있을 수 있음
    if (!Array.isArray(rawData)) {
      if (Array.isArray(rawData.watchHistory)) {
        rawData = rawData.watchHistory;
      } else {
        throw new Error("❌ JSON 구조 오류: 배열이 아닙니다.");
      }
    }

    console.log(`🔍 총 ${rawData.length}개의 기록을 발견했습니다.`);

    const mapped = rawData
      .map((item: JSONWatchHistoryItem) => {
        if (!item.titleUrl || !item.titleUrl.includes('/watch')) return null;

        const videoIdMatch = item.titleUrl.match(/v=([^&]+)/);
        if (!videoIdMatch) return null;

        const videoId = videoIdMatch[1];
        const date = new Date(item.time);
        if (isNaN(date.getTime())) return null;

        return {
          videoId,
          title: item.title,
          date,
          timestamp: item.time,
          tags: [],
          keywords: [],
          channel: item.subtitles?.[0]?.name || 'Unknown Channel',
        };
      })
      .filter((item): item is ProcessedWatchHistoryItem => item !== null);

    console.log(`✅ 유효한 항목: ${mapped.length}개`);

    // 날짜 필터링
    const filtered = mapped.filter((item) => {
      if (dateRange?.from && item.date < dateRange.from) return false;
      if (dateRange?.to && item.date > dateRange.to) return false;
      return true;
    });

    console.log(`📆 필터링된 항목: ${filtered.length}개`);

    // 날짜별 그룹 + 하루 최대
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

    const processed: ProcessedWatchHistoryItem[] = [];
    let count = 0;

    for (const item of selectedItems) {
      try {
        const enriched = await fetchVideoMetadata(item.videoId);

        if (enriched) {
          processed.push({
            videoId: item.videoId,
            title: enriched.title || item.title,
            date: item.date,
            description: enriched.description || '',
            channel: enriched.channel || item.channel,
            tags: enriched.tags || [],
            keywords: enriched.keywords || [],
            timestamp: item.timestamp,
          });
        } else {
          console.warn(`⚠️ ${item.videoId} 처리 실패, 기본값으로 진행`);
          processed.push({
            ...item,
            description: '',
            tags: [],
            keywords: [],
          });
        }
      } catch (error) {
        console.error(`❌ ${item.videoId} 처리 중 에러 발생:`, error);
        processed.push({
          ...item,
          description: '',
          tags: [],
          keywords: [],
        });
      }

      count++;
      onProgress?.(count, selectedItems.length);
    }

    console.log(`🎉 처리 완료: ${processed.length}개 저장됨`);
    return processed;
  } catch (err) {
    console.error('❌ JSON 파싱 오류:', err);
    throw err;
  }
};
