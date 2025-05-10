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
      {/* ... (기존 JSX 코드 전체 붙여넣기) ... */}
      {/* 이 부분은 매우 길어서 여기서는 간략하게 표시합니다. */}
      <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
        <p>시청 기록 업로드 및 분석 페이지 (내용 구성 필요)</p>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="h-20"></div> 
    </main>
  );
}
