"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import OpenAI from 'openai';
import { HelpCircle, Upload, ArrowRight, Youtube, CalendarIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { transformClusterToImageData } from '../utils/clusterTransform';
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { OpenAILogger } from '../utils/init-logger';
import { parseJSONWatchHistory } from '../utils/jsonParser';
import { prepareWatchHistoryItems } from '../utils/prepareWatchHistoryItems';

import { searchClusterImage_pinterest, PinterestImageData } from '@/lib/imageSearch';
import {fetchClusterHistoryFromSupabase, saveClustersToSupabase, fetchSingleClusterSetWithVideos} from '@/lib/supabase/cluster'
import { LocalCluster } from '@/lib/supabase/cluster';

// 기본 이미지를 데이터 URI로 정의
const placeholderImage = '/images/default_image.png'

// OpenAI 클라이언트 초기화 수정
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Supabase 클라이언트 초기화 부분 수정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

//localstorage->watchHistory 에 배열로 들어감
// type WatchHistoryItem = {
//   title: string;
//   videoId: string;
//   keywords: string[];
//   tags?: string[];
//   timestamp?: string;
//   url?: string;
//   date?: any;  // any 타입으로 변경
//   channelName?: string;  // 옵셔널로 변경
// };

interface WatchHistoryItem {
  videoId: string;
  title: string;
  channel?: string;
  date: Date; // 실제 시청 시간
  keywords?: string[];
  tags?: string[];
}


// 클러스터 타입 수정
type Category = 
  | "영화/애니메이션"
  | "자동차"
  | "음악"
  | "동물"
  | "스포츠"
  | "여행/이벤트"
  | "게임"
  | "사람/블로그"
  | "코미디"
  | "엔터테인먼트"
  | "뉴스/정치"
  | "노하우/스타일"
  | "교육"
  | "과학/기술"
  | "비영리 활동";

//localstorage->watchClusters 에 배열로 들어감
type Cluster = {
  id?: number;
  user_id?: string;

  main_keyword: string;
  sub_keyword: string;
  mood_keyword: string;
  description: string;
  category: Category;  // 카테고리 필드 추가
  
  rotation?: string;
  keyword_list: string;
  strength: number;
  video_links: string;
  created_at: string;
  desired_self: boolean;

  main_image_url?: string;
  metadata: any;
};

// 타입 정의 추가
type TabType = 'related' | 'recommended';

// 클러스터 이미지 타입 정의 수정
type ClusterImage = {
  url: string;
  // credit 필드를 옵셔널로 만듭니다.
  credit?: {
    name: string;
    link: string;
  };
};

// Vision Search 결과 타입 정의 추가
type VisionSimilarImage = {
  url: string;
  score: number;
};

type VisionLabel = {
  description: string;
  score: number;
};


// 네이버 API 설정
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

// PostgreSQL 배열 문자열로 변환하는 함수
const toPgArray = (arr: string[]): string => {
  if (!Array.isArray(arr)) return '{}';
  return `{${arr.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}`;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  // clusterImages state 타입 수정
  const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
  const [successCount, setSuccessCount] = useState(0);
  // 타입 선언 수정
  // 기존: const [analysisHistory, setAnalysisHistory] = useState<{ id: string; date: string; clusters: any[]; }[]>([]);
  // 변경:
  type AnalysisHistoryItem = LocalCluster | { id: string; date: string; clusters: any[] };
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [showVisionResults, setShowVisionResults] = useState(false);
  // visionSearchResults state 타입 수정 및 초기화
  const [visionSearchResults, setVisionSearchResults] = useState<{
    similarImages: VisionSimilarImage[];
    labels: VisionLabel[];
  }>({
    similarImages: [],
    labels: [],
  });
  const [maxVideosPerDay, setMaxVideosPerDay] = useState(30);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  // 클러스터링 상태 추가
  const [isClustering, setIsClustering] = useState(false);

  // useEffect 추가
  useEffect(() => {
    // localStorage에서 데이터 로드
    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    setWatchHistory(savedHistory);
    const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
    setClusters(savedClusters);
  }, []);

  // 데이터 마이그레이션을 위한 useEffect 추가
  useEffect(() => {
    // 로컬 스토리지에서 기존 데이터 마이그레이션
    const migrateLocalStorageData = () => {
      try {
        // 클러스터 이미지 마이그레이션
        const storedClusterImages = localStorage.getItem('clusterImages');
        if (storedClusterImages) {
          const parsedClusterImages = JSON.parse(storedClusterImages);
          
          // 각 클러스터 이미지 마이그레이션
          const migratedClusterImages: Record<string, any> = {};
          
          Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
            // alt 필드가 있고 main_keyword 필드가 없는 경우에만 마이그레이션
            if (value && typeof value === 'object') {
              migratedClusterImages[key] = {
                ...value,
                main_keyword: key, // 키를 main_keyword로 사용
              };
            } else {
              migratedClusterImages[key] = value;
            }
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
          console.log('클러스터 이미지 데이터 마이그레이션 완료');
        }
        
        // 마이그레이션 완료 표시
        localStorage.setItem('clusterDataMigrationCompleted', 'true');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
      }
    };
    
    // 마이그레이션이 이미 완료되었는지 확인
    const migrationCompleted = localStorage.getItem('clusterDataMigrationCompleted');
    if (migrationCompleted !== 'true') {
      migrateLocalStorageData();
    }
  }, []);

const ensureProfileExists = async (userId: string) => {
  const { data, error } = await supabase
    .from('ProfileData')
    .select('id')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // 406: not found
    const { error: insertError } = await supabase.from('ProfileData').insert({
      id: userId,
      nickname: '새 사용자',
      description: '자동 생성된 프로필입니다'
    });

    if (insertError) {
      throw new Error(`Profile 생성 실패: ${insertError.message}`);
    }
  } else if (error) {
    throw new Error(`Profile 존재 확인 중 오류: ${error.message}`);
  }
};



 //워치 히스토리 저장 supabase 
const uploadWatchHistoryToSupabase = async (watchHistory: {
  videoId: string;
  title: string;
  description?: string;
  channel: string;
  channelId?: string;
  tags: string[];
  keywords: string[];
  date: Date;
  url?: string;
}[]): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) return;

  const userId = session.user.id;

  // ✅ 1. ProfileData 없으면 생성
  await ensureProfileExists(userId);

  // ✅ 2. 중복 제거 (user_id + videoId 기준)
  const deduped = Array.from(
    new Map(watchHistory.map(item => [`${userId}-${item.videoId}`, item])).values()
  );

  // ✅ 3. WatchHistoryItem 업로드 데이터 준비
  const uploadData = deduped.map((item) => ({
    user_id: userId,
    embed_id: item.videoId,
    title: item.title,
    description: item.description || null,
    url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
    channel_name: item.channel || 'Unknown Channel',
    channel_id: item.channelId || null,
    timestamp: item.date.getTime(),
    keywords: toPgArray(item.keywords || []),
    tags: toPgArray(item.tags || []),
    is_watched: true,
    watched_at: item.date.toISOString()
  }));

  // ✅ 4. WatchHistoryItem 테이블에 업로드
  const { error: historyError } = await supabase
    .from("WatchHistoryItem")
    .upsert(uploadData);

  if (historyError) {
    console.error('❌ WatchHistoryItem 업로드 실패:', historyError);
    alert('시청기록 업로드에 실패했습니다. 콘솔을 확인해주세요.');
    return;
  }

  // ✅ 5. videos 테이블에 업로드 데이터 준비
  const videoData = deduped.map((item) => ({
    id: item.videoId,
    user_id: userId,
    title: item.title,
    description: item.description || null,
    url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
    channel_id: item.channelId || null,
    channel_name: item.channel || 'Unknown Channel',
    tags: toPgArray(item.tags || []),
    keywords: toPgArray(item.keywords || []),
    thumbnail_url: (item as any).thumbnailUrl || null,
    view_count: (item as any).viewCount ?? 0,
    like_count: (item as any).likeCount ?? 0,
    comment_count: (item as any).commentCount ?? 0,
    last_fetched_at: new Date().toISOString()
  }));

  // ✅ 6. videos 테이블에 업로드
  const { error: videoError } = await supabase
    .from("videos")
    .upsert(videoData);

  if (videoError) {
    console.error('❌ videos 업로드 실패:', videoError);
    alert('영상 정보 업로드에 실패했습니다. 콘솔을 확인해주세요.');
    return;
  }

  console.log('✅ 시청기록 및 영상 정보 업로드 완료');
};





 

  // STEP1-0>>YouTube API를 통해 비디오 정보 가져오고, 키워드 추출
  const saveToVideosTable = async (
    videoId: string,
    videoInfo: any,
    extractedKeywords: string[] = []
  ) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return;

    const snippet = videoInfo.snippet || {};
    const statistics = videoInfo.statistics || {};

    const payload = {
      id: videoId,
      title: snippet.title || 'Untitled',
      description: snippet.description || '',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      channel_id: snippet.channelId || null,
      channel_name: snippet.channelTitle || 'Unknown Channel',
      tags: toPgArray(Array.isArray(snippet.tags) ? snippet.tags : []),
      keywords: toPgArray(extractedKeywords),
      thumbnail_url: snippet.thumbnails?.default?.url || null,
      view_count: Number(statistics.viewCount ?? 0),
      like_count: Number(statistics.likeCount ?? 0),
      comment_count: Number(statistics.commentCount ?? 0),
      last_fetched_at: new Date().toISOString(), // ✅ 절대 null/undefined가 되지 않도록 보장
    };

    const { error } = await supabase
      .from('videos')
      .upsert(payload, {
        onConflict: ['id'],
      });

    if (error) {
      console.error('❌ videos 테이블 저장 실패:', error);
    } else {
      console.log(`✅ 영상(${videoId}) 정보 videos 테이블에 저장 완료`);
    }
  };





// ✅ 메인 함수
  const fetchVideoInfo = async (videoId: string): Promise<boolean> => {
    try {
      console.log('Fetching video info for:', videoId);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('YouTube API 요청 실패');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const videoItem = data.items[0]; // includes snippet and statistics
        const snippet = videoItem.snippet;
        const statistics = videoItem.statistics;

        console.log('Retrieved video info:', {
          title: snippet.title,
          hasDescription: !!snippet.description,
          tagCount: snippet.tags?.length || 0
        });

        let extractedKeywords: string[] = [];

        try {
          const result = await extractVideoKeywords(snippet);
          extractedKeywords = result?.map(k => k.keyword) || [];
          console.log('Extracted keywords:', extractedKeywords);
        } catch (err) {
          console.error('❌ 키워드 추출 실패, 태그로 대체');
          extractedKeywords = snippet.tags ? snippet.tags.slice(0, 5) : [];
        }

        // ✅ YouTube API의 원본 videoItem 전체 전달
        await saveToVideosTable(videoId, videoItem, extractedKeywords);

        // ⏬ LocalStorage 저장
        const newItem = {
          videoId,
          title: snippet.title,
          tags: snippet.tags || [],
          keywords: extractedKeywords,
          timestamp: new Date().toISOString()
        };

        const currentHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        localStorage.setItem('watchHistory', JSON.stringify([...currentHistory, newItem]));

        return true;
      }

      return false;
    } catch (error) {
      console.error('비디오 정보 가져오기 실패:', error);
      return false;
    }
  };



  // STEP1-1>>HTML 파일 파싱 함수 수정
  const parseWatchHistory = async (file: File) => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const watchItems = Array.from(doc.querySelectorAll('.content-cell'));
    console.log('Found watch items:', watchItems.length);

    // HTML에서 기본 정보 파싱
    const rawHistory = watchItems
      .map((item): any | null => {
        try {
          const titleElement = item.querySelector('a');
          if (!titleElement) return null;

          // 제목에서 "Watched" 제거 및 중복 방지
          let title = titleElement.textContent || '';
          title = title.replace(/Watched\s+/g, '').replace(/\s+을\(를\) 시청했습니다\.$/, '').trim();

          const videoUrl = titleElement.getAttribute('href') || '';
          const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
          const channelElement = item.querySelector('a:nth-child(3)');
          const channelName = channelElement?.textContent || '';

          const dateText = item.textContent || '';
          const dateMatch = dateText.match(/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/);
          const date = dateMatch ? new Date(dateMatch[0].replace(/\./g, '-')) : null;

          // 필터링 조건
          if (!title || !videoId || !date) return null;
          const isAd = title.includes('광고') || channelName.includes('광고') || videoUrl.includes('/ads/');
          if (isAd) return null;

          return {
            videoId,
            title,
            channel: channelName,
            date,
            url: `https://youtube.com/watch?v=${videoId}`,
            tags: [],
            keywords: []
          };
        } catch (e) {
          console.warn('HTML 항목 파싱 실패:', e);
          return null;
        }
      })
      .filter(Boolean);

    if (rawHistory.length === 0) {
      throw new Error('파싱된 시청기록이 없습니다.');
    }

    // 날짜 필터링
    const filtered = rawHistory.filter(item => {
      if (!dateRange.from || !dateRange.to) return true;
      const d = new Date(item.date);
      return d >= dateRange.from && d <= dateRange.to;
    });

    if (filtered.length === 0) {
      throw new Error('선택한 기간 내 유효한 시청기록이 없습니다.');
    }

    // 날짜별 그룹화 및 maxVideosPerDay 적용
    const grouped = filtered.reduce((acc: { [key: string]: any[] }, item) => {
      const key = item.date.toISOString().split('T')[0];
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const TOTAL_LIMIT = 200;
    let selected: any[] = [];
    for (const dateStr of sortedDates) {
      if (selected.length >= TOTAL_LIMIT) break;
      const shuffled = grouped[dateStr].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, Math.min(maxVideosPerDay, TOTAL_LIMIT - selected.length)));
    }

    console.log('📦 최종 선택된 영상 수:', selected.length);

    // ✅ 공통 메타데이터 보완 (YouTube + OpenAI 기반)
    const enriched = await prepareWatchHistoryItems(selected);

    // 저장 및 업로드
    localStorage.setItem('watchHistory', JSON.stringify(enriched));
    await uploadWatchHistoryToSupabase(enriched);

    alert(`${enriched.length}개의 시청기록을 처리하고 Supabase에 업로드했습니다.`);
  } catch (err: any) {
    console.error('❌ HTML 파싱 실패:', err);
    setError(err.message || '시청기록 파싱 중 오류가 발생했습니다.');
  }
};

  // STEP1-2>>영상 키워드 추출 함수
  const extractVideoKeywords = async (videoInfo: any) => {
    try {
      console.log('Starting keyword extraction for video:', {
        title: videoInfo.title,
        description: videoInfo.description?.slice(0, 100),
        tags: videoInfo.tags
      });

      const prompt = `
당신은 YouTube 시청 기록을 분석해 사용자의 (1) 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향에 대해 깊이 있게 이해할 수 있는 전문가입니다.
제공되는 YouTube 시청 기록 데이터를 분석하여 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹으로 분류하되 인스타그램의 hashtag처럼 함축적이고 직관적이게 만들어 주세요. 단, (1) 과하게 일반화 하지 말고 기억에 남는 표현을 사용 할 것, (2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것
다음 영상의 정보를 분석하여 가장 적절한 키워드를 추출해주세요.

[입력 정보]
제목: ${videoInfo.title}
설명: ${videoInfo.description?.slice(0, 200)}
태그: ${videoInfo.tags ? videoInfo.tags.join(', ') : '없음'}

[추출 기준]
1. 주제 관련성: 영상의 핵심 주제를 대표하며, 사용자의 시청목적을 드러내는 명사 키워드
2. 콘텐츠 유형: 영상의 형식이나 장르를 나타내는 명사 키워드
3. 감정/톤: 영상의 분위기나 감정을 나타내는 형용사 키워드
4. 대상 시청자: YouTube 영상 시청정보를 바탕으로 한 주요 타겟 시청자층을 나타내는 명사 키워드
5. 트렌드/이슈: YouTube 영상 시청정보와 관련된 시의성 있는 명사 키워드

[요구사항]
- 정확히 5개의 키워드 추출
- 각 키워드는 1-2단어의 한글로 작성
- 너무 일반적이거나 모호한 단어 제외
- 위의 5가지 기준 중 최소 3가지 이상 포함
- 키워드 간의 중복성 최소화

응답 형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5

각 키워드 뒤에 해당하는 기준 카테고리를 괄호 안에 표시해주세요.
예시: 브이로그(콘텐츠 유형), 일상(주제 관련성), 힐링(감정/톤)
- [키워드]를 생성하고 난 다음 { } 안에 어떤 정보를 기반해서 이러한 키워드가 생성되었는지 5문장으로 설명해주세요.`
;

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

      console.log('Received response from OpenAI:', {
        model: completion.model,
        usage: completion.usage,
        contentLength: completion.choices[0].message.content?.length
      });

      // Log response
      await OpenAILogger.logResponse({
        model: completion.model,
        content: completion.choices[0].message.content || '',
        usage: completion.usage
      });

      const response = completion.choices[0].message.content?.trim() || '';
      console.log('Raw response:', response);

      if (!response) {
        console.error('Empty response from OpenAI');
        return [];
      }

      const keywords = response.split(',').map(k => {
        const [keyword, category] = k.trim().split('(');
        return {
          keyword: keyword.trim(),
          category: category?.replace(')', '').trim()
        };
      }).filter(k => k.keyword && k.category);

      console.log('Extracted keywords:', keywords);

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


  // STEP2>> 통합된 키워드 분석 및 클러스터링 함수
  const analyzeKeywordsWithOpenAI = async (watchHistory: WatchHistoryItem[]) => {
    try {
      // Log the input data
      console.log('Starting OpenAI analysis with watch history:', {
        totalVideos: watchHistory.length,
        sampleVideos: watchHistory.slice(0, 3)
      });

      // 데이터를 더 작은 청크로 나눕니다 (예: 20개씩)
      const chunkSize = 20;
      const chunks = [];
      for (let i = 0; i < watchHistory.length; i += chunkSize) {
        chunks.push(watchHistory.slice(i, i + chunkSize));
      }

      let allKeywordFrequencies: { [key: string]: number } = {};
      let allKeywordToVideos: { [key: string]: string[] } = {};

      // 각 청크별로 키워드 빈도수와 비디오 매핑을 계산
      for (const chunk of chunks) {
        chunk.forEach(item => {
          if (item && Array.isArray(item.keywords)) {
            item.keywords.forEach(keyword => {
              allKeywordFrequencies[keyword] = (allKeywordFrequencies[keyword] || 0) + 1;
              if (!allKeywordToVideos[keyword]) {
                allKeywordToVideos[keyword] = [];
              }
              if (item.title) {
                allKeywordToVideos[keyword].push(item.title);
              }
            });
          }
        });
      }

      // 상위 출현 키워드 추출 (10개)
      const topKeywords = Object.entries(allKeywordFrequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      // Log the prepared data
      console.log('Prepared data for OpenAI:', {
        topKeywords,
        keywordFrequencies: allKeywordFrequencies,
        keywordToVideos: allKeywordToVideos
      });

      const prompt = `
당신은 YouTube 시청 기록을 분석해 사용자의 (1) 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향에 대해 깊이 있게 이해할 수 있는 전문가입니다.
제공되는 YouTube 시청 기록 데이터를 분석하여 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹으로 분류하되 인스타그램의 hashtag처럼 함축적이고 직관적이게 만들어 주세요. 단, (1) 과하게 일반화 하지 말고 기억에 남는 표현을 사용 할 것, (2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것

시청 기록 데이터 (상위 10개 키워드 관련):
${topKeywords.map(keyword => 
  `${keyword}:
   - ${allKeywordToVideos[keyword].slice(0, 5).join('\n   - ')}${allKeywordToVideos[keyword].length > 5 ? '\n   - ...' : ''}`
).join('\n\n')}

가장 자주 등장하는 키워드 (상위 10개):
${topKeywords.map(keyword => `${keyword} (${allKeywordFrequencies[keyword]}회)`).join('\n')}

분석 요구사항:
1. 모든 영상이 최소 하나의 그룹에 포함되어야 합니다.
2. 각 그룹은 최소 3개 이상의 연관된 영상을 포함해야 합니다.하나의 영상이 여러 그룹에 포함될 수 있습니다.
3. 굵은 텍스트 절대 금지
4. 각 그룹은 사용자의 뚜렷한 관심사나 취향을 나타내야 합니다.
5. 클러스터 수는 최소 5개 이상이어야 합니다.
응답 형식:
CLUSTER_START
1. [그룹의 핵심 키워드 또는 인물명]
2.[콘텐츠 카테고리]
3. [(1) 나의 현재 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향을 반영해 3문장으로 설명]
4. [관련 키워드들을 빈도순으로 나열]
5. [감성과 태도 키워드 3-4개]
6. [해당 그룹에 속할 것으로 예상되는 영상 url]
CLUSTER_END`;

      // Log request
      await OpenAILogger.logRequest({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 2000,
        prompt: prompt
      });

      console.log('Sending request to OpenAI...');
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log('Received response from OpenAI:', {
        model: completion.model,
        usage: completion.usage,
        contentLength: completion.choices[0].message.content?.length
      });

      // Log response
      await OpenAILogger.logResponse({
        model: completion.model,
        content: completion.choices[0].message.content || '',
        usage: completion.usage
      });

      const response = completion.choices[0].message.content || '';
      console.log('Processing OpenAI response...');

      const clusters = response.split('CLUSTER_START')
        .slice(1)
        .map(cluster => {
          const clusterText = cluster.split('CLUSTER_END')[0].trim();
          const lines = clusterText.split('\n');
          const parsedData = lines.reduce((acc: any, line) => {
            const [key, value] = line.split(': ').map(s => s.trim());
            const keyMap: { [key: string]: string } = {
              '대표키워드': 'main_keyword',
              '카테고리': 'category',
              '관심영역': 'description',
              '연관키워드': 'keywords',
              '감성태도': 'mood_keyword',
              '예상영상수': 'video_count'
            };
            if (keyMap[key]) {
              acc[keyMap[key]] = value || '';
            }
            return acc;
          }, {});
          const relatedKeywords = parsedData.keywords ? 
            parsedData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : 
            [];
          const relatedVideos = watchHistory.filter(item => 
            item.keywords && Array.isArray(item.keywords) && 
            item.keywords.some(k => relatedKeywords.includes(k))
          );
          return {
            main_keyword: parsedData.main_keyword || '',
            sub_keyword: '',
            category: parsedData.category || '기타',
            description: parsedData.description || '',
            keyword_list: relatedKeywords.join(', '),
            mood_keyword: parsedData.mood_keyword || '',
            strength: relatedVideos.length,
            video_links: relatedVideos.map(v => v.videoId).join(','),
            related_videos: relatedVideos,
            created_at: new Date().toISOString(),
            desired_self: false,
            metadata: {
              keywordCount: relatedKeywords.length,
              videoCount: relatedVideos.length,
              moodKeywords: (parsedData.mood_keyword || '').split(',').map((k: string) => k.trim()).filter(Boolean)
            },
            main_image_url: ''
          } as Cluster;
        });

      return clusters;
    } catch (error) {
      console.error('Error in analyzeKeywordsWithOpenAI:', error);
      throw error;
    }
  };


  // STEP2-1>> 클러스터링 버튼 핸들러
  const handleCluster = async () => {
    setIsClustering(true);
    try {
      setIsLoading(true);
      // 1. 키워드 클러스터 분석
      const newClusters = await analyzeKeywordsWithOpenAI(watchHistory);
      // 2. 클러스터 데이터 포맷 변환 및 이미지 자동 저장
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const formattedClusters = [];
      for (const cluster of newClusters) {
        let main_image_url = '';
        if (userId && cluster.main_keyword) {
          // Pinterest 이미지 검색
          const pinterestResults = await searchClusterImage_pinterest(cluster.main_keyword, 1);
          const pinterestImageUrl = pinterestResults?.[0]?.thumbnailLink;
          if (pinterestImageUrl) {
            // Supabase Storage에 업로드
            const res = await fetch('/api/save-cluster-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: pinterestImageUrl, clusterName: cluster.main_keyword, userId }),
            });
            const { publicUrl } = await res.json();
            main_image_url = publicUrl;
          }
        }
        formattedClusters.push({
          main_keyword: cluster.main_keyword,
          sub_keyword: cluster.main_keyword,
          mood_keyword: cluster.mood_keyword,
          description: cluster.description,
          category: cluster.category,
          keyword_list: cluster.keyword_list,
          strength: cluster.strength,
          related_videos: cluster.related_videos,
          created_at: new Date().toISOString(),
          desired_self: false,
          metadata: cluster.metadata,
          main_image_url,
        });
      }

      // 3. Supabase에 저장할 데이터 준비 (타입 변환 및 undefined 방지)
      if (userId) {
        const clustersToSave = formattedClusters.map((cluster: any) => ({
          user_id: userId,
          main_keyword: String(cluster.main_keyword ?? ''),
          sub_keyword: String(cluster.sub_keyword ?? ''),
          mood_keyword: String(cluster.mood_keyword ?? ''),
          description: String(cluster.description ?? ''),
          category: (() => { try { const v = toPgArray(Array.isArray(cluster.category) ? cluster.category : String(cluster.category ?? '').split(',')); return typeof v === 'string' ? v : ''; } catch { return ''; } })(),
          keywords: (() => { try { const v = toPgArray(Array.isArray(cluster.keyword_list) ? cluster.keyword_list : String(cluster.keyword_list ?? '').split(',')); return typeof v === 'string' ? v : ''; } catch { return ''; } })(),
          strength: Number(cluster.strength ?? 0),
          video_links: (() => { try { const v = toPgArray(Array.isArray(cluster.related_videos) ? cluster.related_videos.map((v: any) => v.url) : (typeof cluster.video_links === 'string' ? cluster.video_links.split(',') : [])); return typeof v === 'string' ? v : ''; } catch { return ''; } })(),
          created_at: cluster.created_at ?? new Date().toISOString(),
          desired_self: !!cluster.desired_self,
          metadata: JSON.stringify(cluster.metadata ?? {}),
          main_image_url: cluster.main_image_url || '',
        }));
        const { error } = await supabase.from('clusters').insert(clustersToSave);
        if (error) {
          console.error('❌ clusters 저장 실패:', error);
          alert('클러스터 저장에 실패했습니다. 콘솔을 확인해주세요.');
        }
      }

      // 4. 클러스터 상태 반영
      setClusters(formattedClusters);
      
      // 5. 클러스터 이미지 검색 및 저장
      const clusterImagesData: Record<number, any> = {};
      for (let i = 0; i < formattedClusters.length; i++) {
        const imageUrl = formattedClusters[i].main_image_url || placeholderImage;
        clusterImagesData[i] = { url: imageUrl };
      }
      const profileImages = formattedClusters.map((cluster: any, index: number) => {
        const imageUrl = clusterImagesData[index]?.url || placeholderImage;
        return transformClusterToImageData(cluster, index, imageUrl);
      });
      localStorage.setItem('profileImages', JSON.stringify(profileImages));
      setShowAnalysis(true);
    } catch (error: any) {
      console.error('클러스터링 실패:', error);
      setError('클러스터링 중 오류가 발생했습니다.');
    } finally {
      setIsClustering(false);
      setIsLoading(false);
    }
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      setSuccessCount(0);
      
      if (file.name.endsWith('.json')) {
        parseJSONWatchHistory(file, dateRange, maxVideosPerDay, (current: number, total: number) => {
          setSuccessCount(current);
        })
          .then(async (processedHistory: any[]) => {
            setWatchHistory(processedHistory);
            await uploadWatchHistoryToSupabase(processedHistory);
            await handleCluster();
          })
          .catch((error: any) => {
            setError(error.message);
          })
          .finally(() => setIsLoading(false));
      } else if (file.name.endsWith('.html')) {
        parseWatchHistory(file)
          .then(async () => {
            await handleCluster();
          })
          .finally(() => setIsLoading(false));
      } else {
        setError('지원하지 않는 파일 형식입니다. .json 또는 .html 파일을 업로드해주세요.');
        setIsLoading(false);
      }
    }
  };
  // 드래그 이벤트 핸들러들
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      if (file.name.endsWith('.html')) {
        setIsLoading(true);
        setError(null);
        parseWatchHistory(file)
          .finally(() => setIsLoading(false));
      } else {
        setError('HTML 파일만 업로드 가능합니다.');
      }
    }
  };

  

  // STEP3>>이미지 검색 함수 수정
  const searchClusterImage = async (cluster: any, forceRefresh: boolean = false) => {
    try {
      console.log('🔍 이미지 검색 시작');
      console.log('클러스터 정보:', {
        main_keyword: cluster.main_keyword,
        category: cluster.category,
        mood_keyword: cluster.mood_keyword
      });

      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      const hasAttempted = localStorage.getItem(imageAttemptKey);
      
     

      // 이미지 URL 유효성 검사 함수
      const isImageUrlValid = async (url: string): Promise<boolean> => {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors' // CORS 정책 우회
          });
          return true; // no-cors 모드에서는 상태를 확인할 수 없으므로, 응답이 있다면 true 반환
        } catch {
          return false;
        }
      };

      // 검색 시도 함수
      const attemptImageSearch = async (searchParams: URLSearchParams) => {
        const response = await fetch(
          `/api/search-image?${searchParams.toString()}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': forceRefresh ? 'no-cache' : 'default'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // 유효한 이미지 URL만 필터링
        if (data.items?.length > 0) {
          const validItems = [];
          for (const item of data.items) {
            if (await isImageUrlValid(item.link)) {
              validItems.push(item);
            }
          }
          data.items = validItems;
        }
        
        return data;
      };

      // 첫 번째 시도: 모든 키워드 포함
      const searchParams = new URLSearchParams();
      
      // 1. 메인 키워드 처리
      console.log('1️⃣ 메인 키워드 처리 시작');
      let mainKeyword = cluster.main_keyword;
      if (cluster.main_keyword.includes('인물')) {
        mainKeyword = `${mainKeyword} 인물사진 프로필`;
        console.log('👤 인물 키워드 감지 - 수정된 키워드:', mainKeyword);
      }
      searchParams.append('query', mainKeyword);
      console.log('메인 키워드 처리 완료:', mainKeyword);
      
      // 2. 카테고리 추가
      console.log('2️⃣ 카테고리 처리 시작');
      if (cluster.category && cluster.category !== '기타') {
        searchParams.append('category', cluster.category);
        console.log('카테고리 추가:', cluster.category);
      } else {
        console.log('카테고리 제외: 기타 또는 없음');
      }
      
      // 3. 감성 키워드 추가
      console.log('3️⃣ 감성 키워드 처리 시작');
      if (cluster.mood_keyword) {
        const moodKeywords = cluster.mood_keyword.split(',')[0].trim();
        searchParams.append('mood', moodKeywords);
        console.log('감성 키워드 추가:', moodKeywords);
      } else {
        console.log('감성 키워드 없음');
      }

      if (forceRefresh) {
        searchParams.append('t', new Date().getTime().toString());
        console.log('🔄 강제 새로고침 적용');
      }

      console.log('📝 첫 번째 시도 검색 쿼리:', searchParams.toString());
      
      try {
        // 첫 번째 시도
        let data = await attemptImageSearch(searchParams);
        
        if (!data.items?.length) {
          // 첫 번째 시도 실패 시, 메인 키워드로만 재시도
          console.log('⚠️ 첫 번째 검색 실패, 메인 키워드로만 재시도');
          const simpleSearchParams = new URLSearchParams();
          simpleSearchParams.append('query', mainKeyword);
          if (forceRefresh) {
            simpleSearchParams.append('t', new Date().getTime().toString());
          }
          
          console.log('📝 두 번째 시도 검색 쿼리:', simpleSearchParams.toString());
          data = await attemptImageSearch(simpleSearchParams);
          
          if (!data.items?.length) {
            throw new Error('모든 검색 시도 실패');
          }
        }

        // 이전 결과와 다른 이미지를 선택
        const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
        const currentImage = savedImages[cluster.main_keyword]?.url;
        
        // 현재 이미지와 다른 새로운 이미지 찾기
        const availableImages = data.items.filter((item: any) => item.link !== currentImage);
        console.log('🖼 사용 가능한 이미지 수:', availableImages.length);
        
        const selectedImage = availableImages.length > 0 ? 
          availableImages[Math.floor(Math.random() * availableImages.length)] : 
          data.items[0];
        
        // 이미지 URL에 타임스탬프 추가하여 캐시 방지
        const imageUrl = new URL(selectedImage.link);
        imageUrl.searchParams.append('t', new Date().getTime().toString());
        
        const image = {
          url: imageUrl.toString(),
          credit: {
            name: 'Naver',
            link: selectedImage.link
          }
        };

        // 로컬 스토리지에 이미지 저장
        savedImages[cluster.main_keyword] = image;
        localStorage.setItem('clusterImages', JSON.stringify(savedImages));
        
        // 성공 기록 저장
        localStorage.setItem(imageAttemptKey, 'success');
        console.log('💾 이미지 저장 완료');
        return image;
      } catch (error) {
        console.error('❌ 모든 검색 시도 실패:', error);
        localStorage.setItem(imageAttemptKey, 'failed');
        console.groupEnd();
        return {
          url: '/images/default_image.png',
        };
      }
    } catch (error) {
      console.error('❌ 이미지 검색 실패:', error);
      console.groupEnd();
      
      const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
      localStorage.setItem(imageAttemptKey, 'failed');
      
      return {
        url: '/images/default_image.png',
      };
    }
  };

  useEffect(() => {
  const loadClusterHistory = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return;

    const clusterHistory = await fetchClusterHistoryFromSupabase(userId);
    // created_at(분 단위) 기준으로 그룹핑
    const groupMap = new Map();
    clusterHistory.forEach(cluster => {
      // created_at을 'YYYY-MM-DDTHH:mm'까지 잘라서 그룹핑
      const key = cluster.created_at.slice(0, 16);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(cluster);
    });
    const grouped = Array.from(groupMap.entries()).map(([created_at, clusters]) => ({
      created_at,
      clusters
    }));
    setAnalysisHistory(grouped);
  };

  loadClusterHistory();
}, []);

  // 메인 컴포넌트에서 클러스터 이미지 설정 부분 수정
  useEffect(() => {
    const fetchClusterImages = async () => {
      const newClusterImages = {} as Record<number, ClusterImage | null>
      
      for (let i = 0; i < clusters.length; i++) {
        newClusterImages[i] = await searchClusterImage(clusters[i]);
      }
      
      setClusterImages(newClusterImages);
    };

    if (clusters.length > 0) {
      fetchClusterImages();
    }
  }, [clusters]);

  // 컴포넌트 초기화 시 저장된 이미지 로드
  useEffect(() => {
    const loadSavedImages = () => {
      const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
      const newClusterImages = { ...clusterImages };
      
      clusters.forEach((cluster, index) => {
        if (savedImages[cluster.main_keyword]) {
          newClusterImages[index] = savedImages[cluster.main_keyword];
        }
      });
      
      setClusterImages(newClusterImages);
    };

    loadSavedImages();
  }, [clusters]); // clusters가 변경될 때마다 실행

  // useEffect에 분석 기록 로드 추가
  useEffect(() => {
    // 기존 코드...
    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    setAnalysisHistory(savedAnalyses);
  }, []);

  const handleDownloadJSON = () => {
    const filteredWatchHistory = watchHistory.filter(item => 
      item.keywords && item.keywords.length > 0
    );

    const data = {
      watchHistory: filteredWatchHistory,
      timestamp: new Date().toISOString(),
      totalVideos: filteredWatchHistory.length,
      totalKeywords: new Set(filteredWatchHistory.flatMap(item => item.keywords)).size,
      originalTotalVideos: watchHistory.length,
      filteredOutVideos: watchHistory.length - filteredWatchHistory.length
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-watch-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`총 ${filteredWatchHistory.length}개의 영상 데이터가 다운로드되었습니다.\n(키워드 생성 실패로 ${watchHistory.length - filteredWatchHistory.length}개 제외)`);
  };

  const handleDownloadClusterJSON = () => {
    const data = {
      clusters: clusters,
      timestamp: new Date().toISOString(),
      totalClusters: clusters.length
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-clusters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 유틸리티: 안전하게 날짜 포맷팅
  function safeFormatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  }

  // 기록 초기화 버튼 핸들러 수정
  const handleReset = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (userId) {
      // Supabase에서 해당 사용자의 데이터 삭제
      await supabase.from('clusters').delete().eq('user_id', userId);
      await supabase.from('WatchHistoryItem').delete().eq('user_id', userId);
      await supabase.from('videos').delete().eq('user_id', userId);
    }
    
    // UI 상태 초기화
    setWatchHistory([]);
    setClusters([]);
    setAnalysisHistory([]);
    setShowAnalysis(false);
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
        <div className="space-y-7 max-w-8xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold px-4 sm:px-14">
              <div className="inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600">
                Are you curious how your algorithm sees you?
                </span>
              </div>
            </h1>
          </div>
        </div>

        <div className="w-full max-w-[700px] p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full cursor-pointer backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 ${
              isDragging 
                ? 'border-2 border-blue-500 bg-blue-50/30 scale-[1.02] shadow-lg' 
                : 'border-2 border-gray-200/60 hover:border-blue-400/60 shadow-sm hover:shadow-md bg-white/70'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.html"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-blue-500" />
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {isLoading ? '처리 중...' : (
                    isDragging 
                      ? '여기에 파일을 놓아주세요'
                      : 'Google Takeout에서 다운로드한\nYoutube 시청기록 파일을 업로드하세요'
                  )}
                </p>
                <style jsx>{`
                  p {
                    white-space: pre-line;
                  }
                `}</style>
                <p className="text-sm text-gray-500">
                  {isLoading ? (
                    <span className="w-full max-w-md mx-auto">
                      <span className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <span 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${(successCount / maxVideosPerDay) * 100}%`,
                            animation: 'progress-animation 1.5s ease-in-out infinite'
                          }}
                        />
                      </span>
                      <span className="mt-2 text-sm text-gray-600">{successCount}/{maxVideosPerDay}개 분석 완료</span>
                    </span>
                  ) : (
                    '파일을 드래그하거나 클릭하여 업로드'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 데이터 개수 선택 Slider와 기간 선택 추가 */}
          <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <div className="space-y-6">
              {/* 기간 선택 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  분석 기간 선택
                </label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !dateRange.from && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          format(dateRange.from, "PPP", { locale: ko })
                        ) : (
                          <span>시작일 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => {
                          setDateRange((prev) => ({
                            ...prev,
                            from: date,
                          }));
                        }}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !dateRange.to && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? (
                          format(dateRange.to, "PPP", { locale: ko })
                        ) : (
                          <span>종료일 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => {
                          setDateRange((prev) => ({
                            ...prev,
                            to: date,
                          }));
                        }}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-gray-500">
                  분석할 기간을 선택하세요. 선택하지 않으면 전체 기간이 분석됩니다.
                </p>
              </div>

              {/* 데이터 개수 선택 Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    일별 최대 분석 영상 수
                  </label>
                  <span className="text-sm text-gray-500">{maxVideosPerDay}개</span>
                </div>
                <Slider
                  value={[maxVideosPerDay]}
                  onValueChange={(value) => setMaxVideosPerDay(value[0])}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  하루에 분석할 최대 영상 수를 선택하세요. 숫자가 클수록 분석 시간이 길어집니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <HoverCard>
              <HoverCardTrigger>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Google Takeout 가이드 보기</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[600px] p-6 rounded-xl shadow-lg" side="bottom" align="center">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 pb-2 border-b">
                    <Youtube className="w-5 h-5 text-blue-500" />
                    Google Takeout에서 Youtube 시청기록 내보내기
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">1. Google Takeout 접속</div>
                      <a 
                        href="https://takeout.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-500 hover:underline"
                      >
                        takeout.google.com
                      </a>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">2. YouTube 데이터 선택</div>
                      <p className="text-sm text-gray-500">다른 항목 모두 해제</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">3. 시청기록 선택</div>
                      <p className="text-sm text-gray-500">모든 YouTube 데이터 포함 → 시청기록</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-medium text-gray-700 mb-2">4. 내보내기</div>
                      <p className="text-sm text-gray-500">HTML 형식 선택 후 내보내기</p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
                        
        

        {watchHistory.length > 0 && (
          <div className="mt-8 w-full max-w-[897px] bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">분석된 시청 기록</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadJSON}
                  variant="outline"
                  className="hover:bg-green-50 text-green-600"
                >
                  시청기록 JSON 다운로드
                </Button>
                {clusters.length > 0 && (
                  <Button 
                    onClick={handleDownloadClusterJSON}
                    variant="outline"
                    className="hover:bg-blue-50 text-blue-600"
                  >
                    클러스터 JSON 다운로드
                  </Button>
                )}
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="hover:bg-red-50 text-red-500"
                >
                  기록 초기화
                </Button>
                <Button 
                  onClick={handleCluster}
                  variant="outline"
                  className="hover:bg-blue-50"
                >
                  새로운 클러스터 분석
                </Button>
              </div>
            </div>

            {/* 분석 기록 목록 */}
            {analysisHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">분석 기록</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisHistory.map((analysis, index) => (
                    <Button
                      key={analysis.created_at || index}
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          setClusters(analysis.clusters);
                          setShowAnalysis(true);
                        } catch (e) {
                          console.error('클러스터 불러오기 실패:', e);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      variant="outline"
                      className="hover:bg-blue-50"
                    >
                      분석 {index + 1} ({safeFormatDate(analysis.created_at)})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">기본 정보</h3>
                <p>총 영상 수: {watchHistory.length}</p>
                <p>총 키워드 수: {
                  new Set(watchHistory.flatMap(item => item.keywords)).size
                }</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">최다 출현 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    watchHistory.flatMap(item => item.keywords)
                      .reduce((acc: {[key: string]: number}, keyword) => {
                        acc[keyword] = (acc[keyword] || 0) + 1;
                        return acc;
                      }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([keyword, count]) => (
                      <span key={keyword} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                        {keyword} ({count})
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {showAnalysis && clusters.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">클러스터 분석 결과</h3>
                  
                </div>
                <div className="space-y-4">
                  {clusters.map((cluster, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          const newExpandedClusters = new Set(expandedClusters);
                          if (newExpandedClusters.has(index)) {
                            newExpandedClusters.delete(index);
                          } else {
                            newExpandedClusters.add(index);
                          }
                          setExpandedClusters(newExpandedClusters);
                        }}
                        className="w-full px-6 py-4 bg-white hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-4 mb-1">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {cluster.main_keyword}
                            </span>
                            <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
                              {cluster.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              영상 {cluster.related_videos?.length || 0}개 {cluster.mood_keyword && `• ${cluster.mood_keyword}`}
                            </span>
                          </div>
                          {cluster.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 text-left w-full">
                              {cluster.description}
                            </p>
                          )}
                        </div>
                        <svg
                          className={`w-6 h-6 transform transition-transform ${
                            expandedClusters.has(index) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedClusters.has(index) && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          {/* 이미지 검색 버튼과 키워드 표시 */}
                          <div className="mb-4 p-4 bg-white rounded-lg">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-gray-700">대표 이미지 검색 (Pinterest)</h5>
                              <Button
                                onClick={async () => {
                                  try {
                                    const keyword = cluster.main_keyword;
                                    console.log('Pinterest 이미지 검색 시작:', keyword);
                                    
                                    // 캐시 초기화
                                    const imageAttemptKey = `imageAttempt_pinterest_${keyword}`;
                                    localStorage.removeItem(imageAttemptKey);
                                    
                                    // 기존 저장된 이미지 삭제 (clusterImages 상태 및 localStorage)
                                    const currentSavedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
                                    delete currentSavedImages[keyword]; // 키워드 기준으로 삭제
                                    localStorage.setItem('clusterImages', JSON.stringify(currentSavedImages));
                                    setClusterImages(prev => {
                                      const newImages = { ...prev };
                                      newImages[index] = null; // 상태에서도 즉시 제거 또는 로딩 상태 표시
                                      return newImages;
                                    });

                                    // Pinterest 이미지 검색 호출
                                    const pinterestResults = await searchClusterImage_pinterest(keyword, 1); 
                                    console.log('검색된 Pinterest 이미지:', pinterestResults);

                                    if (pinterestResults && pinterestResults.length > 0 && pinterestResults[0].thumbnailLink) {
                                      const firstImage = pinterestResults[0];
                                      // 첫 번째 결과의 썸네일 링크를 url에 저장 (credit 없음)
                                      const newImage: ClusterImage = { url: firstImage.thumbnailLink };
                                      
                                      setClusterImages(prev => {
                                        const newImages = { ...prev };
                                        newImages[index] = newImage;
                                        return newImages;
                                      });
                                       // localStorage에도 url만 저장
                                       const updatedSavedImages = { ...currentSavedImages, [keyword]: newImage };
                                       localStorage.setItem('clusterImages', JSON.stringify(updatedSavedImages));
                                       localStorage.setItem(imageAttemptKey, 'success'); // 성공 기록
                                    } else {
                                      console.log('Pinterest 이미지를 찾지 못했거나 썸네일 링크가 없습니다.');
                                      // 이미지를 찾지 못한 경우, 올바른 경로의 default_image URL 사용
                                      const defaultImageUrl = '/images/default_image.png'; // 올바른 경로로 수정
                                      const defaultImage: ClusterImage = { url: defaultImageUrl }; 
                                       setClusterImages(prev => {
                                         const newImages = { ...prev };
                                         newImages[index] = defaultImage; // 기본 이미지로 설정
                                         return newImages;
                                       });
                                       // localStorage에서도 default_image URL로 업데이트
                                       const updatedSavedImages = { ...currentSavedImages, [keyword]: defaultImage }; // 기본 이미지로 저장
                                       localStorage.setItem('clusterImages', JSON.stringify(updatedSavedImages));
                                       localStorage.setItem(imageAttemptKey, 'failed'); // 실패 기록
                                    }
                                  } catch (error) {
                                    console.error('Pinterest 이미지 검색/업데이트 실패:', error);
                                    // 사용자에게 오류 알림 (toast 등 사용)
                                    // 오류 발생 시에도 기본 이미지 설정 (선택 사항)
                                    const defaultImageUrlOnError = '/images/default_image.png'; // 올바른 경로로 수정
                                    const defaultImageOnError: ClusterImage = { url: defaultImageUrlOnError };
                                    setClusterImages(prev => {
                                      const newImages = { ...prev };
                                      // 에러 발생 시에도 기본 이미지로 설정할 수 있음
                                      if (!newImages[index]) { // 이미지가 아직 설정되지 않은 경우에만
                                         newImages[index] = defaultImageOnError;
                                      }
                                      return newImages;
                                    });
                                  }
                                }}
                                variant="outline"
                                className="hover:bg-red-50 text-red-600"
                              >
                                Pinterest에서 검색
                              </Button>
                            </div>
                            {clusterImages[index]?.url && (
                              <div className="mt-2 text-sm text-gray-500">
                                현재 이미지 URL: {clusterImages[index]?.url?.substring(0, 50)}...
                              </div>
                            )}
                          </div>

                          {/* 클러스터 대표 이미지 */}
                          {clusterImages[index]?.url && (
                            <div className="space-y-4">
                              <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                                <img
                                  src={clusterImages[index]?.url || placeholderImage} // .url 사용
                                  alt={cluster.main_keyword}
                                  className="w-full h-full object-contain bg-gray-100"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    console.error('이미지 로드 실패:', target.src);
                                    
                                    if (target.src === placeholderImage) return;
                                    
                                    target.src = placeholderImage;
                                    
                                    setClusterImages(prev => {
                                      const newImages = { ...prev };
                                      // credit 없이 url만 placeholder로 설정
                                      newImages[index] = { url: placeholderImage }; 
                                      return newImages;
                                    });
                                  }}
                                />
                                {/* credit 정보 표시 부분 제거 또는 수정 */}
                                {/* <div className="absolute bottom-0 right-0 p-2 text-xs text-white bg-black bg-opacity-50">
                                  출처: {clusterImages[index]?.credit?.name || '-'} 
                                </div> */}
                              </div>
                              
                              {/* 핀터레스트 검색 버튼들 */}
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => {
                                    const imageUrl = clusterImages[index]?.url;
                                    if (imageUrl && imageUrl !== placeholderImage) {
                                      // 일반 검색
                                      window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(cluster.main_keyword)}`, '_blank');
                                    }
                                  }}
                                  variant="outline"
                                  className="flex items-center gap-2 hover:bg-red-50 text-red-500"
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.43.04-3.47.22-.97 1.4-6.16 1.4-6.16s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.39 2.55-5.39 5.18 0 1.02.39 2.12.89 2.71.1.12.11.22.08.34l-.33 1.37c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.77 2.74-7.25 7.9-7.25 4.14 0 7.36 2.95 7.36 6.9 0 4.12-2.6 7.43-6.2 7.43-1.21 0-2.35-.63-2.74-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
                                  </svg>
                                  키워드 검색
                                </Button>
                                
                                <Button
                                  onClick={async () => {
                                    const imageUrl = clusterImages[index]?.url;
                                    if (imageUrl && imageUrl !== placeholderImage) {
                                      try {
                                        // 로딩 상태 표시
                                        setIsLoading(true);

                                        // Google Vision API 호출
                                        const response = await fetch('/api/google-vision-search', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ imageUrl }),
                                        });

                                        if (!response.ok) {
                                          throw new Error('API 호출 실패');
                                        }

                                        const data = await response.json();

                                        // 결과 모달 표시
                                        setVisionSearchResults({
                                          similarImages: data.similarImages,
                                          labels: data.labels,
                                        });
                                        setShowVisionResults(true);
                                      } catch (error) {
                                        console.error('Vision 검색 실패:', error);
                                        alert('이미지 검색 중 오류가 발생했습니다.');
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    } else {
                                      alert('유효한 이미지가 없습니다.');
                                    }
                                  }}
                                  variant="outline"
                                  className="flex items-center gap-2 hover:bg-purple-50 text-purple-500"
                                  disabled={isLoading}
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {isLoading ? '검색 중...' : 'Vision 검색'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">최근 분석된 영상</h3>
              <div className="space-y-3">
                {watchHistory
                  .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()) // 최신순 정렬
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:text-blue-600"
                      >
                        {item.title}
                      </a>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.keywords?.map((keyword: string, kidx: number) => (
                          <span key={kidx} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <Button 
                onClick={() => {
                  // 가장 최신 분석 결과 가져오기
                  const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
                  if (savedAnalyses.length > 0) {
                    const latestAnalysis = savedAnalyses[savedAnalyses.length - 1];
                    // 최신 분석 결과를 profileImages로 변환
                    const profileImages = latestAnalysis.clusters.map((cluster: any, index: number) => {
                      // clusterImages가 없거나 해당 인덱스의 이미지가 없을 경우 placeholderImage 사용
                      const imageUrl = clusterImages[index]?.url || placeholderImage;
                      return transformClusterToImageData(cluster, index, imageUrl);
                    });
                    // profileImages 저장
                    localStorage.setItem('profileImages', JSON.stringify(profileImages));
                    console.log('✨ 프로필 데이터 저장 성공!');
                    alert('프로필 데이터가 성공적으로 저장되었습니다!');
                  }
                }}
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all px-16 py-8 text-2xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] text-white"
              >
                <Link href="/my_profile">
                  Tell me who I am
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 검색 결과 모달 */}
      {showVisionResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Vision 검색 결과</h3>
              <Button
                variant="ghost"
                onClick={() => setShowVisionResults(false)}
                className="hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            {/* 유사 이미지 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">유사한 이미지</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visionSearchResults.similarImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={img.url}
                      alt={`Similar image ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = placeholderImage;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-bl-lg">
                      {(img.score * 100).toFixed(0)}% 유사
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 관련 레이블 */}
            <div>
              <h4 className="font-medium mb-3">관련 키워드</h4>
              <div className="flex flex-wrap gap-2">
                {visionSearchResults.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                    title={`신뢰도: ${(label.score * 100).toFixed(0)}%`}
                  >
                    {label.description}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
