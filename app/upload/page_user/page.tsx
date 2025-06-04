"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import OpenAI from 'openai';
import { HelpCircle, Upload, ArrowRight, Youtube, CalendarIcon, Loader2, CheckCircle } from "lucide-react";
import {
HoverCard,
HoverCardContent,
HoverCardTrigger,
} from "@/components/ui/hover-card";
import { transformClustersToImageData, transformClusterToImageData } from '../../utils/clusterTransform';
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { OpenAILogger } from '../../utils/init-logger';
import { parseJSONWatchHistory, processSelectedItems } from '../VideoParsing/jsonParser';
import { parseWatchHistory } from '../VideoParsing/htmlParser';
import { handleFileUpload, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } from '../Handlers/fileHandlers';
import { handleDownloadJSON, handleDownloadClusterJSON } from '../Handlers/downloadHandlers';
import { isOneWeekPassed } from '../VideoParsing/dateUtils';

//Refactoring
import { searchClusterImage_pinterest, PinterestImageData } from '../ImageSearch/GoogleImageSearch';
import { searchClusterImage } from '../ImageSearch/NaverImageSearch';
import { VideoCluster, handleCluster} from '../VideoAnalysis/videoCluster';
import { fetchVideoInfo } from '../VideoAnalysis/videoKeyword';
import { useClusterStorage } from '../hooks/useClusterStorage';
import { my_account } from '../../data/dummyData';

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

const steps = [
  { id: 1, title: "키워드 추출", description: "영상에서 키워드를 추출하고 있습니다..." },
  { id: 2, title: "클러스터 분석", description: "관련된 영상들을 그룹화하고 있습니다..." },
  { id: 3, title: "이미지 생성", description: "클러스터 대표 이미지를 생성하고 있습니다..." },
  { id: 4, title: "분석 완료", description: "영상 분석이 완료되었습니다!" }
];

// 간단한 Progress 컴포넌트
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full bg-blue-500 transition-all duration-300 ease-out"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function Home() {
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
const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
const [generatingStep, setGeneratingStep] = useState(0);

const [maxVideosPerDay, setMaxVideosPerDay] = useState(5);
const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
}>({
    from: new Date('Tue Apr 14 2025 14:00:00 GMT+0900'),
    to: new Date('Tue Apr 16 2025 14:00:00 GMT+0900'),
    ////✅나중에 이걸로 바꾸기
    //from: new Date(new Date().setDate(new Date().getDate() - 7)),
    //to: new Date()
});

const [uploadFinished, setUploadFinished] = useState(false);
const [isFileUploaded, setIsFileUploaded] = useState(false);


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
    setError
    );
};

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
    <main className="flex min-h-[calc(110vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden">
    
    {/* Animated background blobs */}
    <div className="absolute inset-0 overflow-hidden -z-10 bg-gray-500">
            <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob" />
            <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob animation-delay-20" />
            <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-black blur-[120px] animate-blob animation-delay-200" />
        </div>
    
    <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
        {/* 타이틀 */}
        <div className="space-y-7 max-w-8xl mx-auto px-4">
            <div className="text-center space-y-4">
                <h1 className="text-4xl  font-bold px-4 ">
                <div className="inline-block">
                    <span className="bg-clip-text text-transparent text-white opacity-80">
                    Are you curious how your algorithm sees you?
                    </span>
                </div>
                </h1>
            </div>
        </div>
        {/* 파일 업로드 버튼 */}
        <div className="w-full max-w-[700px] p-8">
        
        {(my_account.updated_at == null || isOneWeekPassed(my_account.updated_at)) ? (
            isFileUploaded ? (
            <>  
            {!showGeneratingDialog ? (
                <>
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
                <div className="flex flex-col items-center gap-4 mt-8">
                    <p className="text-gray-500 text-sm mt-2">업로드가 완료되었습니다. 분석 날짜와 영상 개수를 확인하시고 분석을 시작하세요.</p>

                        <div className="flex gap-4">
                        {/* 다시 업로드하기 버튼 */}
                        <Button
                            variant="outline"
                            className="bg-transparent border-white-600 text-white font-bold px-6 py-3 rounded-lg shadow hover:text-white transition-all"
                            onClick={() => {
                            setIsFileUploaded(false); // 업로드 상태 초기화
                            setWatchHistory([]);
                            }}
                        >
                            다시 업로드하기
                        </Button>
                        {/* tell me who I am 버튼-> 분석시작 */}
                        <Button
                            onClick={async () => {
                            // Dialog 시작
                            setShowGeneratingDialog(true);
                            setGeneratingStep(1);
                            
                            try {
                                // 1단계: 키워드 추출
                                setGeneratingStep(1);
                                const result = await processSelectedItems(watchHistory, fetchVideoInfo, (current, total) => {
                                    console.log(`${current}/${total} 처리 중`);
                                });
                                setWatchHistory(result);
                                console.log('키워드 추출 결과:', result);
                                
                                // 2단계: 클러스터 분석
                                setGeneratingStep(2);
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
                                    setError
                                );
                                
                                // 3단계: 이미지 생성 (이미 handleCluster에서 처리됨)
                                setGeneratingStep(3);
                                await new Promise(resolve => setTimeout(resolve, 2000)); // 이미지 생성 시뮬레이션
                                
                                // 4단계: 완료
                                setGeneratingStep(4);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                            } catch (error) {
                                console.error('분석 중 오류:', error);
                                setError('분석 중 오류가 발생했습니다.');
                                setShowGeneratingDialog(false);
                            }
                            }}
                            className="bg-white border-blue-600 text-black font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-500 hover:text-white transition-all"
                        >
                            Tell me who I am
                        </Button>
                        </div>
                </div>
                </>
            ) : (
                /* 분석 진행 중 페이지 */
                <div className="w-full max-w-[500px] mx-auto">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                        <div className="text-center space-y-6">
                            {/* 제목 */}
                            <h2 className="text-2xl font-bold text-gray-800">
                                영상 분석 진행 중
                            </h2>
                            
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>진행률</span>
                                    <span>{Math.round((generatingStep / 4) * 100)}%</span>
                                </div>
                                <Progress value={(generatingStep / 4) * 100} className="w-full h-3" />
                            </div>

                            {/* Current Step */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-center space-x-2">
                                    {generatingStep < 4 ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    ) : (
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    )}
                                    <span className="text-lg font-semibold text-gray-800">
                                        {steps[generatingStep - 1]?.title || '진행 중...'}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {steps[generatingStep - 1]?.description}
                                </p>
                            </div>

                            {/* Steps Indicator */}
                            <div className="flex justify-center space-x-2">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                                                index + 1 <= generatingStep
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {index + 1 < generatingStep ? (
                                                <CheckCircle className="h-4 w-4" />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                        {index < steps.length - 1 && (
                                            <ArrowRight className={`h-4 w-4 mx-2 ${
                                                index + 1 < generatingStep ? 'text-blue-500' : 'text-gray-300'
                                            }`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Animation Elements */}
                            <div className="flex justify-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>

                            {/* Complete Button */}
                            {generatingStep >= 4 && (
                                <div className="text-center">
                                    <Button 
                                        onClick={() => {
                                            setShowGeneratingDialog(false);
                                            // 결과 페이지로 이동하는 로직 추가 가능
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                                    >
                                        결과 보기
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </>
            ) : (
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
                    fetchVideoInfo,
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
                        dateRange, // 영상 분석 기간 고정값 (현재 날짜로 부터 최근 일주일)
                        maxVideosPerDay, // 하루 당 분석될 영상 개수 고정값 20으로 설정
                        fetchVideoInfo,
                        openai,
                        OpenAILogger,
                        parseJSONWatchHistory,
                        parseWatchHistory
                    });
                    // 파일 업로드 성공 시 true로 변경
                    setIsFileUploaded(true); 

                    // 영상 분석 기간 고정값 (현재 날짜로 부터 최근 일주일)
                    //setDateRange({
                        //✅나중에 이걸로 바꾸기
                        //from: new Date(new Date().setDate(new Date().getDate() - 7)),
                        //to: new Date()
                        //from: new Date('Tue Apr 15 2025 14:00:00 GMT+0900 '),
                        //to: new Date('Tue Apr 15 2025 14:00:00 GMT+0900')
                    //});
                    
                     // 하루 당 분석될 영상 개수 고정값 20으로 설정
                    //setMaxVideosPerDay(10);
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
                {/* 날짜, 영상 개수 설정-삭제*/}
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
            )
        ) : 
            <div className="text-center text-gray-500 text-sm"> 
            업로드 기간이 아닙니다. 
            </div>
        }
        </div>
    </div>
    </main>
);
} 
