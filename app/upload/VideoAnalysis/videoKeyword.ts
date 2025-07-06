import OpenAI from 'openai';
import { OpenAILogger } from '../../utils/init-logger';
import { saveWatchHistory } from '@/app/utils/save/saveWatchHistory';

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

// STEP2.키워드 추출 함수
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

// STEP1.비디오 정보 가져오기 함수 -> STEP2키워드 추출 함수호출 
export async function fetchVideoInfo(videoId: string): Promise<VideoInfo | null> {
  try {
    console.log('Fetching video info for:', videoId);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
    );
    if (!response.ok) {
      throw new Error('YouTube API 요청 실패');
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      const videoInfo: VideoInfo = {
        videoId,
        title: snippet.title,
        description: snippet.description,
        tags: snippet.tags || [],
        keywords: [] as any[],
        timestamp: new Date().toISOString()
      };
      console.log('유튜브 API로 받아온 tag:', {
        title: videoInfo.title,
        hasDescription: !!videoInfo.description,
        tags: videoInfo.tags
      });

      // OpenAI로 키워드 추출 시도
      const extractedKeywords = await extractVideoKeywords(videoInfo);
      if (!extractedKeywords || extractedKeywords.length === 0) {
        // 실패 시 기본 태그 저장
        console.warn('No keywords extracted, using tags as fallback');
        videoInfo.keywords = videoInfo.tags;
      } else {
        // 키워드 생성 잘 했으면 키워드 저장
        videoInfo.keywords = extractedKeywords;
      }
      console.log('받아왔음!!:', videoInfo);

      const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      watchHistory.push(videoInfo);
      //✅ 나중에 DB로 확인하고 호출하는걸로 바꾸기
      saveWatchHistory(watchHistory);
      return videoInfo;
    }
    return null;
  } catch (error) {
    console.error('비디오 정보 가져오기 실패:', error);
    return null;
  }
}

// 키워드 추출 함수([관리자용] keyword 추출 버튼 클릭 시 호출)
// selectedItems를 받아 각 영상의 정보를 fetchVideoInfo로 가져오고, 키워드를 가공하여 반환하는 함수
export async function handleKeyword(selectedItems: any[], fetchVideoInfo: any, onProgress?: (current: number, total: number) => void) {
  const processedItems: any[] = [];
  let processedCount = 0;
  const totalItems = selectedItems.length;

  if (onProgress) {
    onProgress(0, totalItems);
  }

  for (const item of selectedItems) {
    try {
      const videoInfo = await fetchVideoInfo(item.videoId);
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
  return processedItems;
}

