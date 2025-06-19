import OpenAI from 'openai';
import { OpenAILogger } from '../../utils/init-logger';
import { saveWatchHistoryItem, getCurrentUserId, ensureUserExists, getCachedVideo, saveVideoCache, isCacheExpired } from '@/lib/database';

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

// VideoCache를 VideoInfo로 변환하는 함수
const convertCacheToVideoInfo = (cache: any): VideoInfo => {
  return {
    videoId: cache.id,
    title: cache.title || '',
    description: cache.description || '',
    tags: cache.tags || [],
    keywords: cache.keywords || [],
    timestamp: new Date().toISOString() // 캐시에서 가져올 때는 현재 시간 사용
  };
};

// YouTube API 응답을 VideoCache 형식으로 변환하는 함수
const convertAPIResponseToCache = (videoId: string, snippet: any): any => {
  return {
    id: videoId,
    title: snippet.title || '',
    description: snippet.description || '',
    channel_id: snippet.channelId || '',
    published_at: snippet.publishedAt || new Date().toISOString(),
    thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
    view_count: 0, // YouTube API v3에서는 snippet에 없음, statistics 필요
    like_count: 0,
    comment_count: 0,
    channel_name: snippet.channelTitle || '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    tags: snippet.tags || [],
    keywords: [] // OpenAI로 생성할 예정
  };
};

// STEP1-2.키워드 추출 함수
const extractVideoKeywords = async (videoInfo: any) => {
  try {
    console.log('Starting keyword extraction for video:', {
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
1. 주제 관련성: 영상의 핵심 주제를 대표하는 명사 키워드
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 명사 키워드
3. 감정/톤: 영상의 분위기나 감정을 나타내는 형용사 키워드
4. 대상 시청자: 주요 타겟 시청자층을 나타내는 명사 키워드
5. 트렌드/이슈: 관련된 시의성 있는명사 키워드

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1-2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어 제외
- 위의 5가지 기준 중 최소 3가지 이상 포함
- 키워드 간의 중복성 최소화

응답 형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5
`;

    console.log('Sending request to OpenAI for keyword extraction...');
    
    // Log request
    await OpenAILogger.logRequest({
      model: "gpt-4o-mini",
      temperature: 0.7,
      prompt: prompt
    });

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });


    // Log response
    await OpenAILogger.logResponse({
      model: completion.model,
      content: completion.choices[0].message.content || '',
      usage: completion.usage
    });

    const response = completion.choices[0].message.content?.trim() || '';

    if (!response) {
      console.error('Empty response from OpenAI');
      return [];
    }

    const keywords = response
      .split(',')
      .map(k => k.trim().split('(')[0].trim()) // 카테고리 부분 제거
      .filter(k => k.length > 0);

    console.log('1.Extracted keywords:', keywords);

    if (keywords.length === 0) {
      console.error('No valid keywords extracted');
      return [];
    }

    return keywords;
  } catch (error) {
    console.error('Error in extractVideoKeywords:', error);
    return [];
  }
};

// STEP1.비디오 정보 가져오기 함수 -> STEP1-2키워드 추출 함수호출 
export async function fetchVideoInfo(videoId: string, forceRefresh: boolean = false): Promise<VideoInfo | null> {
  console.log(`🔍 fetchVideoInfo 호출: ${videoId} (${forceRefresh ? '강제 새로고침' : '캐시 활용'} 모드)`);
  
  // forceRefresh가 false일 때만 캐시 확인
  if (!forceRefresh) {
    const cachedVideo = await getCachedVideo(videoId);
    if (cachedVideo && !isCacheExpired(cachedVideo.last_fetched_at)) {
      console.log(`📦 캐시에서 반환: ${videoId} (${cachedVideo.title?.slice(0, 30)}...)`);
      return convertCacheToVideoInfo(cachedVideo);
    } else if (cachedVideo) {
      console.log(`⏰ 캐시 만료됨: ${videoId} - API 호출 진행`);
    } else {
      console.log(`❌ 캐시 없음: ${videoId} - API 호출 진행`);
    }
  } else {
    console.log(`🔄 강제 새로고침: ${videoId} - 캐시 무시하고 API 호출`);
  }

  try {
    // 🆕 2단계: YouTube API 호출
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      console.error(`YouTube API 오류: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log('YouTube API 응답:', data);

    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      
      // 🆕 3단계: YouTube API 응답을 캐시 형식으로 변환
      const cacheData = convertAPIResponseToCache(videoId, snippet);
      
      // 🆕 4단계: OpenAI로 키워드 추출 (VideoInfo 형식으로 변환하여 전달)
      const tempVideoInfo = {
        title: snippet.title,
        description: snippet.description || '',
        tags: snippet.tags || []
      };
      
      console.log(`[fetchVideoInfo] 🤖 OpenAI 키워드 추출 시작 (${forceRefresh ? '강제 새로고침' : '일반'} 모드):`, tempVideoInfo.title);
      const keywords = await extractVideoKeywords(tempVideoInfo);
      cacheData.keywords = keywords;
      
      // 🆕 5단계: 캐시에 저장 (항상 최신 데이터로 업데이트)
      await saveVideoCache(cacheData);
      console.log(`💾 캐시에 저장 완료: ${videoId} (${snippet.title?.slice(0, 30)}...)`);
      
      // 🆕 6단계: VideoInfo 형식으로 변환하여 반환
      const videoInfo: VideoInfo = {
        videoId: videoId,
        title: snippet.title,
        description: snippet.description || '',
        tags: snippet.tags || [],
        keywords: keywords,
        timestamp: new Date().toISOString()
      };

      // DB에 저장 시도 (fallback으로 localStorage)
      try {
        // 사용자가 users 테이블에 존재하는지 확인하고 없으면 생성
        await ensureUserExists();
        
        const userId = await getCurrentUserId();
        if (userId) {
          // Supabase DB에 저장
          await saveWatchHistoryItem({
            user_id: userId,
            videoId: videoInfo.videoId,
            title: videoInfo.title,
            description: videoInfo.description || '',
            tags: videoInfo.tags,
            keywords: videoInfo.keywords,
            source: 'upload',
            timestamp: videoInfo.timestamp
          });
          console.log('WatchHistory가 DB에 저장되었습니다');
        } else {
          throw new Error('로그인이 필요합니다');
        }
      } catch (dbError) {
        console.error('DB 저장 실패, localStorage fallback:', dbError);
        
        // 🆕 인증 실패 시에도 안전한 localStorage fallback
        try {
          // 인증 상태와 관계없이 localStorage 저장 시도
          let userId: string | null = null;
          let watchHistoryKey = 'watchHistory'; // 기본 키
          
          try {
            // 인증이 되어 있다면 사용자별 키 사용
            userId = (await getCurrentUserId()) || null;
            if (userId) {
              watchHistoryKey = `watchHistory_${userId}`;
            }
          } catch (authError: any) {
            console.log('[Fallback] 인증 실패, 게스트 모드로 localStorage 저장:', authError?.message || '인증 에러');
            // 게스트 모드로 전역 키 사용
            watchHistoryKey = 'watchHistory_guest';
          }
          
          const watchHistory = JSON.parse(localStorage.getItem(watchHistoryKey) || '[]');
          watchHistory.push(videoInfo);
          localStorage.setItem(watchHistoryKey, JSON.stringify(watchHistory));
          console.log(`WatchHistory가 localStorage에 저장되었습니다: ${watchHistoryKey}`);
          
        } catch (fallbackError) {
          console.error('localStorage 저장도 실패:', fallbackError);
          // 최후의 수단으로 전역 키 사용
          try {
      const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      watchHistory.push(videoInfo);
      localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
            console.log('WatchHistory가 전역 localStorage에 저장되었습니다 (최후 fallback)');
          } catch (finalError) {
            console.error('모든 저장 방법 실패:', finalError);
          }
        }
      }

      return videoInfo;
    }
    return null;
  } catch (error) {
    console.error('비디오 정보 가져오기 실패:', error);
    return null;
  }
}