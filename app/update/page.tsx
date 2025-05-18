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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

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
type WatchHistoryItem = {
  title: string;
  videoId: string;
  keywords: string[];
  tags?: string[];
  timestamp?: string;
  url?: string;
  date?: any;  // any 타입으로 변경
  channelName?: string;  // 옵셔널로 변경
};

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

export default function UpdatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
  const [successCount, setSuccessCount] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<{
    id: string;
    date: string;
    clusters: any[];
  }[]>([]);
  const [showVisionResults, setShowVisionResults] = useState(false);
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

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    setWatchHistory(savedHistory);
    const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
    setClusters(savedClusters);
  }, []);

  useEffect(() => {
    const migrateLocalStorageData = () => {
      try {
        const storedClusterImages = localStorage.getItem('clusterImages');
        if (storedClusterImages) {
          const parsedClusterImages = JSON.parse(storedClusterImages);
          const migratedClusterImages: Record<string, any> = {};
          Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object') {
              migratedClusterImages[key] = {
                ...value,
                main_keyword: key,
              };
            } else {
              migratedClusterImages[key] = value;
            }
          });
          localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
          console.log('클러스터 이미지 데이터 마이그레이션 완료');
        }
        localStorage.setItem('clusterDataMigrationCompleted', 'true');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
      }
    };
    const migrationCompleted = localStorage.getItem('clusterDataMigrationCompleted');
    if (migrationCompleted !== 'true') {
      migrateLocalStorageData();
    }
  }, []);

  const fetchVideoInfo = async (videoId: string) => {
    try {
      console.log('Fetching video info for:', videoId);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );
      if (!response.ok) throw new Error('YouTube API 요청 실패');
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoInfo = data.items[0].snippet;
        console.log('Retrieved video info:', { title: videoInfo.title, hasDescription: !!videoInfo.description, tagCount: videoInfo.tags?.length || 0 });
        try {
          const extractedKeywords = await extractVideoKeywords(videoInfo);
          console.log('Extracted keywords:', extractedKeywords);
          if (!extractedKeywords || extractedKeywords.length === 0) {
            console.warn('No keywords extracted, using tags as fallback');
            const currentWatchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
            const newItem = { videoId, title: videoInfo.title, tags: videoInfo.tags || [], keywords: videoInfo.tags ? videoInfo.tags.slice(0, 5) : [], timestamp: new Date().toISOString() };
            currentWatchHistory.push(newItem);
            localStorage.setItem('watchHistory', JSON.stringify(currentWatchHistory));
            return true;
          }
          const currentHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
          const newItem = { videoId, title: videoInfo.title, tags: videoInfo.tags || [], keywords: extractedKeywords.map((k: any) => k.keyword), timestamp: new Date().toISOString() }; // k 타입 명시
          console.log('Saving to watch history:', { videoId, title: videoInfo.title, keywordCount: extractedKeywords.length });
          const updatedHistory = [...currentHistory, newItem];
          localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
          return true;
        } catch (error) {
          console.error('키워드 추출 실패:', error);
          const currentWatchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
          const newItem = { videoId, title: videoInfo.title, tags: videoInfo.tags || [], keywords: videoInfo.tags ? videoInfo.tags.slice(0, 5) : [], timestamp: new Date().toISOString() };
          currentWatchHistory.push(newItem);
          localStorage.setItem('watchHistory', JSON.stringify(currentWatchHistory));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('비디오 정보 가져오기 실패:', error);
      throw error;
    }
  };

  const parseWatchHistory = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const watchItems = Array.from(doc.querySelectorAll('.content-cell'));
      console.log('Found watch items:', watchItems.length);
      alert('HTML 파싱 완료 (임시 메시지) - 실제 로직 구현 필요');
    } catch (err) {
      console.error('시청기록 파싱 실패:', err);
      setError(err instanceof Error ? err.message : '시청기록 파일 처리 중 오류가 발생했습니다.');
    }
  };

  const extractVideoKeywords = async (videoInfo: any) => {
    console.log('extractVideoKeywords 호출됨 (임시)', videoInfo);
    return [];
  };

  const analyzeKeywordsWithOpenAI = async (currentWatchHistory: WatchHistoryItem[]) => {
    console.log('analyzeKeywordsWithOpenAI 호출됨 (임시)', currentWatchHistory.length);
    return [];
  };

  const handleCluster = async () => {
    try {
      setIsLoading(true);
      const newClusters = await analyzeKeywordsWithOpenAI(watchHistory);
      const newAnalysis = { id: new Date().getTime().toString(), date: new Date().toLocaleString(), clusters: newClusters };
      const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      const updatedAnalyses = [...savedAnalyses, newAnalysis];
      localStorage.setItem('analysisHistory', JSON.stringify(updatedAnalyses));
      setAnalysisHistory(updatedAnalyses);
      setClusters(newClusters);
      const clusterImagesData: Record<number, any> = {};
      for (let i = 0; i < newClusters.length; i++) {
        // 경로 수정 필요: const image = await searchClusterImage(newClusters[i], true);
        // clusterImagesData[i] = image;
      }
      const profileImages = newClusters.map((cluster: any, index: number) => {
        const imageUrl = clusterImagesData[index]?.url || placeholderImage;
        return {}; // 임시 반환
      });
      localStorage.setItem('profileImages', JSON.stringify(profileImages));
      setShowAnalysis(true);
    } catch (error) {
      console.error('클러스터링 실패:', error);
      setError('클러스터링 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      setSuccessCount(0);
      if (file.name.endsWith('.json')) {
        alert('JSON 파일 처리 (임시) - 실제 로직 구현 필요');
        setIsLoading(false);        
      } else if (file.name.endsWith('.html')) {
        parseWatchHistory(file).finally(() => setIsLoading(false));
      } else {
        setError('지원하지 않는 파일 형식입니다. .json 또는 .html 파일을 업로드해주세요.');
        setIsLoading(false);
      }
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      if (file.name.endsWith('.html')) {
        setIsLoading(true); setError(null);
        parseWatchHistory(file).finally(() => setIsLoading(false));
      } else {
        setError('HTML 파일만 업로드 가능합니다.');
      }
    }
  };

  const searchClusterImage = async (cluster: any, forceRefresh: boolean = false) => {
    console.log('searchClusterImage 호출됨 (임시)', cluster, forceRefresh);
    return { url: placeholderImage };
  };

  useEffect(() => {
    const fetchClusterImages = async () => {
      const newClusterImages = {} as Record<number, ClusterImage | null>;
      for (let i = 0; i < clusters.length; i++) {
        newClusterImages[i] = await searchClusterImage(clusters[i]);
      }
      setClusterImages(newClusterImages);
    };
    if (clusters.length > 0) fetchClusterImages();
  }, [clusters]);

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
  }, [clusters]);

  useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    setAnalysisHistory(savedAnalyses);
  }, []);

  const handleDownloadJSON = () => {
    const filteredWatchHistory = watchHistory.filter(item => item.keywords && item.keywords.length > 0);
    const data = { watchHistory: filteredWatchHistory, timestamp: new Date().toISOString(), totalVideos: filteredWatchHistory.length, totalKeywords: new Set(filteredWatchHistory.flatMap(item => item.keywords)).size, originalTotalVideos: watchHistory.length, filteredOutVideos: watchHistory.length - filteredWatchHistory.length };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-watch-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    alert(`총 ${filteredWatchHistory.length}개의 영상 데이터가 다운로드되었습니다.\n(키워드 생성 실패로 ${watchHistory.length - filteredWatchHistory.length}개 제외)`);
  };

  const handleDownloadClusterJSON = () => {
    if (!clusters || clusters.length === 0) { alert('분석된 클러스터 데이터가 없습니다.'); return; }
    const data = { clusters, timestamp: new Date().toISOString(), totalClusters: clusters.length, totalVideos: clusters.reduce((sum, cluster) => sum + (cluster.related_videos?.length || 0), 0), metadata: { dateRange: dateRange, maxVideosPerDay: maxVideosPerDay } };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-cluster-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    alert(`총 ${clusters.length}개의 클러스터 데이터가 다운로드되었습니다.`);
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
                  onClick={() => {
                    localStorage.removeItem('watchHistory');
                    localStorage.removeItem('watchClusters');
                    localStorage.removeItem('analysisHistory');
                    setWatchHistory([]);
                    setClusters([]);
                    setAnalysisHistory([]);
                    setShowAnalysis(false);
                  }}
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
                      key={analysis.id}
                      onClick={() => {
                        setClusters(analysis.clusters);
                        setShowAnalysis(true);
                      }}
                      variant="outline"
                      className="hover:bg-blue-50"
                    >
                      분석 {index + 1} ({analysis.date})
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
                              영상 {cluster.related_videos.length}개 {cluster.mood_keyword && `• ${cluster.mood_keyword}`}
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
