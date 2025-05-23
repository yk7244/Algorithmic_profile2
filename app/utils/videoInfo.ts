import OpenAI from 'openai';
import { OpenAILogger } from './init-logger';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
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
1. 주제 관련성
2. 콘텐츠 유형
3. 감정/톤
4. 대상 시청자
5. 트렌드/이슈

- 정확히 5개의 키워드
- 각 키워드는 한글 1~2단어
- 응답 형식: 키워드1(카테고리), 키워드2(카테고리), ...
`;

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

    await OpenAILogger.logResponse({
      model: completion.model,
      usage: completion.usage,
      content
    });

    const keywords = content.split(',').map(entry => {
      const [keyword, categoryRaw] = entry.trim().split('(');
      return {
        keyword: keyword.trim(),
        category: categoryRaw?.replace(')', '').trim()
      };
    }).filter(k => k.keyword && k.category);

    return keywords;
  } catch (err) {
    console.error('❌ 키워드 추출 실패:', err);
    return [];
  }
};

// 📺 비디오 메타데이터 + 키워드 추출 + Supabase 캐싱 포함
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
    // 1️⃣ Supabase 캐시 확인
    const { data: cachedVideo } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        published_at,
        channel_id,
        channels(name),
        tags
      `)
      .eq('id', videoId)
      .single();

    if (cachedVideo) {
      console.log(`📦 캐시 히트: ${videoId}`);
      const keywords = await extractVideoKeywords({
        title: cachedVideo.title,
        description: cachedVideo.description || '',
        tags: cachedVideo.tags || []
      });

      return {
        videoId,
        title: cachedVideo.title,
        description: cachedVideo.description || '',
        channel: cachedVideo.channels?.name || 'Unknown Channel',
        tags: cachedVideo.tags || [],
        keywords: keywords.map(k => k.keyword),
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    }

    // 2️⃣ YouTube API 호출
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;
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

    const json = await response.json();
    const snippet = json?.items?.[0]?.snippet;
    if (!snippet) {
      console.warn(`⚠️ 영상 정보 없음: ${videoId}`);
      return null;
    }

    const {
      title,
      description,
      channelId,
      channelTitle,
      tags = []
    } = snippet;

    // 3️⃣ OpenAI 키워드 추출
    const keywords = await extractVideoKeywords({ title, description, tags });

    // 4️⃣ 채널 Supabase 저장 (없으면)
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channelId)
      .maybeSingle();

    if (!existingChannel) {
      await supabase.from('channels').insert({
        id: channelId,
        name: channelTitle,
        last_fetched_at: new Date().toISOString()
      });
    }

    // 5️⃣ 비디오 Supabase 저장
    await supabase.from('videos').insert({
      id: videoId,
      title,
      description,
      channel_id: channelId,
      thumbnail_url: snippet?.thumbnails?.default?.url || '',
      published_at: snippet.publishedAt,
      tags,
      last_fetched_at: new Date().toISOString()
    });

    return {
      videoId,
      title,
      description,
      channel: channelTitle,
      channelId,
      tags,
      keywords: keywords.map(k => k.keyword),
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (err) {
    console.error(`❌ fetchVideoMetadata 실패 (${videoId}):`, err);
    return null;
  }
};
