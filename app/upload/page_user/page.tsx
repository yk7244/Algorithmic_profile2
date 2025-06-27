"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import OpenAI from 'openai';
import { HelpCircle, Upload, ArrowRight, Youtube, CalendarIcon, Loader2, CheckCircle, XCircle } from "lucide-react";
import { transformClustersToImageData, transformClusterToImageData } from '../../utils/clusterTransform';    

import { OpenAILogger } from '../../utils/init-logger';
import { parseJSONWatchHistory, processSelectedItems } from '../VideoParsing/jsonParser';
import { parseWatchHistory } from '../VideoParsing/htmlParser';
import { handleFileUpload, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } from '../Handlers/fileHandlers';
import { isOneWeekPassed } from '../VideoParsing/dateUtils';

//Refactoring
import { searchClusterImage } from '../ImageSearch/NaverImageSearch';
import { VideoCluster, handleCluster} from '../VideoAnalysis/videoCluster';
import { fetchVideoInfo } from '../VideoAnalysis/videoKeyword';
import { useClusterStorage } from '../hooks/useClusterStorage';
import { my_account } from '../../data/dummyData';
import { useRouter } from 'next/navigation';    
import { saveClusterHistory } from '@/app/utils/saveClusterHistory';
import { saveSliderHistory } from '@/app/utils/saveSliderHistory';
import { useGenerateUserProfile } from '../../my_profile/Nickname/Hooks/useGenerateUserProfile';    
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// 기본 이미지를 데이터 URI로 정의
const placeholderImage = '/images/default_image.png'
const defaultImageUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNlNWU4IiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNhMGEwYTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgTG9hZGVkPC90ZXh0Pgo8L3N2Zz4=";

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
    { id: 1, title: "키워드 추출", description: "시청 기록에서 관심사들을 발견하고 있어요..." },
    { id: 2, title: "클러스터 분석", description: "알고리즘의 연결고리를 살펴보는 중이에요..." },
    { id: 3, title: "이미지 생성", description: "흥미로운 패턴을 발견했어요! 당신의 알고리즘들을 사진으로 표현 중이예요" },
    { id: 4, title: "분석 완료", description: "곧, 별명과 나만의 알고리즘 무드보드를 만나보실 수 있어요."}
];



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
const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
const [generatingStep, setGeneratingStep] = useState(0);
const [showCompletePage, setShowCompletePage] = useState(false);
const [countdown, setCountdown] = useState(200000000);

const [maxVideosPerDay, setMaxVideosPerDay] = useState(20);
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
const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
const [isFileUploaded, setIsFileUploaded] = useState(false);
const [profile, setProfile] = useState({ nickname: '', description: '' });

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

// useGenerateUserProfile 훅을 컴포넌트 레벨에서 호출
const { generateProfile } = useGenerateUserProfile({
    openai,
    setShowGeneratingDialog: setIsGeneratingProfile,
    setGeneratingStep,
    setProfile: setProfile,
});

useEffect(() => {
    if (showCompletePage && countdown > 0) {
        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (showCompletePage && countdown === 0) {
        // 카운트다운 끝나면 my_profile로 이동
        router.push('/my_profile');
        //별명
    }
}, [showCompletePage, countdown, router]);



return (
    <main className="flex min-h-[calc(110vh-4rem)] flex-col items-center p-4 py-40 relative overflow-hidden">
    
    {/* Animated background blobs */}
    <div className="absolute inset-0 overflow-hidden -z-10 bg-gray-500">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-black blur-[120px] animate-blob animation-delay-20" />
        <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-black blur-[120px] animate-blob animation-delay-200" />
    </div>

    {/* 흐릿한 원형 배경 */}
    <div
        style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            background: "radial-gradient(circle, #6b6b6b55 0%, #23232300 80%)",
            filter: "blur(20px)",
            zIndex: 1,
        }}
    />

        {/* 눈동자 */}
        <div
        style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: 32,
            zIndex: 2,
        }}
        >
        {/* 왼쪽 눈 */}
        <div
            ref={leftEyeRef}
            style={{
            width: 52,
            height: 68,
            background: "radial-gradient(circle, #fff 70%, #000 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 32px 8px #fff8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "blur(1.4px)",
            position: "relative",
            }}
        >
            <div
            style={{
                width: 28,
                height: 32,
                background: "#232323",
                borderRadius: "50%",
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${leftPupil.x}px, ${leftPupil.y}px)`,
                transition: "transform 0.07s linear",
            }}
            />
        </div>
        {/* 오른쪽 눈 */}
        <div
            ref={rightEyeRef}
            style={{
            width: 52,
            height: 68,
            background: "radial-gradient(circle, #fff 70%, #000 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 32px 8px #fff8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "blur(1.4px)",
            position: "relative",
            }}
        >
            <div
            style={{
                width: 28,
                height: 32,
                background: "#232323",
                borderRadius: "50%",
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${rightPupil.x}px, ${rightPupil.y}px)`,
                transition: "transform 0.07s linear",
            }}
            />
        </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          유튜브 알고리즘은 나를 어떻게 보고 있을까?
        </h1>
        <p
          style={{
            color: "#b0b0b0",
            fontSize: 18,
            marginBottom: 40,
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          <span style={{ color: "#fff", fontWeight: 600 }}></span>
          유튜브 시청기록을 올리고 결과를 확인해보세요
        </p>

        {/* 파일 업로드 버튼 */}
        
    </div>

    <div className="flex flex-col items-center space-y-8 text-center relative z-10 w-full">
        
        {/* 파일 업로드 버튼 */}
        <div className="w-full max-w-[900px] ">
        
            {(my_account.updated_at == null || isOneWeekPassed(my_account.updated_at)) ? (
            isFileUploaded ? (
            <>  
            {/* 상단 정보 카드 */}
            <div className="max-w-[700px] mx-auto mt-5">
                <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col items-center sm:items-start">
                        <span className="text-gray-300 text-sm mb-1">선택된 영상 개수</span>
                        <span className="text-3xl font-bold text-white">{watchHistory.length}개</span>
                    </div>
                    <div className="h-12 w-px bg-gray-600 hidden sm:block" />
                    <div className="flex flex-col items-center sm:items-end">
                        <span className="text-gray-300 text-sm mb-1">선택된 날짜 범위</span>
                        <span className="text-xl font-semibold text-white">
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
            {!showGeneratingDialog && !showCompletePage ? (
                <>
                {/* 분석 시작하기 버튼, 다시 업로드 하기 버튼*/}
                <div className="flex flex-col items-center gap-4 mt-20">
                    <p className="text-gray-500 text-sm mt-2">업로드가 성공적으로 완료되었습니다. <br /> 분석 날짜와 영상 개수를 확인하시고 알고리즘 분석을 시작해보세요.<br /><br /></p>
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
                                    setError,
                                );
                                
                                // 3단계: 이미지 생성 (이미 handleCluster에서 처리됨)
                                setGeneratingStep(3);
                                await new Promise(resolve => setTimeout(resolve, 2000)); // 이미지 생성 시뮬레이션
                                
                                // 4단계: 완료
                                setGeneratingStep(4);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                                // 5단계: 완료 페이지 표시
                                setShowCompletePage(true);
                                setShowGeneratingDialog(false);
                                setCountdown(10);
                                // 6단계: 별명만들기
                                await generateProfile();

                                // 7단계: clusterHistory, sliderHistory 저장하기
                                const clusterHistoryResult = saveClusterHistory(clusters);
                                const sliderResult = saveSliderHistory(clusters);

                                if (clusterHistoryResult.success && sliderResult.success) {
                                    console.log('✨ 모든 히스토리 저장 성공!', { clusterHistoryResult, sliderResult });
                                    alert('나의 알고리즘 분석이 완료되었어요! 나의 알고리즘 무드보드로 이동할게요. ');
                                } 
                            } catch (error) {
                                console.error('분석 중 오류:', error);
                                setError('분석 중 오류가 발생했습니다.');
                                setShowGeneratingDialog(false);
                            }
                            }}
                            className=" bg-white border-blue-600 text-black font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-500 hover:text-white transition-all"
                        >
                            알고리즘 분석 시작하기
                        </Button>
                        </div>
                </div>
                </>
            ) : showCompletePage ? (
                /* 분석 완료 결과 페이지 */
                <>
                <div className="w-full h-screen flex flex-col">
                    

                    {/* 중간 여백 */}
                    <div className="h-40"></div>

                    {/* 메인 완료 메시지 - 하단 */}
                    <div className="text-center">
                        <div className="space-y-4">
                            <h1 className="text-xl font-bold text-white">
                                별명과 나만의 알고리즘 무드보드가 완성되었습니다!
                            </h1>
                        </div>
                        
                        <div className="space-y-3 mt-5">
                            <p className="text-lg text-gray-300">
                                {countdown}초 뒤에 나의 알고리즘 페이지로 이동할게요.
                            </p>
                            <div className="flex justify-center space-x-4 mt-5">
                                <Button
                                    onClick={() => {
                                        setShowCompletePage(false);
                                        setShowGeneratingDialog(false);
                                        router.push('/my_profile');
                                    }}
                                    className="mt-5 bg-white text-black hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all"
                                >
                                    지금 보기
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCompletePage(false);
                                        setShowGeneratingDialog(false);
                                        setIsFileUploaded(false);
                                        setWatchHistory([]);
                                    }}
                                    className="mt-5 bg-transparent border-white text-white hover:bg-white hover:text-black font-semibold px-6 py-3 rounded-lg transition-all"
                                >
                                    다시 시작
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 배경 블러된 이미지들 (장식용) */}
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute top-1/4 left-1/3 w-32 h-24 bg-gray-600 rounded-lg blur-sm" />
                        <div className="absolute top-1/3 right-1/3 w-28 h-20 bg-gray-700 rounded-lg blur-sm" />
                        <div className="absolute bottom-1/3 left-1/4 w-36 h-28 bg-gray-500 rounded-lg blur-sm" />
                        <div className="absolute bottom-1/4 right-1/4 w-30 h-22 bg-gray-600 rounded-lg blur-sm" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-18 bg-gray-700 rounded-lg blur-sm" />
                        <div className="absolute top-2/5 left-2/5 w-28 h-20 bg-gray-600 rounded-lg blur-sm" />
                        <div className="absolute bottom-2/5 right-2/5 w-32 h-24 bg-gray-500 rounded-lg blur-sm" />
                    </div>
                </div>
                </>
            ) : showGeneratingDialog ? (
                <>
                {/* 분석 진행 중 페이지 */}
                <div className="w-full max-w-[500px] mx-auto">
                    <div className=" backdrop-white-sm rounded-2xl p-8 text-center space-y-6">
                        {/* Current Step */}
                        <div className="space-y-4 mt-40">
                                <div className="flex items-center justify-center space-x-2">
                                    {generatingStep < 4 ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                    ) : (
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    )}
                                    
                                </div>
                                <p className="text-gray-300 text-xl">
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
                                                ? 'bg-white text-black'
                                                : 'bg-gray-800 text-gray-600 opacity-80'
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
                                            index + 1 < generatingStep ? 'text-white-500' : 'text-white opacity-50'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </>
            ) : null}
            </>
            ) : (
            <>
                {/* 타이틀 */}
                <div className="space-y-7 max-w-8xl mx-auto px-4 mb-10">
                    <div className="text-center space-y-4">
                        <h1 className="text-xl  font-bold px-4 ">
                        <div className="inline-block">
                            <span className="bg-clip-text text-transparent text-white opacity-80">
                                시청기록 속 흐름에서, 나를 비추는 알고리즘을 살펴보세요.
                            </span>
                        </div>
                        </h1>
                    </div>
                </div>
                {/* 업데이트 가능하면 파일 업로드 버튼 */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                        className={`max-w-[700px] mx-auto cursor-pointer backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 ${
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
                        {isLoading ? '시청기록 업로드 중입니다...' : (
                            isDragging 
                            ? '여기에 파일을 놓아주세요'
                            : 'Google Takeout에서 받은\nYoutube 시청기록 파일을 업로드해주세요.'
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
                            '클릭하거나 파일을 끌어다 놓으면 업로드돼요.'
                        )}
                        </p>
            </div>
                    </div>
                        
                </div>
                {/* 날짜, 영상 개수 설정-삭제*/}
                {/* 호버시 설명 란*/}
                <div className="mt-4 flex justify-center">
                    <Dialog>
                    <DialogTrigger asChild>
                    <button className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                        <HelpCircle className="w-4 h-4" />
                        어떻게 시청기록을 다운로드 받나요?
                    </button>
                    </DialogTrigger>

                    <DialogContent className="w-[80vw] justify-center max-w-4xl p-6 rounded-xl shadow-lg" >
                    <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 pb-2 border-b">
                        <Youtube className="w-5 h-5 text-blue-500" />
                        Google Takeout에서 Youtube 시청기록 내보내기
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                            <div className="font-medium text-gray-700 mb-2">1. Google Takeout 접속</div>
                            <a 
                                href="https://takeout.google.com/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-blue-500 hover:underline"
                            >
                                takeout.google.com
                            </a>
                            <p className="text-sm text-gray-500">'모두 선택해제' 버튼 클릭</p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="mt-4 flex-grow rounded-lg overflow-hidden relative aspect-video bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image src="/images/takeout1.png" alt="Takeout Step 1" layout="fill" objectFit="contain" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
                                    <DialogClose asChild>
                                        <Image src="/images/takeout1.png" alt="Takeout Step 1" width={1920} height={1080} className="w-full h-auto rounded-lg cursor-pointer"/>
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                            <div className="font-medium text-gray-700 mb-2">2.'포함할 데이터 선택'에서
                            YouTube 선택</div>
                            <p className="text-sm text-gray-500">제일 하단에 위치한 YouTube 및 YouTube Music 선택</p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="mt-4 flex-grow rounded-lg overflow-hidden relative aspect-video bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image src="/images/takeout2.png" alt="Takeout Step 2" layout="fill" objectFit="contain" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
                                <DialogClose asChild>
                                        <Image src="/images/takeout2.png" alt="Takeout Step 2" width={1920} height={1080} className="w-full h-auto rounded-lg cursor-pointer"/>
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                            <div className="font-medium text-gray-700 mb-2">3. 버튼 '모든 Youtube 데이터 포함됨'에서 시청기록 선택</div>
                            <p className="text-sm text-gray-500">모든 선택해제 후, 시청기록만 선택</p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="mt-4 flex-grow rounded-lg overflow-hidden relative aspect-video bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image src="/images/takeout3.png" alt="Takeout Step 3" layout="fill" objectFit="contain" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
                                    <DialogClose asChild>
                                        <Image src="/images/takeout3.png" alt="Takeout Step 3" width={1920} height={1080} className="w-full h-auto rounded-lg cursor-pointer"/>
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                            <div className="font-medium text-gray-700 mb-2">4. 버튼 '여러형식'에서 하단 '기록'에 JSON 형식 선택</div>
                            <p className="text-sm text-gray-500">JSON 형식 선택 후 내보내기</p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="mt-4 flex-grow rounded-lg overflow-hidden relative aspect-video bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image src="/images/takeout4.png" alt="Takeout Step 4" layout="fill" objectFit="contain" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
                                    <DialogClose asChild>
                                        <Image src="/images/takeout4.png" alt="Takeout Step 4" width={1920} height={1080} className="w-full h-auto rounded-lg cursor-pointer"/>
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    </div>
                    </DialogContent>
                    </Dialog>
                </div>
            </>
            )
        ) : (
            <>
            
                <div className="text-center text-gray-500 text-sm"> 
                아직은 알고리즘의 변화가 드러나기엔 이른 시점이에요.
                    시간이 조금 더 지나면, 알고리즘의 변화를 살펴볼 수 있어요.
                </div>
            </>
            
        )}
        </div>
    </div>
    </main>
);

}