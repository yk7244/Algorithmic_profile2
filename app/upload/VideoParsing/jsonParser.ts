//import { fetchVideoInfo } from '../VideoAnalysis/fetchVideoInfo';
import {fetchVideoInfo} from '../VideoAnalysis/videoKeyword';
import { OpenAILogger } from '../../utils/init-logger';
import { saveParseHistory } from '../../utils/save/saveParseHistory';

// Define types for JSON watch history
interface JSONWatchHistoryItem {
  titleUrl?: string;
  title: string;
  time: string;
  subtitles?: Array<{ name: string }>;
  header?: string;
}

interface ProcessedWatchHistoryItem {
  videoId: string;
  title: string;
  channel: string;
  date: Date;
  keywords: string[];
  tags: string[];
}

// 파싱함수(파일 업로드 시 호출)
export const parseJSONWatchHistory = async (
  file: File,
  dateRange?: { from: Date | undefined; to: Date | undefined },
  maxVideosPerDay: number = 5,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedWatchHistoryItem[]> => {
  try {
    console.log('Starting JSON watch history parsing...');
    console.log("✅dateRange", dateRange);
    console.log("✅maxVideosPerDay", maxVideosPerDay);
    
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid JSON format: Expected an array');
    }

    console.log(`Found ${data.length} items in JSON file`);

    // Extract and validate required fields
    const watchItems = data
      .map((item: JSONWatchHistoryItem) => {
        // Skip survey items and other non-video content
        if (item.header === 'YouTube' && item.title === 'Answered survey question') {
          return null;
        }

        // Skip items without titleUrl
        if (!item.titleUrl) {
          return null;
        }

        // Skip non-YouTube URLs
        if (!item.titleUrl.includes('youtube.com/watch')) {
          return null;
        }

        // Extract video ID from titleUrl
        const videoIdMatch = item.titleUrl.match(/v=([^&]+)/);
        if (!videoIdMatch) {
          return null;
        }

        const videoId = videoIdMatch[1];
        if (!videoId) {
          return null;
        }

        const date = new Date(item.time);
        
        return {
          videoId,
          title: item.title,
          channel: item.subtitles?.[0]?.name || 'Unknown Channel',
          date,
          keywords: [], // Initialize empty keywords array
          tags: [] // Initialize empty tags array
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    console.log(`1)파싱된 영상 수: ${watchItems.length}개`);

    // Apply date range filtering if specified
    let filteredItems = watchItems;
    if (dateRange?.from && dateRange?.to) {
      filteredItems = watchItems.filter(item => 
        item.date >= dateRange.from! && item.date <= dateRange.to!
      );
      console.log(`2)날짜 범위 필터링 후 영상 수: ${filteredItems.length}개`);
    }

    // Group by date and limit videos per day
    const groupedByDate = filteredItems.reduce((acc, item) => {
      const dateStr = item.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      if (acc[dateStr].length < maxVideosPerDay) {
        acc[dateStr].push(item);
      }
      return acc;
    }, {} as Record<string, typeof filteredItems>);

    const selectedItems = Object.values(groupedByDate).flat();
    console.log(`3)그룹화 및 제한 후 영상 수: ${selectedItems.length}개`);
    console.log('selectedItems:', selectedItems);
    saveParseHistory(selectedItems);

    return selectedItems;
    
  } catch (error) {
    console.error('Error parsing JSON watch history:', error);
    throw error;
  }
};

 

