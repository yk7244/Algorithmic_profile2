"use client";

import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { transformClustersToImageData } from '../../utils/clusterTransform';      

import { OpenAILogger } from '../../utils/init-logger';
import { handleKeyword } from '../VideoAnalysis/videoKeyword';


//Refactoring
import { handleCluster} from '../VideoAnalysis/videoCluster';
import { fetchVideoInfo } from '../VideoAnalysis/videoKeyword';
import { useClusterStorage } from '../hooks/useClusterStorage';
import { useRouter } from 'next/navigation';    

import { useGenerateUserProfile } from '../../my_profile/Nickname/Hooks/useGenerateUserProfile';    
import { getParseHistory } from '@/app/utils/get/getparseHistory';
import { useAuth } from '@/context/AuthContext';


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
    { id: 1, title: "키워드 추출", description: "당신의 알고리즘은 무엇을 학습했을지 살펴보고 있어요...  " },
    { id: 2, title: "클러스터 분석", description: "흥미로운 시각을 발견했어요! " },
    { id: 3, title: "이미지 생성", description: "이제 알고리즘이 생각한 당신의 모습을 보여줄게요." },
];



export default function Home() {

const router = useRouter();
const { ensureValidSession, isLoggedIn } = useAuth();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
const [clusters, setClusters] = useState<any[]>([]);
const [showAnalysis, setShowAnalysis] = useState(false);
const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());

// clusterImages state 타입 수정
const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
const [analysisHistory, setAnalysisHistory] = useState<{
    id: string;
    date: string;
    clusters: any[];
}[]>([]);
const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
const [generatingStep, setGeneratingStep] = useState(0);
const [showCompletePage, setShowCompletePage] = useState(false);
const [countdown, setCountdown] = useState(200000000);
const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
const [profile, setProfile] = useState({ nickname: '', description: '' });
const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

// useClusterStorage 커스텀 훅 사용
useClusterStorage({
    setWatchHistory,
    setClusters,
    setClusterImages,
    clusterImages,
    clusters,
    setAnalysisHistory,
});


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

const [current, setCurrent] = useState(0);
const [total, setTotal] = useState(0);
const hasRunRef = useRef(false);

const bgColorByStep: Record<number, string> = {
    1: "bg-[#0C0C0C]",
    2: "bg-linear-gradient(180deg, #0C0C0C 0%, white 100%)",
    3: "bg-linear-gradient(180deg, #8F8F8F 0%, white 57%)",
};

 // 페이지가 처음 로드될 때 자동 분석 시작
useEffect(() => {
    const startAnalysis = async () => {
        if (hasRunRef.current) return; // 이미 실행되었으면 아무것도 안함
        hasRunRef.current = true; // 처음이면 실행 기록

        // 로그인 상태 확인
        if (!isLoggedIn) {
            console.error('로그인이 필요합니다');
            router.push('/');
            return;
        }

        // 세션 유효성 확인
        const isSessionValid = await ensureValidSession();
        if (!isSessionValid) {
            console.error('세션이 유효하지 않습니다. 다시 로그인해주세요');
            router.push('/');
            return;
        }

        setShowGeneratingDialog(true);
        setGeneratingStep(1);
        
        // 장시간 작업을 위한 주기적 세션 체크 시작 (2분마다)
        const interval = setInterval(async () => {
            const isValid = await ensureValidSession();
            if (!isValid) {
                console.error('주기적 세션 체크 실패');
                clearInterval(interval);
                setError('세션이 만료되었습니다. 다시 로그인해주세요');
                router.push('/');
            }
        }, 120000); // 2분마다 체크
        setSessionCheckInterval(interval);
        
        try {
            // 1단계: 키워드 추출
            setGeneratingStep(1);
            const parseHistory = await getParseHistory() || [];
            //console.log('🩷 parseHistory 불러오기 완료:', parseHistory );
            console.log('fetchVideoInfo:', fetchVideoInfo);

            //키워드 추출함수 -> 받아온 parseHistory 중에서 오늘 날짜만 
            const result = await handleKeyword(parseHistory, fetchVideoInfo, 
                (current, total) => {
                    console.log(`${current}/${total} 처리 중`);
                    setCurrent(current);
                    setTotal(total);
                }
            );
            setWatchHistory(result);
            console.log('키워드 추출 결과:', result);
            

            await new Promise(resolve => setTimeout(resolve, 2000)); // 클러스터 분석 시뮬레이션

            // 세션 유효성 재확인 (1단계 완료 후)
            const isStillValid = await ensureValidSession();
            if (!isStillValid) {
                console.error('분석 중 세션이 만료되었습니다');
                setError('세션이 만료되었습니다. 다시 로그인해주세요');
                router.push('/');
                return;
            }

            // 2단계: 클러스터 분석
            setGeneratingStep(2);
            await new Promise(resolve => setTimeout(resolve, 200)); // 클러스터 분석 시뮬레이션
            
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
                setError,
                generateProfile,
                //ClusterTransform에서 ClusterImages 저장함 
                //userData 저장함 
                //reflectionData 저장함 
                //nickname 저장함 
                
            );
            
            
            // 세션 유효성 재확인 (2단계 완료 후)
            const isStillValidAfterCluster = await ensureValidSession();
            if (!isStillValidAfterCluster) {
                console.error('클러스터 분석 후 세션이 만료되었습니다');
                setError('세션이 만료되었습니다. 다시 로그인해주세요');
                router.push('/');
                return;
            }

            setGeneratingStep(3);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 이미지 생성 시뮬레이션
            // 4단계: clusterHistory, sliderHistory 저장하기
            
            setGeneratingStep(3);
            await new Promise(resolve => setTimeout(resolve, 200));
            // 5단계: 완료 페이지 표시
            setShowCompletePage(true);
            setShowGeneratingDialog(false);
            setCountdown(10);
            
            
            
        } catch (error) {
            console.error('분석 중 오류:', error);
            setError('분석 중 오류가 발생했습니다.');
            setShowGeneratingDialog(false);
        } finally {
            // 세션 체크 인터벌 정리
            if (sessionCheckInterval) {
                clearInterval(sessionCheckInterval);
                setSessionCheckInterval(null);
            }
        }
    };
    startAnalysis();
    // eslint-disable-next-line
}, []);

// 컴포넌트 언마운트 시 세션 체크 인터벌 정리
useEffect(() => {
    return () => {
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
        }
    };
}, [sessionCheckInterval]);

useEffect(() => {
    if (showCompletePage && countdown > 0) {
        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (showCompletePage && countdown === 0) {
        // 카운트다운 끝나면 my_profile로 이동 (업로드 완료 파라미터 추가)
        router.push('/my_profile?upload_completed=true');
        //별명
    }
}, [showCompletePage, countdown, router]);



return (
    <main className={`flex min-h-screen items-center p-4 py-40 relative overflow-hidden scroll-none 
        ${
            showCompletePage ? '' :
            generatingStep === 1 ? 'bg-[#000000]' : 
            generatingStep === 2 ? 'bg-gradient-to-r from-[#000000] to-[#FFFFFF]' :
            'bg-gradient-to-r from-[#8F8F8F] to-[#FFFFFF]'
        }
    }`}
    >  
    
    {/* 하단 퍼지는 블러 애니메이션 배경 */}
    {showCompletePage ? (
        <div
            className={`scroll-none min-h-screen {bg-[#777E90] absolute inset-0 overflow-hidden -z-20 pointer-events-none`}
            style={{
            backgroundImage: "url('/images/upload_bg.svg')",
            backgroundSize: 'contain',
            backgroundPosition: 'top',
            border: 'none',
            overflow: 'hidden',
            backgroundRepeat: 'no-repeat',
            opacity: showBgFade ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            animation: 'fadeIn 2s ease-in-out',            
            }}>
            <div className="absolute -bottom-[30%] -left-[20%] w-[40%] h-[60%] rounded-full bg-[#98B5FF] blur-[220px] animate-blob" style={{ animationDelay: '0s' }} />
            <div className="absolute -bottom-[20%] -right-[10%] w-[30%] h-[60%] rounded-full bg-[#98B5FF] blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[10%] left-[30%] w-[40%] h-[20%] rounded-full bg-[#98B5FF]  blur-[170px] animate-blob" style={{ animationDelay: '4s' }} />      
        </div>
    ):(
    <div className="absolute inset-0 overflow-hidden z-2 pointer-events-none">
        <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[80%] rounded-full bg-[#82A5FF] blur-[120px] animate-blob" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#82A5FF] blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[20%] rounded-full bg-white blur-[70px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rotate-20 rounded-full bg-[#98B5FF]  blur-[70px] animate-blob" style={{ animationDelay: '4s' }} />
    </div>
    )}

    <div className="flex flex-col items-center space-y-8 relative z-10 w-full">
        <div className="w-full max-w-[900px] ">  
        {showCompletePage ? (
            /* 분석 완료 결과 페이지 */
            <div className="w-full max-h-screen relative text-center">
                {/* 메인 완료 메시지 - 상단 고정 */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '-100px', width: '100%' , transition: 'opacity 4s ease-in-out',}}>
                    <h1 className="text-xl font-bold text-black text-center"
                    style={{
                        animation: 'fadeIn 2s ease-in-out',
                    }}>
                        유튜브 알고리즘이  바라본 당신의 알고리즘 자화상이 완성되었습니다.  <br/>
                        {countdown}초 뒤, 나의 알고리즘 페이지로 이동할게요
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
                            className="mt-200 text-black text-2xl font-bold mx-auto text-center "
                            style={{
                                opacity: showStepText ? 1 : 0,
                                transition: 'opacity 0.4s ease-in-out',
                                animation: generatingStep === 2 ? 'pulse 1s infinite' : 'none',
                            }}>
                            {steps[displayedStep - 1]?.description}
                            
                        </p>
                        {(generatingStep === 1 || generatingStep === 2) && (
                        <p className="mt-200 text-black text-md font-bold mx-auto text-center">
                            {Math.round((current / total) * 100)}% 진행중
                            
                        </p>
                        )}
                        {generatingStep === 1 && (
                        <p className="mt-200 text-white text-sm font-medium mx-auto text-center">
                            약 10분 정도 소요됩니다. 잠시만 기다려주세요.
                        </p>
                        )}
                    </div>
                </div>
            </div>
        )}  
        </div>
    </div>
    </main>
);

}