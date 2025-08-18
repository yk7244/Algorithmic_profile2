import OpenAI from 'openai';
import { OpenAILogger } from '../../utils/init-logger';
import { saveWatchHistory } from '@/app/utils/save/saveWatchHistory';  
import { saveWatchHistory_array } from '@/app/utils/save/saveWatchHistory_array';  
import { getWatchHistory } from '@/app/utils/get/getWatchHistory';
import { 
  getCachedVideoInfo, 
  upsertVideo, 
  convertYouTubeResponseToVideoData,
  updateVideoKeywords,
  getBulkCachedVideoInfo
} from '@/lib/database-clean';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

type VideoInfo = {
  videoId: string; //id
  title: string;
  description?: string;

  //channel_id
  //published_at  
  //thumbnail_url
  //comment_count
  //channel_name
  //url

  tags: string[];
  keywords: any[];
  timestamp: string; //없음
};

// STEP2.키워드 추출 함수 (타임아웃 적용)
const extractVideoKeywords = async (videoInfo: any): Promise<string[]> => {
  try {
    console.log('🔄 키워드 추출 시작:', {
      title: videoInfo.title,
      description: videoInfo.description?.slice(0, 100),
      tags: videoInfo.tags
    });

    const prompt = `
당신은 YouTube 영상 콘텐츠 분석 전문가입니다. 
다음 영상의 정보를 분석하여 가장 적절한 키워드를 추출해주세요.

[입력 정보]
제목: ${videoInfo.title}
설명: ${videoInfo.description?.slice(0, 200)}
태그: ${videoInfo.tags ? videoInfo.tags.join(', ') : '없음'}

[추출 기준]
1. 주제 관련성: 영상의 핵심 주제를 대표하는 명사 키워드 (인물, 채널, 주제)
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 명사 키워드 (시사, 음악, 게임, 교양, 영화, 리뷰, 예능, 쇼츠, 자기계발, 브이로그, 패션, 뷰티)
3. 톤: 영상의 분위기를 나타내는 형용사 키워드 (예: 감성적, 재미있는, 웃긴)
4. 대상 시청자: 주요 타겟 시청자층을 나타내는 명사 키워드 (예: 여성, 남성, 청년)
5. 이슈: 관련된 시의성 있는명사 키워드 (예: 코로나, 미국 대선)

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1-2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어 제외 (감성, 트렌드)
- 위의 5가지 기준 중 최소 3가지 이상 포함
- 키워드 간의 중복성 최소화

응답 형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5
`;

    console.log('🤖 OpenAI API 요청 시작...');
    const startTime = Date.now();
    
    // ✅ OpenAI Logger 안전 호출 (SSR 대응)
    try {
      if (typeof window !== 'undefined' && OpenAILogger) {
        await OpenAILogger.logRequest({
          model: "gpt-4o-mini",
          temperature: 0.7,
          prompt: prompt
        });
      }
    } catch (logError) {
      console.warn('⚠️ OpenAI Logger 요청 로그 실패:', logError);
    }

    // ✅ 15초 타임아웃을 적용한 OpenAI API 호출
    const completion = await Promise.race([
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        temperature: 0.7,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI API 타임아웃 (15초)')), 15000)
      )
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ OpenAI API 응답 완료: ${elapsed}ms`);

    // ✅ OpenAI Logger 안전 호출 (SSR 대응)
    try {
      if (typeof window !== 'undefined' && OpenAILogger) {
        await OpenAILogger.logResponse({
          model: completion.model,
          content: completion.choices[0].message.content || '',
          usage: completion.usage
        });
      }
    } catch (logError) {
      console.warn('⚠️ OpenAI Logger 응답 로그 실패:', logError);
    }

    const response = completion.choices[0].message.content?.trim() || '';

    if (!response) {
      console.error('❌ OpenAI 응답 없음');
      return [];
    }

    const keywords = response
      .split(',')
      .map(k => k.trim().split('(')[0].trim()) // 카테고리 부분 제거
      .filter(k => k.length > 0);

    console.log('✅ 키워드 추출 완료:', keywords);

    if (keywords.length === 0) {
      console.error('❌ 유효한 키워드 없음');
      return [];
    }

    return keywords;
  } catch (error) {
    console.error('❌ extractVideoKeywords 실행 중 오류:', error);
    
    if (error instanceof Error && error.message.includes('타임아웃')) {
      console.error('🚨 OpenAI API 타임아웃 발생 - 15초 초과');
    }
    
    return [];
  }
};

// fallback 비디오 정보 생성 함수
function createFallbackVideoInfo(item: any, description?: string): VideoInfo {
  return {
    videoId: item.videoId,
    title: item.title || `Video ${item.videoId}`,
    description: description || `원본 정보: ${item.title || 'Unknown'}`,
    tags: [],
    keywords: item.title ? item.title.split(' ') : [],
    timestamp: new Date().toISOString()
  };
}

// STEP1.비디오 정보 가져오기 함수 -> STEP2키워드 추출 함수호출 (YouTube API 캐싱 적용)
export async function fetchVideoInfo(videoId: string): Promise<VideoInfo | null> {
  const videoInfoStartTime = Date.now();
  
  try {
    console.log('🎯 비디오 정보 요청 시작:', videoId);
    
    // ✅ 전체 함수에 10초 타임아웃 적용 (병렬 처리로 단축)
    return await Promise.race([
      fetchVideoInfoInternal(videoId),
      new Promise<VideoInfo | null>((_, reject) =>
        setTimeout(() => reject(new Error(`fetchVideoInfo 타임아웃 (10초): ${videoId}`)), 10000)
      )
    ]);
  } catch (error) {
    const elapsed = Date.now() - videoInfoStartTime;
    console.error(`❌ fetchVideoInfo 실행 중 오류 (${elapsed}ms):`, videoId, error);
    
    if (error instanceof Error && error.message.includes('타임아웃')) {
      console.error('🚨 비디오 처리 타임아웃 발생 - 30초 초과');
    }
    
    // 타임아웃이나 에러 발생 시 fallback 비디오 정보 생성
    console.log('🔄 fallback 비디오 정보 생성 시도:', videoId);
    try {
      const fallbackItem = { videoId, title: `Video ${videoId}` };
      const fallbackVideoInfo = createFallbackVideoInfo(fallbackItem);
      fallbackVideoInfo.keywords = ['일반', '미디어', '콘텐츠'];
      
      console.log('✅ fallback 비디오 정보 생성 성공:', videoId);
      return fallbackVideoInfo;
    } catch (fallbackError) {
      console.error('❌ fallback 비디오 정보 생성 실패:', fallbackError);
      return null;
    }
  }
}

// 내부 구현 함수 (캐시 확인을 건너뛰고 직접 API 호출)
export async function fetchVideoInfoInternal(videoId: string): Promise<VideoInfo | null> {
  try {
    // YouTube API 호출 - 최적화된 파라미터
    console.log('🌐 YouTube API 호출:', videoId);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&fields=items(id,snippet(title,description,tags))`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('YouTube API 요청 실패');
    }
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.warn('❌ YouTube API에서 비디오를 찾을 수 없음:', videoId);
      return null;
    }

    // 3단계: API 응답을 DB 형식으로 변환
    const youtubeItem = data.items[0];
    const dbVideoData = convertYouTubeResponseToVideoData(youtubeItem);
    
    // 4단계: VideoInfo 형식으로 변환
    const videoInfo: VideoInfo = {
      videoId: dbVideoData.id,
      title: dbVideoData.title,
      description: dbVideoData.description || undefined,
      tags: dbVideoData.tags || [],
      keywords: [] as any[],
      timestamp: new Date().toISOString()
    };

    console.log('📺 YouTube API로 받아온 데이터:', {
      title: videoInfo.title,
      hasDescription: !!videoInfo.description,
      tags: videoInfo.tags.length
    });

    // 5단계: OpenAI로 키워드 추출
    const extractedKeywords = await extractVideoKeywords(videoInfo);
    if (!extractedKeywords || extractedKeywords.length === 0) {
      console.warn('⚠️ AI 키워드 추출 실패, 태그 사용');
      videoInfo.keywords = videoInfo.tags;
      dbVideoData.keywords = videoInfo.tags; // DB에도 태그를 키워드로 저장
    } else {
      console.log('✅ AI 키워드 추출 성공:', extractedKeywords.length, '개');
      videoInfo.keywords = extractedKeywords;
      dbVideoData.keywords = extractedKeywords; // DB에 AI 키워드 저장
    }

    // 6단계: DB에 캐시 저장
    try {
      await upsertVideo(dbVideoData);
      console.log('💾 비디오 정보 DB 캐시 저장 완료:', videoId);
    } catch (cacheError) {
      console.error('❌ DB 캐시 저장 실패:', cacheError);
      // 캐시 저장 실패해도 비디오 정보는 반환
    }

    console.log('🎉 비디오 정보 처리 완료:', videoId);
    return videoInfo;

  } catch (error) {
    console.error('❌ 비디오 정보 가져오기 실패:', videoId, error);
    
    // 오류 발생 시 캐시된 데이터라도 사용 시도
    try {
      const cacheInfo = await getCachedVideoInfo(videoId);
      if (cacheInfo.cached && cacheInfo.data) {
        console.log('🔄 오류 발생, 캐시된 데이터 사용:', videoId);
        const cachedData = cacheInfo.data;
        return {
          videoId: cachedData.id,
          title: cachedData.title,
          description: cachedData.description || undefined,
          tags: cachedData.tags || [],
          keywords: cachedData.keywords || cachedData.tags || [],
          timestamp: cachedData.last_fetched_at
        };
      }
    } catch (fallbackError) {
      console.error('❌ 캐시 백업도 실패:', fallbackError);
    }
    
    return null;
  }
}

// 키워드 추출 함수([관리자용] keyword 추출 버튼 클릭 시 호출)
// selectedItems를 받아 각 영상의 정보를 fetchVideoInfo로 가져오고, 키워드를 가공하여 반환하는 함수
export async function handleKeyword(selectedItems: any[], fetchVideoInfo: any, onProgress?: (current: number, total: number) => void, ensureValidSession?: () => Promise<boolean>) {
  const processedItems: any[] = [];
  let processedCount = 0;
  const totalItems = selectedItems.length;
  console.log('selectedItems:', selectedItems);

  if (onProgress) {
    onProgress(0, totalItems);
  }
const watchHistory_temp =[];

  let successCount = 0;
  let failedCount = 0;

  // ✅ 배치 단위로 중간 저장 (100개마다)
  const BATCH_SIZE = 100;
  let batchCount = 0;
  
  // 세션 체크 주기 (50개마다)
  const SESSION_CHECK_INTERVAL = 50;

  // ✅ 병렬 처리를 위한 배치 크기 (동시에 처리할 비디오 수)
  const PARALLEL_BATCH_SIZE = 5;
  const batches = [];
  
  // 배치로 나누기
  for (let i = 0; i < selectedItems.length; i += PARALLEL_BATCH_SIZE) {
    batches.push(selectedItems.slice(i, i + PARALLEL_BATCH_SIZE));
  }
  
  console.log(`🚀 병렬 처리 시작: ${batches.length}개 배치, 배치당 최대 ${PARALLEL_BATCH_SIZE}개`);
  
  for (const batch of batches) {
    // ✅ 배치 시작 전 캐시 일괄 조회로 DB 호출 최적화
    const batchVideoIds = batch.map(item => item.videoId);
    const bulkCacheInfo = await getBulkCachedVideoInfo(batchVideoIds);
    console.log(`📦 배치 캐시 조회: ${bulkCacheInfo.cached.length}개 캐시됨, ${bulkCacheInfo.uncached.length}개 API 호출 필요`);
    
    // 캐시된 데이터를 Map으로 변환하여 빠른 조회
    const cacheMap = new Map(bulkCacheInfo.cached.map(video => [video.id, video]));
    const needsRefreshMap = new Map(bulkCacheInfo.needsRefresh.map(video => [video.id, video]));
    // 세션 체크 (배치마다)
    if (processedCount > 0 && ensureValidSession) {
      console.log(`🔐 [${processedCount}/${totalItems}] 세션 유효성 체크`);
      const isSessionValid = await ensureValidSession();
      if (!isSessionValid) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }
    
    // 배치 내 비디오들을 병렬로 처리
    const batchPromises = batch.map(async (item) => {
      const cachedData = cacheMap.get(item.videoId);
      const needsRefreshData = needsRefreshMap.get(item.videoId);

      // ✅ 캐시된 데이터가 있고 갱신이 필요하지 않은 경우 직접 사용
      if (cachedData && !needsRefreshData) {
        console.log(`⚡️ [${processedCount + 1}/${totalItems}] 캐시된 데이터 직접 사용: ${item.videoId}`);
        const videoInfo: VideoInfo = {
          videoId: cachedData.id,
          title: cachedData.title,
          description: cachedData.description || undefined,
          tags: cachedData.tags || [],
          keywords: cachedData.keywords || cachedData.tags || [],
          timestamp: cachedData.last_fetched_at
        };
        return { success: true, videoInfo, item, elapsed: 0 };
      } else {
        // ✅ API 호출이 필요한 경우만 fetchVideoInfoInternal 직접 호출
        console.log(`🌐 [${processedCount + 1}/${totalItems}] API/갱신 필요: ${item.videoId}`);
        const itemStartTime = Date.now();
        
        try {
          // ✅ 개별 비디오에 대한 타임아웃을 15초로 단축 (병렬 처리로 전체 시간 단축)
          const videoInfo = await Promise.race([
            fetchVideoInfoInternal(item.videoId),
            new Promise<VideoInfo | null>((_, reject) =>
              setTimeout(() => reject(new Error(`개별 비디오 타임아웃 (15초): ${item.videoId}`)), 15000)
            )
          ]);
        
          const itemElapsed = Date.now() - itemStartTime;
          
          if (videoInfo != null) {
            // ✅ YouTube API에서 정보를 성공적으로 가져온 경우
            return {
              success: true,
              videoInfo,
              item,
              elapsed: itemElapsed
            };
          } else {
            // ✅ YouTube API 실패 시 기본 정보라도 유지
            return {
              success: false,
              videoInfo: createFallbackVideoInfo(item),
              item,
              elapsed: itemElapsed
            };
          }
        } catch (error) {
          const itemElapsed = Date.now() - itemStartTime;
          console.error(`❌ [${processedCount + 1}/${totalItems}] 처리 오류 (${itemElapsed}ms):`, item.videoId, error);
          
          // 오류 시 fallback 정보 생성
          return {
            success: false,
            videoInfo: createFallbackVideoInfo(item, `오류 발생: ${item.title || 'Unknown'}`),
            item,
            elapsed: itemElapsed,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          };
        }
      }
    });
    
    // 배치 결과 처리
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const { success, videoInfo, item } = result.value;
        
        watchHistory_temp.push(videoInfo);
        processedItems.push({
          videoId: videoInfo.videoId,
          title: videoInfo.title,
          channel: item.channel,
          date: item.date,
          keywords: videoInfo.keywords,
          tags: videoInfo.tags,
          timestamp: new Date().toISOString()
        });
        
        if (success) {
          successCount++;
          console.log(`✅ [${processedCount + 1}/${totalItems}] 성공: ${videoInfo.title}`);
        } else {
          failedCount++;
          console.log(`⚠️ [${processedCount + 1}/${totalItems}] API 실패하여 기본 정보 사용: ${videoInfo.title} (${item.videoId})`);
        }
      } else {
        failedCount++;
        console.error(`❌ 배치 처리 실패:`, result.reason);
      }
      
      processedCount++;
      batchCount++;
    }
    
    // ✅ 진행률 업데이트 및 중간 통계
    if (onProgress) {
      onProgress(processedCount, totalItems);
    }
    
    // ✅ 배치 단위로 중간 저장 및 상태 로그
    if (batchCount >= BATCH_SIZE || processedCount === totalItems) {
      console.log(`💾 중간 저장 (${processedCount}/${totalItems}): 성공 ${successCount}개, 실패 ${failedCount}개`);
        
        try {
          // ✅ 중간 저장 전 중복 검사 및 통계
          const uniqueVideoIds = new Set(watchHistory_temp.map(v => v.videoId));
          const duplicateCount = watchHistory_temp.length - uniqueVideoIds.size;
          
          if (duplicateCount > 0) {
            console.log(`📊 중간 저장 중복 감지: ${duplicateCount}개 중복, ${uniqueVideoIds.size}개 고유`);
          }
          
          // ⏰ 타임아웃과 함께 저장 (30초 제한)
          await Promise.race([
            saveWatchHistory(watchHistory_temp),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('중간 저장 타임아웃 (30초)')), 30000)
            )
          ]);
          
          console.log(`✅ 중간 저장 완료: ${watchHistory_temp.length}개 비디오 (고유: ${uniqueVideoIds.size}개)`);
          // 성공적으로 저장한 후 배열 초기화 (메모리 관리)
          watchHistory_temp.length = 0;
        } catch (saveError) {
          console.error('❌ 중간 저장 실패:', saveError);
          
          // ✅ 저장 실패 시 상세 로깅 및 복구 시도
          if (saveError && typeof saveError === 'object' && 'message' in saveError) {
            const errorMessage = (saveError as any).message;
            if (errorMessage.includes('duplicate') || errorMessage.includes('21000')) {
              console.error('🚨 중복 키로 인한 중간 저장 실패 - 다음 배치에서 재시도');
            } else if (errorMessage.includes('timeout') || errorMessage.includes('타임아웃')) {
              console.error('⏰ 저장 타임아웃 - 네트워크 연결 상태를 확인하세요');
            }
          }
          
          // 🔄 저장 실패 시에도 배열 초기화하여 메모리 누수 방지
          console.log('🔄 저장 실패했지만 메모리 정리를 위해 배열 초기화');
          watchHistory_temp.length = 0;
          
          // 저장 실패해도 계속 진행
        }
        
        batchCount = 0;
    }
    
    // ✅ 배치 처리 완료 후 상태 출력
    const progress = ((processedCount / totalItems) * 100).toFixed(1);
    console.log(`📊 배치 완료: ${progress}% (${processedCount}/${totalItems}) - 성공: ${successCount}, 실패: ${failedCount}`);
  }
  
  // ✅ 최종 남은 데이터 저장
  if (watchHistory_temp.length > 0) {
    console.log(`💾 최종 저장: 남은 ${watchHistory_temp.length}개 비디오`);
    try {
      const uniqueVideoIds = new Set(watchHistory_temp.map(v => v.videoId));
      const duplicateCount = watchHistory_temp.length - uniqueVideoIds.size;
      
      if (duplicateCount > 0) {
        console.log(`📊 최종 저장 중복 감지: ${duplicateCount}개 중복, ${uniqueVideoIds.size}개 고유`);
      }
      
      await saveWatchHistory(watchHistory_temp);
      console.log(`✅ 최종 저장 완료: ${watchHistory_temp.length}개 (고유: ${uniqueVideoIds.size}개)`);
    } catch (finalSaveError) {
      console.error('❌ 최종 저장 실패:', finalSaveError);
      
      if (finalSaveError && typeof finalSaveError === 'object' && 'message' in finalSaveError) {
        const errorMessage = (finalSaveError as any).message;
        if (errorMessage.includes('duplicate') || errorMessage.includes('21000')) {
          console.error('🚨 최종 저장에서도 중복 키 에러 발생');
        }
      }
    }
  }
  
  // ✅ 처리 결과 통계 로그
  const successRate = ((successCount / totalItems) * 100).toFixed(1);
  console.log(`🎯 비디오 처리 완료 - 성공: ${successCount}개 (${successRate}%), 실패: ${failedCount}개, 전체: ${totalItems}개`);
  console.log(`📈 최종 처리된 아이템: ${processedItems.length}개`);
  
  return processedItems;
}

