import OpenAI from 'openai';
import { OpenAILogger } from './init-logger';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// 🔍 키워드 추출 함수
const extractVideoKeywords = async (videoInfo: {
  title: string;
  description?: string;
  tags?: string[];
}) => {
  try {
    const prompt = `
당신은 YouTube 영상 콘텐츠 분석 전문가입니다. 
다음 영상의 정보를 분석하여 가장 적절한 키워드를 추출해주세요.

[입력 정보]
제목: ${videoInfo.title}
설명: ${videoInfo.description?.slice(0, 200) || '없음'}
태그: ${videoInfo.tags?.join(', ') || '없음'}

[추출 기준]
1. 주제 관련성: 영상의 핵심 주제를 대표하는 명사 키워드
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 명사 키워드
3. 감정/톤: 영상의 분위기나 감정을 나타내는 형용사 키워드
4. 대상 시청자: 주요 타겟 시청자층을 나타내는 명사 키워드
5. 트렌드/이슈: 관련된 시의성 있는 명사 키워드

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1~2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어는 제외
- 위 5가지 기준 중 최소 3가지 이상 반영
- 키워드 간 중복 최소화

응답 형식: 키워드1(카테고리), 키워드2(카테고리), 키워드3(카테고리), 키워드4(카테고리), 키워드5(카테고리)
`;

    // 로그 전송
    await OpenAILogger.logRequest({
      model: "gpt-4o-mini",
      temperature: 0.7,
      prompt
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    const content = completion.choices[0].message.content?.trim() || '';
    console.log('🧠 OpenAI 응답:', content);

    await OpenAILogger.logResponse({
      model: completion.model,
      usage: completion.usage,
      content
    });

    // 키워드 파싱
    const keywords = content.split(',').map(entry => {
      const [keyword, categoryRaw] = entry.trim().split('(');
      return {
        keyword: keyword.trim(),
        category: categoryRaw?.replace(')', '').trim()
      };
    }).filter(k => k.keyword && k.category);

    return keywords;
  } catch (error) {
    console.error('❌ 키워드 추출 실패:', error);
    return [];
  }
};

// 📺 YouTube 메타데이터 + 키워드 추출
export const fetchVideoMetadata = async (videoId: string): Promise<{
  videoId: string;
  title: string;
  description?: string;
  channel: string;
  tags: string[];
  keywords: string[];
  url?: string;
} | null> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('❌ YouTube API 키 누락');

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ YouTube API 요청 실패 (${videoId})`, {
        status: response.status,
        body: errText
      });
      return null;
    }

    const data = await response.json();
    const snippet = data?.items?.[0]?.snippet;

    if (!snippet) {
      console.warn(`⚠️ 영상 정보 없음: ${videoId}`);
      return null;
    }

    const { title, description, channelTitle, tags = [] } = snippet;

    const keywords = await extractVideoKeywords({ title, description, tags });

    return {
      videoId,
      title,
      description,
      channel: channelTitle || 'Unknown Channel',
      tags,
      keywords: keywords.map(k => k.keyword),
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (error) {
    console.error(`❌ fetchVideoMetadata 실패 (${videoId}):`, error);
    return null;
  }
};
