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
    // 페이지가 처음 로드될 때 자동 분석 시작
    const startAnalysis = async () => {
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
    };
    startAnalysis();
    // eslint-disable-next-line
}, []);

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

    <div className="flex flex-col items-center space-y-8 text-center relative z-10 w-full">
        
        {/* 파일 업로드 버튼 */}
        <div className="w-full max-w-[900px] ">
        
        {showCompletePage ? (
            /* 분석 완료 결과 페이지 */
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
        ) : (
            /* 분석 진행 중 페이지 */
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
        )}  
        </div>
    </div>
    </main>
);

}