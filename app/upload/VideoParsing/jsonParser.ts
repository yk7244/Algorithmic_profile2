//import { fetchVideoInfo } from '../VideoAnalysis/fetchVideoInfo';
import {fetchVideoInfo} from '../VideoAnalysis/videoKeyword';
import { OpenAILogger } from '../../utils/init-logger';

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
    
    console.log('📄 JSON 파일 구조 분석:', {
      'data 타입': typeof data,
      'Array인지': Array.isArray(data),
      'Object keys': typeof data === 'object' && data !== null ? Object.keys(data) : '없음',
      '첫 번째 속성 미리보기': typeof data === 'object' && data !== null && !Array.isArray(data) ? Object.keys(data)[0] : '없음'
    });

    // 🆕 다양한 JSON 구조 지원
    let watchHistoryArray: JSONWatchHistoryItem[] = [];
    
    if (Array.isArray(data)) {
      // 이미 배열인 경우
      console.log('✅ JSON이 배열 형태입니다');
      watchHistoryArray = data;
    } else if (data && typeof data === 'object') {
      // 객체인 경우 - 다양한 속성명 시도
      const possibleKeys = ['watchHistory', 'history', 'items', 'data', 'watch_history'];
      let found = false;
      
      for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
          console.log(`✅ JSON 객체에서 "${key}" 속성을 배열로 발견`);
          watchHistoryArray = data[key];
          found = true;
          break;
        }
      }
      
      if (!found) {
        // 객체의 모든 값 중에서 배열 찾기
        const objectValues = Object.values(data);
        const arrayValue = objectValues.find(value => Array.isArray(value));
        
        if (arrayValue) {
          console.log('✅ JSON 객체의 값 중에서 배열 발견');
          watchHistoryArray = arrayValue as JSONWatchHistoryItem[];
        } else {
          // 객체의 첫 번째 레벨 속성들을 모두 확인
          console.log('🔍 JSON 구조 상세 분석:');
          Object.entries(data).forEach(([key, value]) => {
            console.log(`  ${key}: ${typeof value}, Array: ${Array.isArray(value)}, Length: ${Array.isArray(value) ? value.length : 'N/A'}`);
          });
          
          throw new Error(`Invalid JSON format: 배열을 찾을 수 없습니다. 
            사용 가능한 속성: ${Object.keys(data).join(', ')}
            Google Takeout YouTube 시청기록 JSON 파일인지 확인해주세요.`);
        }
      }
    } else {
      throw new Error('Invalid JSON format: 유효하지 않은 JSON 구조입니다.');
    }

    console.log(`Found ${watchHistoryArray.length} items in JSON file`);

    // Extract and validate required fields
    const watchItems = watchHistoryArray
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

    return selectedItems;
    
  } catch (error) {
    console.error('Error parsing JSON watch history:', error);
    throw error;
  }
};

// 키워드 추출 함수([관리자용] keyword 추출 버튼 클릭 시 호출)
// selectedItems를 받아 각 영상의 정보를 fetchVideoInfo로 가져오고, 키워드를 가공하여 반환하는 함수
export async function processSelectedItems(
  selectedItems: any[], 
  fetchVideoInfo: any, 
  onProgress?: (current: number, total: number) => void,
  forceRefresh: boolean = false
) {
  const processedItems: any[] = [];
  let processedCount = 0;
  const totalItems = selectedItems.length;
  let cacheHits = 0;
  let apiCalls = 0;

  console.log(`🔄 processSelectedItems 시작: ${totalItems}개 영상 처리 (${forceRefresh ? '강제 새로고침' : '캐시 활용'} 모드)`);

  if (onProgress) {
    onProgress(0, totalItems);
  }

  for (const item of selectedItems) {
    try {
      console.log(`📹 처리 중: ${item.videoId} (${item.title?.slice(0, 30)}...)`);
      
      // 🆕 캐시 상태 사전 확인 (forceRefresh=false일 때만)
      if (!forceRefresh) {
        try {
          const { getCachedVideo, isCacheExpired } = await import('@/lib/database');
          const cached = await getCachedVideo(item.videoId);
          if (cached && !isCacheExpired(cached.last_fetched_at)) {
            console.log(`📦 캐시 HIT: ${item.videoId}`);
            cacheHits++;
          } else {
            console.log(`🌐 API 호출: ${item.videoId} ${cached ? '(캐시 만료)' : '(캐시 없음)'}`);
            apiCalls++;
          }
        } catch (cacheCheckError) {
          console.log(`🌐 API 호출: ${item.videoId} (캐시 확인 실패)`);
          apiCalls++;
        }
      } else {
        console.log(`🔄 강제 API 호출: ${item.videoId}`);
        apiCalls++;
      }

      // 🆕 forceRefresh 파라미터를 fetchVideoInfo에 전달
      const videoInfo = await fetchVideoInfo(item.videoId, forceRefresh);
      console.log('⭐️videoInfo:', videoInfo);
      if (videoInfo != null) {
        processedItems.push({
          videoId: videoInfo.videoId,
          title: videoInfo.title,
          channel: item.channel,
          date: item.date,
          keywords: videoInfo.keywords,
          tags: videoInfo.tags,
          timestamp: new Date().toISOString()
        });
      }
      processedCount++;
      if (onProgress) {
        onProgress(processedCount, totalItems);
      }
    } catch (error) {
      console.error(`Failed to process video ${item.videoId}:`, error);
      processedCount++;
      if (onProgress) {
        onProgress(processedCount, totalItems);
      }
    }
  }

  console.log(`✅ processSelectedItems 완료:`, {
    '총 처리': totalItems,
    '성공': processedItems.length,
    '실패': totalItems - processedItems.length,
    '캐시 히트': cacheHits,
    'API 호출': apiCalls,
    '캐시 효율': cacheHits > 0 ? `${Math.round((cacheHits / (cacheHits + apiCalls)) * 100)}%` : '0%'
  });
  
  return processedItems;
} 

