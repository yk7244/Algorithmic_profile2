"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import OpenAI from 'openai';
import { HelpCircle, Upload, ArrowRight, Youtube, CalendarIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { transformClustersToImageData, transformClusterToImageData } from '../utils/clusterTransform';
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { OpenAILogger } from '../utils/init-logger';
import { parseJSONWatchHistory, processSelectedItems } from './VideoParsing/jsonParser';
import { parseWatchHistory } from './VideoParsing/htmlParser';
import { handleFileUpload, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } from './Handlers/fileHandlers';
import { handleDownloadJSON, handleDownloadClusterJSON } from './Handlers/downloadHandlers';
import { isOneWeekPassed } from './VideoParsing/dateUtils';
import { getCurrentUserId } from '@/lib/database';

//Refactoring
import { searchClusterImage_pinterest, PinterestImageData } from './ImageSearch/GoogleImageSearch';
import { searchClusterImage } from './ImageSearch/NaverImageSearch';
import { VideoCluster, handleCluster} from './VideoAnalysis/videoCluster';
import { fetchVideoInfo } from './VideoAnalysis/videoKeyword';
import { useClusterStorage } from './hooks/useClusterStorage';
import { my_account } from '../data/dummyData';
import { saveClusterHistory } from '../utils/saveClusterHistory';
import { saveSliderHistory } from '../utils/saveSliderHistory';

// 기본 이미지를 데이터 URI로 정의
const placeholderImage = '/images/default_image.png'

// OpenAI 클라이언트 초기화 수정
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});


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

// 클러스터 이미지 타입 정의 수정
type ClusterImage = {
  url: string;
  // credit 필드를 옵셔널로 만듭니다.
  credit?: {
    name: string;
    link: string;
  };
};


export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());
  // clusterImages state 타입 수정
  const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
  const [successCount, setSuccessCount] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<{
    id: string;
    date: string;
    clusters: any[];
  }[]>([]);
  const [showVisionResults, setShowVisionResults] = useState(false);
  
  const [maxVideosPerDay, setMaxVideosPerDay] = useState(30);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const [uploadFinished, setUploadFinished] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [profile, setProfile] = useState({ nickname: '', description: '' });

  // 🆕 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsAuthChecking(true);
        const userId = await getCurrentUserId();
        
        if (!userId) {
          console.log('[Upload] 로그인되지 않음, 로그인 페이지로 리다이렉트');
          router.push('/login?redirect=/upload');
          return;
        }
        
        console.log('[Upload] 로그인 확인됨, 업로드 페이지 진입 허용');
      } catch (error) {
        console.error('[Upload] 인증 확인 실패:', error);
        router.push('/login?redirect=/upload');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  // 인증 확인 중이면 로딩 표시
  if (isAuthChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">로그인 상태 확인 중...</p>
        </div>
      </main>
    );
  }

  // handleClusterClick 래퍼 함수 추가
  const handleClusterClick = () => {
    handleCluster(
      watchHistory,
      openai,
      OpenAILogger,
      searchClusterImage,
      transformClusterToImageData,
      placeholderImage,
      setClusters,
      setAnalysisHistory,
      setShowAnalysis,
      setIsLoading,
      setError,
    );
  };

  // 🔄 캐시 활용 모드: 이미 videos 테이블에 있는 것은 캐시 사용, 없는 것만 API 호출

  // useClusterStorage 커스텀 훅 사용
  useClusterStorage({
    setWatchHistory,
    setClusters,
    setClusterImages,
    clusterImages,
    clusters,
    setAnalysisHistory,
    searchClusterImage
  });
  //console.log(isOneWeekPassed(my_account.updated_at))
  //console.log(my_account.updated_at)
  
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/30 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-pink-400/20 blur-[120px] animate-blob animation-delay-4000" />
      </div>
      
      <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
        {/* 타이틀 */}
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
        {/* 파일 업로드 버튼 */}
        <div className="w-full max-w-[700px] p-8">
          
          
            
              <>  
                {/* 업데이트 가능하면 파일 업로드 버튼 */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full cursor-pointer backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 ${
                      isDragging 
                        ? 'border-2 border-blue-500 bg-blue-50/30 scale-[1.02] shadow-lg' 
                        : 'border-2 border-gray-200/60 hover:border-blue-400/60 shadow-sm hover:shadow-md bg-white/70'
                    }`}
                    onDragEnter={e => handleDragEnter(e, setIsDragging)}
                    onDragOver={handleDragOver}
                    onDragLeave={e => handleDragLeave(e, setIsDragging)}
                    onDrop={e => handleDrop(e, {
                      setIsDragging,
                      setIsLoading,
                      setError,
                      setSuccessCount,
                      dateRange,
                      maxVideosPerDay,
                                              fetchVideoInfo, // 🔄 캐시 활용
                      openai,
                      OpenAILogger,
                      parseWatchHistory
                    })}
                  >
                  
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.html"
                      onChange={e => {
                        handleFileUpload(e, {
                          setIsLoading,
                          setError,
                          setSuccessCount,
                          setWatchHistory,
                          dateRange,
                          maxVideosPerDay,
                          fetchVideoInfo, // 🔄 캐시 활용 (있는 것은 캐시, 없는 것만 API 호출)
                          openai,
                          OpenAILogger,
                          parseJSONWatchHistory,
                          parseWatchHistory
                        });
                        setIsFileUploaded(true); // 파일 업로드 성공 시 true로 변경
                      }}
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
                {/* 분석개수Slider, 기간 달력 */}
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
                                format(dateRange.from, "PPP", { locale: ko  })
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
                              {dateRange.to && dateRange.to instanceof Date ? (
                                format(dateRange.to as Date, "PPP", { locale: ko })
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
                {/* 호버시 설명 란*/}
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
              </>

              {/* 업데이트 했으면 분석할 시청기록 개수와 날짜  확인 */}
              {watchHistory.length > 0 && (
                <div className="w-full max-w-[700px] mb-6">
                  <div className="bg-gradient-to-r from-black via-gray-900 to-gray-800 rounded-xl p-6 shadow flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-gray-300 text-sm mb-1">선택된 영상 개수</span>
                      <span className="text-2xl font-bold text-white">{watchHistory.length}개</span>
                    </div>
                    <div className="h-10 w-px bg-gray-700 hidden sm:block" />
                    <div className="flex flex-col items-center sm:items-end">
                      <span className="text-gray-300 text-sm mb-1">선택된 날짜 범위</span>
                      <span className="text-lg font-semibold text-white">
                        {dateRange.from ? (
                          dateRange.from.toLocaleDateString("ko-KR")
                        ) : (
                          <span className="text-gray-500">시작일</span>
                        )}
                        <span className="mx-2 text-gray-400">~</span>
                        {dateRange.to ? (
                          dateRange.to.toLocaleDateString("ko-KR")
                        ) : (
                          <span className="text-gray-500">종료일</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>                 
              )}
              
              {/* 분석 시작하기 버튼, 다시 업로드 하기 버튼*/}
              {watchHistory.length > 0 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                  <p className="text-gray-500 text-sm mt-2">업로드가 완료되었습니다. 분석 날짜와 영상 개수를 확인하시고 분석을 시작하세요.</p>

                    <div className="flex gap-4">
                      {/* keyword 추출하기 버튼 */}
                      <Button
                        onClick={async () => {
                                                      const result = await processSelectedItems(watchHistory, fetchVideoInfo, (current, total) => {
                              console.log(`${current}/${total} 처리 중`);
                            }, false); // 🔄 캐시 활용 모드로 변경 (있는 것은 캐시, 없는 것만 API 호출)
                          setWatchHistory(result);
                          console.log('키워드 추출 결과:', result);
                          alert('키워드 추출 완료! 콘솔을 확인하세요.');

                          // 2단계: 클러스터 분석
                          setIsGeneratingProfile(true);
                          await handleCluster(
                              result,
                              openai,
                              OpenAILogger,
                              searchClusterImage,
                              transformClusterToImageData,
                              placeholderImage,
                              setClusters,
                              setAnalysisHistory,
                              setShowAnalysis,
                              setIsLoading,
                              setError,
                          );
                        }}
                        className="border-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-500 transition-all"
                      >
                        (1) 관리자용 버튼: keyword 추출하기
                      </Button>
                      {/* 다시 업로드하기 버튼 */}
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-600 font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-50 transition-all"
                        onClick={() => {
                          setIsFileUploaded(false); // 업로드 상태 초기화
                          setWatchHistory([]);
                        }}
                      >
                        다시 업로드하기
                      </Button>
                    </div>
              </div>
              )}

              {/* 분석된 시청 기록 목록 */}
              {watchHistory.length > 0 && (
                <>
                <div className="mt-8 w-full max-w-[897px] bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                  {/* 시청 기록 목록 헤더 */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">시청 기록</h2>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleDownloadJSON(watchHistory)}
                        variant="outline"
                        className="hover:bg-green-50 text-green-600"
                      >
                        시청기록 JSON 다운로드
                      </Button>
                      {clusters.length > 0 && (
                        <Button 
                          onClick={() => handleDownloadClusterJSON(clusters, dateRange, maxVideosPerDay)}
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
                      
                    </div>
                  </div>
                  {/* 분석 기본 정보 */}
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

                  {/* 최근 분석된 영상, 키워드 */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">분석될 영상 목록</h3>
                    <div className="max-h-[500px] overflow-y-auto border p-4 rounded">
                      {watchHistory.map((item, idx) => (
                        <div key={idx} className="mb-4">
                          {/* 영상 제목 */}
                          <div className="font-bold">{item.title}</div>
                          {/* 키워드 */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.keywords?.map((kw: any, kidx: number) => (
                              <span key={kidx} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 클러스터 분석 버튼 */}
                  <br/>
                  <Button 
                      onClick={handleClusterClick}
                      variant="outline"
                      className="mb-10 border-blue-600 bg-black text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-500 transition-all"
                      >
                      (2)관리자용 버튼: 클러스터 분석하기
                  </Button>

                  
                  {/* 클러스터 분석 결과 */}
                  {analysisHistory.length > 0 && (
                    <div className="mt-6">
                      {/* 클러스터 분석 결과 헤더 */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">클러스터 분석 결과</h3>
                      </div>
                      {/* 분석 기록 목록 탭 버튼 */}
                      {analysisHistory.length > 0 && (
                        <div className="mb-6">
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
                      {/* 클러스터 분석 결과 표시 */}
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
                                          console.log('Pinterest 이미지 검색 시작:', cluster);
                                          
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
                                          const pinterestResults = await searchClusterImage_pinterest(cluster, 1); 
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
                                    
                                    
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
                {/* tell me who I am 버튼 */  }
                <div className="flex justify-center gap-4 mt-8">
                <Button 
                    onClick={async () => {
                    if (clusters.length > 0) {
                        try {
                          // 🔍 clusters 데이터 구조 검증
                          console.log('🔍 [clusters 데이터 검증]:', {
                            'clusters 개수': clusters.length,
                            'clusters[0] 타입': typeof clusters[0],
                            'clusters[0] 구조': clusters[0],
                            'clusters[0]에 id 필드 있는지': !!clusters[0]?.id,
                            'clusters[0]에 src 필드 있는지': !!clusters[0]?.src,
                            'clusters[0]에 position 필드 있는지': !!clusters[0]?.position,
                            '원시 클러스터 데이터인지 확인': !clusters[0]?.id && !!clusters[0]?.main_keyword
                          });

                          // 🆕 원시 클러스터 데이터인 경우 ImageData로 변환
                          let profileImages;
                          if (!clusters[0]?.id && clusters[0]?.main_keyword) {
                            console.log('🔧 원시 클러스터 데이터 감지, ImageData로 변환 시작...');
                            profileImages = transformClustersToImageData(clusters, clusterImages);
                            console.log('✅ 원시 → ImageData 변환 완료:', profileImages.length);
                          } else if (clusters[0]?.id && clusters[0]?.src) {
                            console.log('✅ 이미 ImageData 형식, 그대로 사용');
                            profileImages = clusters;
                          } else {
                            console.warn('⚠️ 알 수 없는 데이터 형식, 강제 변환 시도');
                            profileImages = transformClustersToImageData(clusters, clusterImages);
                          }

                          // 🔍 변환된 데이터 검증
                          console.log('🔍 [변환된 profileImages 검증]:', {
                            'profileImages 개수': profileImages.length,
                            'profileImages[0] 구조': profileImages[0],
                            'profileImages[0]에 id 있는지': !!profileImages[0]?.id,
                            'profileImages[0]에 src 있는지': !!profileImages[0]?.src,
                            'profileImages[0]에 position 있는지': !!profileImages[0]?.position,
                            'ImageData 형식 확인': !!profileImages[0]?.id && !!profileImages[0]?.src && !!profileImages[0]?.position
                          });

                          // 🚨 ImageData 형식이 아니면 저장 중단
                          if (!profileImages[0]?.id || !profileImages[0]?.src || !profileImages[0]?.position) {
                            console.error('❌ profileImages가 올바른 ImageData 형식이 아님, 저장 중단');
                            alert('데이터 형식이 올바르지 않습니다. 클러스터 분석을 다시 진행해주세요.');
                            return;
                          }
                      
                          // 🆕 사용자별 localStorage 키 사용 (getCurrentUserId 가져와서)
                          const userId = await getCurrentUserId();
                          if (userId) {
                            localStorage.setItem(`profileImages_${userId}`, JSON.stringify(profileImages));
                            console.log(`✅ 사용자 ${userId}의 profileImages localStorage에 저장 완료`);
                          } else {
                            console.warn('⚠️ 로그인된 사용자 ID를 찾을 수 없음, 전역 키 사용');
                            localStorage.setItem('profileImages', JSON.stringify(profileImages));
                          }
                      
                          // [2] ClusterImages DB에 저장 (현재 프로필 상태)
                          if (userId) {
                            try {
                              const { updateClusterImages } = await import('@/lib/database');
                              const clusterImagesResult = await updateClusterImages(userId, profileImages);
                              console.log('✅ ClusterImages DB 저장 성공 (현재 프로필):', {
                                'profileImages 개수': profileImages.length,
                                'DB 저장 결과': clusterImagesResult,
                                'DB 저장 결과 개수': clusterImagesResult?.length
                              });
                            } catch (clusterImagesError) {
                              console.error('❌ ClusterImages DB 저장 실패:', clusterImagesError);
                              throw clusterImagesError;
                            }
                          } else {
                            console.warn('⚠️ userId가 없어서 ClusterImages DB 저장 건너뜀');
                          }

                          // [3] ClusterHistory DB에 저장 (히스토리 기록)
                          try {
                            const clusterHistoryResult = await saveClusterHistory(profileImages);
                            console.log('✅ ClusterHistory DB 저장 성공:', clusterHistoryResult);
                          } catch (clusterError) {
                            console.error('❌ ClusterHistory DB 저장 실패:', clusterError);
                            throw clusterError;
                          }
                      
                          // 🚫 SliderHistory 저장 제거 (중복 방지)
                          // handleCluster에서 이미 upload 타입으로 저장됨
                          console.log('⏭️ SliderHistory 저장 건너뜀 (handleCluster에서 이미 저장됨)');

                      alert('프로필 데이터가 성공적으로 저장되었습니다!');
                        } catch (error) {
                          console.error('프로필 데이터 저장 실패:', error);
                          alert('프로필 데이터 저장 중 오류가 발생했습니다.');
                        }
                    } else {
                      alert('분석 결과가 선택되어 있지 않습니다!');
                    }
                  }}
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all px-16 py-8 text-2xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] text-white"
                >
                  <Link href="/my_profile">
                  (3)관리자용 버튼: DB 저장 후, my profile 이동 
                  </Link>
                </Button>

                

              </div>
              </>
              )}
        </div>
      </div>

    </main>
  );
} 
