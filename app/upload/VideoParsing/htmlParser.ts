import { VideoCluster } from '../VideoAnalysis/videoCluster';
import { saveWatchHistory } from '@/app/utils/save/saveWatchHistory';

export const parseWatchHistory = async (
  file: File,
  dateRange: { from: Date | undefined; to: Date | undefined },
  maxVideosPerDay: number,
  setSuccessCount: (count: number) => void,
  fetchVideoInfo: (videoId: string) => Promise<boolean>,
  setError: (msg: string) => void,
  openai: any,
  OpenAILogger: any
) => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    // 시청기록 항목 추출
    const watchItems = Array.from(doc.querySelectorAll('.content-cell'));
    
    console.log('Found watch items:', watchItems.length);
    
    // 시청기록 데이터 추출
    const watchHistory = watchItems
      .map((item): any => {
        try {
          const titleElement = item.querySelector('a');
          if (!titleElement) return null;

          const title = titleElement.textContent?.split(' 을(를) 시청했습니다.')[0];
          if (!title) return null;

          const videoUrl = titleElement.getAttribute('href') || '';
          const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];

          const channelElement = item.querySelector('a:nth-child(3)');
          const channelName = channelElement?.textContent || '';

          const dateText = item.textContent || '';
          const dateMatch = dateText.match(/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/);
          if (!dateMatch) return null;

          const date = new Date(dateMatch[0].replace(/\./g, '-'));

          // 광고 영상 필터링
          const isAd = (
            title.includes('광고') || 
            title.includes('Advertising') ||
            title.includes('AD:') ||
            channelName.includes('광고') ||
            videoUrl.includes('/ads/') ||
            videoUrl.includes('&ad_type=') ||
            videoUrl.includes('&adformat=')
          );

          if (isAd) return null;
          if (!videoId) return null;

          return {
            title,
            videoId,
            channelName,
            date,
            url: `https://youtube.com/watch?v=${videoId}`,
            keywords: [], // Initialize empty keywords array
            tags: [], // Initialize empty tags array
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error('항목 파싱 실패:', error);
          return null;
        }
      })
      .filter(item => item !== null);

    // 날짜 필터링 로직 추가
    const filteredWatchHistory = watchHistory.filter(item => {
      if (!dateRange.from || !dateRange.to) return true;
      const itemDate = new Date(item.date);
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    });

    if (filteredWatchHistory.length === 0) {
      throw new Error('선택한 기간에 시청기록이 없습니다.');
    }

    // 날짜별로 그룹화
    const groupedByDate = filteredWatchHistory.reduce((acc: { [key: string]: any[] }, item) => {
      const dateStr = item.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(item);
      return acc;
    }, {});

    // 날짜별로 정렬
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // 각 날짜에서 maxVideosPerDay만큼 선택하고, 전체 200개로 제한
    let selectedVideos: any[] = [];
    let totalSelected = 0;
    const TOTAL_LIMIT = 200;

    for (const dateStr of sortedDates) {
      if (totalSelected >= TOTAL_LIMIT) break;

      // Shuffle the videos for this day
      const dailyVideos = groupedByDate[dateStr]
        .sort(() => Math.random() - 0.5) // Randomly shuffle videos within each day
        .slice(0, Math.min(maxVideosPerDay, TOTAL_LIMIT - totalSelected));

      selectedVideos = [...selectedVideos, ...dailyVideos];
      totalSelected += dailyVideos.length;
    }

    // 파싱 결과 로깅
    console.log('\n=== Watch History Parse Results ===');
    console.log('Total items found:', watchItems.length);
    console.log('After filtering ads:', watchHistory.length);
    console.log('After date filtering:', filteredWatchHistory.length);
    console.log('Final selected videos:', selectedVideos.length);
    console.log('Date range:', {
      from: dateRange.from?.toISOString(),
      to: dateRange.to?.toISOString()
    });
    console.log('Sample of first 3 videos:', selectedVideos.slice(0, 3).map(v => ({
      title: v.title,
      videoId: v.videoId,
      date: v.date.toISOString()
    })));
    console.log('===================================\n');

    // 각 비디오 정보 가져오기 (병렬 처리로 최적화)
    let successCount = 0;
    const batchSize = 3; // 한 번에 처리할 비디오 수를 3개로 줄임
    const totalVideos = selectedVideos.length;

    // 각 비디오 정보 가져오기
    for (let i = 0; i < selectedVideos.length; i += batchSize) {
      const batch = selectedVideos.slice(i, i + batchSize);
      console.log(`배치 ${Math.floor(i/batchSize) + 1} 처리 시작:`, batch);

      try {
        const results = await Promise.all(
          batch.map(async (item) => {
            try {
              console.log(`비디오 처리 시작: ${item.videoId}`);
              const success = await fetchVideoInfo(item.videoId);
              console.log(`비디오 처리 결과: ${item.videoId} - ${success ? '성공' : '실패'}`);
              return success;
            } catch (error) {
              console.error(`비디오 정보 가져오기 실패 (${item.videoId}):`, error);
              return false;
            }
          })
        );

        // 성공한 비디오 수 업데이트
        const batchSuccessCount = results.filter(Boolean).length;
        successCount += batchSuccessCount;
        
        console.log(`배치 처리 완료: ${batchSuccessCount}개 성공 (총 ${successCount}/${totalVideos})`);
        
        // 상태 업데이트
        setSuccessCount(successCount);
        
        // API 호출 간격 조절 (2초로 증가)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`배치 처리 중 오류 발생:`, error);
      }
    }

    // 최종 결과 확인
    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    console.log('저장된 시청 기록:', savedHistory);
    
    alert(`${successCount}개의 시청기록이 성공적으로 처리되었습니다! (총 ${totalVideos}개 중)`);

    // 저장된 시청 기록 분석
    if (savedHistory.length > 0) {
      const clusters = await VideoCluster(savedHistory, openai, OpenAILogger);
      saveWatchHistory(clusters);

      console.log('분석 완료:', {
        totalVideos: savedHistory.length,
        totalClusters: clusters.length,
        topCategories: clusters.slice(0, 3).map((c: any) => ({
          category: c.main_keyword,
          strength: c.strength
        }))
      });
    } else {
      console.error('저장된 시청 기록이 없습니다.');
      alert('시청 기록이 저장되지 않았습니다. 다시 시도해주세요.');
    }
  } catch (err) {
    console.error('시청기록 파싱 실패:', err);
    setError(err instanceof Error ? err.message : '시청기록 파일 처리 중 오류가 발생했습니다.');
  }
}; 