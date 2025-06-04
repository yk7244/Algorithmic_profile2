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
import { transformClustersToImageData, transformClusterToImageData } from '../../utils/clusterTransform';    
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { OpenAILogger } from '../../utils/init-logger';
import { parseJSONWatchHistory } from '../VideoParsing/jsonParser';
import { parseWatchHistory } from '../VideoParsing/htmlParser';
import { handleFileUpload, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } from '../Handlers/fileHandlers';
import { handleDownloadJSON, handleDownloadClusterJSON } from '../Handlers/downloadHandlers';
import { my_account } from '@/app/data/dummyData';
import { isOneWeekPassed } from '../VideoParsing/dateUtils';

//Refactoring
import { searchClusterImage_pinterest, PinterestImageData } from '../ImageSearch/GoogleImageSearch';
import { searchClusterImage } from '../ImageSearch/NaverImageSearch';
import { VideoCluster, handleCluster} from '../VideoAnalysis/videoCluster';
import { fetchVideoInfo } from '../VideoAnalysis/videoKeyword';
import { useClusterStorage } from '../hooks/useClusterStorage';

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

// 컴포넌트 내부에 추가
const [uploadFinished, setUploadFinished] = useState(false);

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

return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 py-40 relative overflow-hidden ">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden -z-10 bg-gray-500">
            <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob" />
            <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob animation-delay-20" />
            <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-black blur-[120px] animate-blob animation-delay-200" />
        </div>

        {/* 분석 전 */}
        <div className="flex flex-col items-center space-y-8 text-center relative z-10 ">
            {/* 타이틀 */}
            <div className="space-y-7 max-w-8xl mx-auto px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold px-4">
                    <div className="inline-block">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r text-white opacity-40">
                        Are you curious how your algorithm sees you?
                        </span>
                    </div>
                    </h1>
                </div>
            </div>

            {/* 파일 업로드 버튼 */}
            <div className="w-full max-w-[700px] p-8">
            {(my_account.updated_at == null || isOneWeekPassed(my_account.updated_at)) ? (
                
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
                        onChange={e => handleFileUpload(e, {
                        setIsLoading,
                        setError,
                        setSuccessCount,
                        setWatchHistory,
                        dateRange,
                        maxVideosPerDay,
                        fetchVideoInfo,
                        openai,
                        OpenAILogger,
                        parseJSONWatchHistory,
                        parseWatchHistory
                        })}
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
                </div>
            ) : 
                <p> 업로드 기간이 아닙니다. </p>
            }
            </div>
        </div>

        {/* 분석결과 */}
        <div>
            {/* 기록 초기화 버튼 */}
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
            {/* 클러스터 분석 버튼 */}
            <Button 
            onClick={handleClusterClick}
            variant="outline"
            className="hover:bg-blue-50"
            >
            새로운 클러스터 분석
            </Button>

            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">기본 정보</h3>
                    <p>총 영상 수: {watchHistory.length}</p>
                    <p>총 키워드 수: {
                    new Set(watchHistory.flatMap(item => item.keywords)).size
                    }</p>
                </div>
                
            </div>

            {/* 분석된 시청 기록 목록 */}
            {watchHistory.length > 0 && (
            <div className="mt-8 w-full max-w-[897px] bg-white/40 backdrop-blur-md rounded-lg p-6 shadow-lg">
                {/* 제목 */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">분석된 시청 기록</h2>
                </div>
                {/* 분석된 영상 목록 */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">분석된 영상</h3>
                    <div className="max-h-[500px] overflow-y-auto p-4 rounded bg-white/10 backdrop-blur-md">
                        {watchHistory.map((item, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="font-bold">{item.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2 justify-center">
                            {item.keywords?.map((kw: any, kidx: number) => (
                                <span key={kidx} className="px-2 py-1 bg-gray-200 text-black rounded-full text-sm">
                                {kw}
                                </span>
                            ))}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                {/* 최다 출현 키워드 */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">최다 출현 키워드</h3>
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
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
                            <span key={keyword} className="px-2 py-1 bg-blue-100 rounded-full text-sm mb-2">
                                {keyword} ({count})
                            </span>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">총 키워드 수: {
                    new Set(watchHistory.flatMap(item => item.keywords)).size
                    }</p>
                </div>
                {/* tell me who I am 버튼 */}
                <div className="flex justify-center gap-4 mt-8">
                    <Button 
                        onClick={() => {
                        if (clusters.length > 0) {
                            // 현재 선택된 분석 결과의 클러스터로 변환
                            const profileImages = transformClustersToImageData(clusters, clusterImages);
                            localStorage.setItem('profileImages', JSON.stringify(profileImages));
                            console.log('✨ 프로필 데이터 저장 성공!');
                            alert('프로필 데이터가 성공적으로 저장되었습니다!');
                        } else {
                            alert('분석 결과가 선택되어 있지 않습니다!');
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

        
    </main>
);
}
