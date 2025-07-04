"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import OpenAI from 'openai';
import { ArrowRight,Loader2, CheckCircle } from "lucide-react";
import { transform, transformClustersToImageData } from '../../utils/clusterTransform';      

import { OpenAILogger } from '../../utils/init-logger';
import { processSelectedItems } from '../VideoParsing/jsonParser';


//Refactoring
import { searchClusterImage } from '../ImageSearch/NaverImageSearch';
import { handleCluster} from '../VideoAnalysis/videoCluster';
import { fetchVideoInfo } from '../VideoAnalysis/videoKeyword';
import { useClusterStorage } from '../hooks/useClusterStorage';
import { useRouter } from 'next/navigation';    
import { saveClusterHistory } from '@/app/utils/saveClusterHistory';
import { saveSliderHistory } from '@/app/utils/saveSliderHistory';
import { useGenerateUserProfile } from '../../my_profile/Nickname/Hooks/useGenerateUserProfile';    


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
    { id: 1, title: "키워드 추출", description: "당신의 알고리즘은 무엇을 학습했을지 살펴보고 있어요... " },
    { id: 2, title: "클러스터 분석", description: "흥미로운 시각을 발견했어요!" },
    { id: 3, title: "이미지 생성", description: "이제 알고리즘이 생각한 당신의 모습을 보여줄게요." },
];



export default function Home() {

const router = useRouter();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
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

// 단계별 설명 텍스트 fade-in/out 상태
const [displayedStep, setDisplayedStep] = useState(generatingStep);
const [showStepText, setShowStepText] = useState(true);
useEffect(() => {
    setShowStepText(false); // 먼저 사라지게
    const timeout1 = setTimeout(() => {
        setDisplayedStep(generatingStep); // 텍스트 교체
        setShowStepText(true); // 다시 나타나게
    }, 400); // 0.4초 후 텍스트 교체
    return () => clearTimeout(timeout1);
}, [generatingStep]);

// 배경 페이드 상태
const [showBgFade, setShowBgFade] = useState(false);
useEffect(() => {
    setShowBgFade(false);
    const timeout = setTimeout(() => {
        setShowBgFade(true);
    }, 400);
    return () => clearTimeout(timeout);
}, [showCompletePage]);

 // 페이지가 처음 로드될 때 자동 분석 시작
useEffect(() => {
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
            
            await new Promise(resolve => setTimeout(resolve, 2200)); // 클러스터 분석 시뮬레이션

            // 2단계: 클러스터 분석
            setGeneratingStep(2);
            await new Promise(resolve => setTimeout(resolve, 2200)); // 클러스터 분석 시뮬레이션
            await handleCluster(
                result,
                openai,
                OpenAILogger,
                transformClustersToImageData,
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
            setGeneratingStep(3);
            await new Promise(resolve => setTimeout(resolve, 200));
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
    <main className="flex min-h-screen items-center p-4 py-40 relative overflow-hidden scroll-none">
    
    {/* 하단 퍼지는 블러 애니메이션 배경 */}
    {showCompletePage ? (
        <div
          className={`scroll-none min-h-screen bg-[#0C0C0C] absolute inset-0 overflow-hidden -z-20 pointer-events-none`}
          style={{
            backgroundImage: "url('/images/upload_bg2.svg')",
            backgroundSize: 'contain',
            backgroundPosition: 'top',
            border: 'none',
            overflow: 'hidden',
            backgroundRepeat: 'no-repeat',
            opacity: showBgFade ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            animation: 'fadeIn 2s ease-in-out',            
          }}>
            <div className="relative -bottom-[30%] -left-[-20%] w-[40%] h-[60%] rounded-full bg-[#6776AF] blur-[220px] animate-blob" style={{ animationDelay: '1s' }} />
            <div className="relative -bottom-[-20%] -right-[60%] w-[20%] h-[20%] rounded-full bg-white blur-[220px] animate-blob" style={{ animationDelay: '1s' }} />
        </div>
    ):(
    <div className="bg-[#0C0C0C] absolute inset-0 overflow-hidden -z-20 pointer-events-none">
        <div className="absolute -bottom-[30%] -left-[20%] w-[40%] h-[60%] rounded-full bg-[#6165C9] blur-[220px] animate-blob" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[30%] h-[60%] rounded-full bg-[#6776AF] blur-[220px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[30%] w-[40%] h-[20%] rounded-full bg-white blur-[170px] animate-blob" style={{ animationDelay: '4s' }} />
    </div>
    )}
    <div className="flex flex-col items-center space-y-8 relative z-10 w-full">
        <div className="w-full max-w-[900px] ">  
        {showCompletePage ? (
            /* 분석 완료 결과 페이지 */
            <div className="w-full max-h-screen relative text-center">
                {/* 메인 완료 메시지 - 상단 고정 */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '-100px', width: '100%' , transition: 'opacity 4s ease-in-out',}}>
                    <h1 className="text-xl font-bold text-white text-center"
                    style={{
                        animation: 'fadeIn 2s ease-in-out',
                    }}>
                        알고리즘이 본 당신의 프로필 무드보드가 완성되었습니다. <br/>
                        {countdown}초 뒤 나의 알고리즘 프로필로 이동할게요.
                    </h1>
                </div>
            </div>
        ) : (
            /* 분석 진행 중 페이지 */
            <div className="w-full max-w-[800px] mx-auto">
                <div className=" backdrop-white-sm rounded-2xl p-8 text-center space-y-6">
                    {/* Steps Indicator - 한 줄로 이어지는 라인, 각 단계별로만 글로우, 선도 밝게 */}
                    <div className="flex items-center justify-center w-full max-w-xl mx-auto my-12 relative z-10">
                        {/* Step 1 */}
                        <div className="relative flex items-center">
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-colors duration-300 
                                    ${generatingStep === 1 ? 'bg-white text-black border-white' : 'bg-[#2A2A2A] text-white border-[#2A2A2A] opacity-90'}`}
                                style={generatingStep === 1 ? { boxShadow: '0 0 60px #fff, 0 0 0 0 #fff', animation: 'glow-pulse 0.7s infinite alternate' } : {}}
                            >1</div>
                            
                            <div
                                className={
                                    'h-1 w-40 ml-0 ' +
                                    (generatingStep === 1 ? 'bg-gradient-to-r from-white to-[#2A2A2A]'
                                    : generatingStep ===2 ? 'bg-gradient-to-r from-[#2A2A2A] to-white'
                                    : 'bg-gradient-to-r from-[#2A2A2A]   to-[#2A2A2A]')
                                }
                            />
                        </div>
                        {/* Step 2 */}
                        <div className="flex items-center">
                            <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-colors duration-300 
                                ${generatingStep === 2 ? 'bg-white text-black border-white' : 'bg-[#2A2A2A] text-white border-[#2A2A2A] opacity-90'}`}
                            style={generatingStep === 2 ? { boxShadow: '0 0 60px #fff, 0 0 0 0 #fff', animation: 'glow-pulse 0.7s infinite alternate' } : {}}
                            >2</div>

                            <div
                            className={
                                'h-1 w-40 ml-0 ' +
                                (generatingStep === 1 ? 'bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A]'
                                : generatingStep ===2 ? 'bg-gradient-to-r from-white to-[#2A2A2A]'
                                : 'bg-gradient-to-r bg-gradient-to-r from-[#2A2A2A] to-white')
                            }
                            />
                        </div>
                        {/* Step 3 */}
                        <div className="flex items-center">
                            <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-colors duration-300 
                                ${generatingStep === 3 ? 'bg-white text-black border-white' : 'bg-[#2A2A2A] text-white border-[#2A2A2A] opacity-90'}`}
                            style={generatingStep === 3 ? { boxShadow: '0 0 60px #fff, 0 0 0 0 #fff', animation: 'glow-pulse 0.7s infinite alternate' } : {}}
                            >3</div>
                        </div>
                    </div>

                    {/* Current Step -현재 단계 설명  */}
                    <div className="space-y-4" style={{marginTop: '300px'}}>
                        
                        <p
                            className="mt-200 text-gray-300 text-2xl font-bold mx-auto text-center"
                            style={{
                                opacity: showStepText ? 1 : 0,
                                transition: 'opacity 0.4s ease-in-out',
                            }}>
                            {steps[displayedStep - 1]?.description}
                            
                        </p>
                    </div>
                </div>
            </div>
        )}  
        </div>
    </div>
    </main>
);

}