"use client";

import { useState, useRef, useEffect, useMemo } from 'react';  
import OpenAI from 'openai';
import { HelpCircle, Upload, Check } from "lucide-react";

// import { OpenAILogger } from './utils/init-logger'; // 클라이언트에서 동적 로드
import { parseJSONWatchHistory } from './upload/VideoParsing/jsonParser';
import { parseWatchHistory } from './upload/VideoParsing/htmlParser';
import { handleFileUpload, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } from './upload/Handlers/fileHandlers';
import { isOneWeekPassed } from './utils/uploadCheck';

//Refactoring
import { searchClusterImage } from './upload/ImageSearch/NaverImageSearch';
import { fetchVideoInfo } from './upload/VideoAnalysis/videoKeyword';
import { useClusterStorage } from './upload/hooks/useClusterStorage';
// import { my_account } from './data/dummyData'; // 더미 데이터 비활성화
import { useRouter } from 'next/navigation';    
import { useGenerateUserProfile } from './my_profile/Nickname/Hooks/useGenerateUserProfile';    
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useLoginHandlers } from "./login/hooks/useLoginHandlers";
import { saveParseHistory } from './utils/save/saveParseHistory';
import OverlayQuestion from "./reflection/reflection2/overlay/OverlayQuestion2";
import { getReflectionData } from './utils/get/getReflectionData';
import { createUserData } from './utils/save/saveUserData';
import { saveClusterHistory } from './utils/save/saveClusterHistory';
import { saveProfileData } from './utils/save/saveProfileData';
import OverlayQuestion2 from './reflection/reflection2/overlay/OverlayQuestion2';

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

// clusterImages state 타입 수정
const [clusterImages, setClusterImages] = useState<Record<number, ClusterImage | null>>({});
const [successCount, setSuccessCount] = useState(0);
const [reflectionData, setReflectionData] = useState<any>(null);
const [isReflection1, setIsReflection1] = useState(false);
const [isReflection2, setIsReflection2] = useState(false);
const [analysisHistory, setAnalysisHistory] = useState<{
    id: string;
    date: string;
    clusters: any[];
}[]>([]);
const [generatingStep, setGeneratingStep] = useState(0);
const [showCompletePage, setShowCompletePage] = useState(false);
const [countdown, setCountdown] = useState(200000000);

//upload 가능여부 체크 및 기간 설정, 하루당 최대 영상 개수 설정
const upload_check_test = 2;
const [upload_check, setUploadCheck] = useState<number>(-1); // 기본값: 초기 유저
const [maxVideosPerDay, setMaxVideosPerDay] = useState(20);

// 비동기 upload_check 로드
useEffect(() => {
  const loadUploadCheck = async () => {
    try {
      const checkResult = await isOneWeekPassed();
      setUploadCheck(checkResult);
      console.log('🔍 Upload Check 결과:', checkResult);
      console.log('📅 Upload Check 의미:', 
        checkResult === -1 ? '초기 유저 (4주치)' :
        checkResult === -2 ? '두번째+ 업데이트 (1주치)' :
        `${checkResult}일 지남`
      );
    } catch (error) {
      console.error('❌ Upload Check 오류:', error);
      setUploadCheck(-1); // 오류 시 초기 유저로 처리
    }
  };

  loadUploadCheck();
}, []);
const [showOverlayQuestion, setShowOverlayQuestion] = useState(false);

const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
  from: undefined,
  to: undefined,
});

// 리플렉션 데이터 로드
useEffect(() => {
  const loadReflectionData = async () => {
    try {
      const data = await getReflectionData();
      setReflectionData(data);
      
      // ✅ 올바른 reflection 로직 (업로드 기록이 있을 때만)
      // 처음 사용자(upload_check === -1)는 reflection 불필요
      if (upload_check === -1) {
        console.log('🔵 초기 사용자: reflection 불필요');
        setIsReflection1(false);
        setIsReflection2(false);
      } else {
        // 업로드 기록이 있는 사용자만 reflection 체크
        // reflection1: 첫 업로드 완료 후 아직 reflection1을 하지 않았을 때만 true
        setIsReflection1(data?.reflection1 !== true);
        
        // reflection2: reflection1은 완료했지만 reflection2는 아직 하지 않았을 때만 true  
        setIsReflection2(data?.reflection1 === true && data?.reflection2 !== true);
      }
      
      console.log('✅ Home 페이지: 리플렉션 데이터 로드 완료');
      console.log('🔍 Reflection 데이터:', { 
        upload_check,
        reflection1: data?.reflection1, 
        reflection2: data?.reflection2
      });
      
      // 실제 상태값은 이후에 로그
      setTimeout(() => {
        console.log('🎯 실제 Reflection 상태:', { 
          isReflection1, 
          isReflection2,
          upload_check
        });
      }, 100);
    } catch (error) {
      console.error('❌ Home 페이지: 리플렉션 데이터 로드 오류:', error);
      setReflectionData(null);
      setIsReflection1(false);
      setIsReflection2(false);
    }
  };

  loadReflectionData();
}, [upload_check]); // upload_check가 로드된 후 실행

useEffect(() => {
  const today = new Date();
  if (upload_check === -1) {
    // 초기 사용자: 4주치 (28일) 데이터 범위
    console.log('📅 초기 사용자: 4주치(28일) 날짜 범위 설정');
    setDateRange({
      from: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000), // 28일 전
      to: today,
    });
  } else if (upload_check === -2) {
    // 두번째+ 업데이트 사용자: 1주치 (7일) 데이터 범위
    console.log('📅 두번째+ 업데이트 사용자: 1주치(7일) 날짜 범위 설정');
    setDateRange({
      from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      to: today,
    });
  } else {
    // 일주일이 안 지난 사용자: 업데이트 불가, 기본 범위
    console.log('📅 업데이트 대기 중인 사용자: 기본 범위 설정');
    setShowOverlayQuestion(false);
    setDateRange({
      from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      to: today,
    });
  }
}, [upload_check]);



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

  const { isLoggedIn } = useAuth();
  const { handleGoogleLogin, handleAppleLogin, handleGithubLogin } = useLoginHandlers();


  // 눈동자 커서 추적용 상태 및 ref
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const [leftPupil, setLeftPupil] = useState({ x: 0, y: 0 });
  const [rightPupil, setRightPupil] = useState({ x: 0, y: 0 });

  const guideRef = useRef<HTMLDivElement>(null); // 안내 영역 ref 추가
  
  const [scrollToGuide, setScrollToGuide] = useState(false); // 버튼 클릭용 상태

  // 버튼 1초 후 노출용 상태
  const [showButton, setShowButton] = useState(false);

  const [pendingUploadAction, setPendingUploadAction] = useState<null | (() => void)>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const movePupil = (
        eyeRef: React.RefObject<HTMLDivElement>,
        setPupil: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
      ) => {
        if (!eyeRef.current) return;
        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const dx = e.clientX - eyeCenter.x;
        const dy = e.clientY - eyeCenter.y;
        // 타원 반경 (눈동자 크기 - 동공 크기 - 여유)
        const rx = rect.width / 2 - 14; // x축 최대 이동 (눈동자 52, 동공 28)
        const ry = rect.height / 2 - 16; // y축 최대 이동 (눈동자 68, 동공 32)
        // 각도
        const angle = Math.atan2(dy, dx);
        // 타원 경계 내 최대 이동
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        // 실제 마우스와의 거리
        const dist = Math.hypot(dx, dy);
        // 동공이 타원 경계 안에서만 움직이도록 제한
        if (dist < Math.min(rx, ry)) {
          setPupil({ x: dx, y: dy });
    } else {
          setPupil({ x, y });
        }
      };
      movePupil(leftEyeRef, setLeftPupil);
      movePupil(rightEyeRef, setRightPupil);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 업로드 후 1.7초 후 안내로 스크롤
  useEffect(() => {
    if (isFileUploaded) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFileUploaded]);

  // 분석 시작 버튼 클릭 시 스크롤 트리거
  useEffect(() => {
    if (scrollToGuide && guideRef.current) {
      const timer = setTimeout(() => {
        guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setScrollToGuide(false);
      }, 1700);
      return () => clearTimeout(timer);
    }
  }, [scrollToGuide]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (guideRef.current) {
        window.scrollTo({
          top: guideRef.current.getBoundingClientRect().top + window.scrollY - 40,
          behavior: 'smooth'
        });
      }
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  // 분석 시작 버튼 3초 후 보이게
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #232323 0%, #0C0C0C 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden z-2 pointer-events-none">
          <div className="absolute -bottom-[30%] -left-[20%] w-[40%] h-[60%] rounded-full bg-[#98B5FF] blur-[220px] animate-blob" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-[20%] -right-[10%] w-[30%] h-[60%] rounded-full bg-[#98B5FF] blur-[220px] animate-blob" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[10%] left-[30%] w-[40%] h-[20%] rounded-full bg-[#98B5FF]  blur-[170px] animate-blob" style={{ animationDelay: '4s' }} />
        </div>
        {/*
        <div className="absolute -bottom-[30%] -left-[20%] w-[40%] h-[60%] rounded-full bg-[#98B5FF] blur-[120px] animate-wave-horizontal" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[30%] h-[60%] rounded-full bg-[#6776AF] blur-[120px] animate-wave-horizontal-delay-2" />
        <div className="absolute bottom-[10%] left-[30%] w-[40%] h-[20%] rounded-full bg-[#6791FF] blur-[170px] animate-wave-horizontal-delay-4" />
        
        <div className="absolute bottom-[10%] left-[10%] w-[25%] h-[30%] rounded-full bg-[#B5C7FF] blur-[100px] animate-wave-horizontal-delay-2" />
        <div className="absolute top-[30%] right-[5%] w-[20%] h-[40%] rounded-full bg-[#A0B6E2] blur-[140px] animate-wave-horizontal-delay-4" />
        <div className="absolute bottom-[25%] right-[30%] w-[30%] h-[15%] rounded-full bg-[#C7D8FF] blur-[90px] animate-wave-horizontal" />
        <div className="absolute -bottom-[20%] right-[10%] w-[30%] h-[60%] rounded-[43%] bg-[#6776AF] blur-[120px] animate-drift-4" />
        <div className="absolute -bottom-[20%] left-[20%] w-[30%] h-[60%] rounded-[43%] bg-[#6776AF] blur-[120px] animate-drift-4" />
        <div className="absolute -bottom-[20%] right-[10%] w-[30%] h-[60%] rounded-[43%] bg-[#6776AF] blur-[120px] animate-drift-4" />
         vw 단위 wave 3개 
         
        
        <div className="absolute bottom-500 w-[120vw] h-[120vw] ml-[-10vw] z-1 animate-drift-10" style={{ borderRadius: '40%', background: '#0af', opacity: 0.5 }} />
        <div className="absolute bottom-500 w-[120vw] h-[120vw] ml-[-10vw] z-1 animate-drift-13" style={{ borderRadius: '40%', background: '#fde047', opacity: 0.2 }} />
        <div className="absolute bottom-500 w-[120vw] h-[120vw] ml-[-10vw] z-1 animate-drift-11" style={{ borderRadius: '40%', background: '#f472b6', opacity: 0.2 }} />
      */}
        </div>


    {/* 눈동자 커서 추적용 상태 및 ref */}
    <>
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
          position: "relative",
          marginTop: "80px",
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
    </>

    {/* 타이틀 */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: 120,
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
          <span style={{ color: "#fff", fontWeight: 600, }}></span>
          유튜브 시청기록을 올리고 결과를 확인해보세요
        </p>
      
      {/* 파일 업로드 버튼 */}
      
    </div>

    {/* 로그인 or 파일 업로드 섹션 */}
    <div className="flex flex-col items-center space-y-8 text-center relative z-10 w-full">
      <div className="w-full max-w-[900px] ">

        {/* 로그인 여부 확인*/}
        {isLoggedIn ? (
          <>
            {/* 1-1 로그인O => 업데이트 여부 확인 */}  
            {(upload_check === -1 || upload_check === -2) ? (
              
              isFileUploaded ? (
                <>  
                  {/* 1-1-1 로그인O, 업데이트 O, 파일 업로드 했을때=> 분석 시작 버튼 */}
                  <div className="mt-10 max-w-[700px] h-[200px] mx-auto cursor-pointer backdrop-blur-sm rounded-2xl p-8 
                  transition-all duration-300 hover:border-blue-400/60 
                  shadow-sm hover:shadow-md bg-[#292B2E]/70 flex items-center justify-center">  
                      <div className="text-center items-center mx-auto">
                          <Check className="animate-bounce w-12 h-12 text-gray-200 mb-2" style={{ marginLeft: 'auto', marginRight: 'auto' }} />
                          <p className="text-lg font-semibold text-gray-200 mb-2">
                          시청기록이 성공적으로 업로드 되었어요! 
                          </p>
                          <p className="text-sm text-gray-500">
                          결과를 확인하려면 아래 버튼을 눌러주세요.
                          </p>
                      </div> 
                  </div>
                  {/* 호버시 설명 란*/}
                  <div className="mt-4 flex justify-center">
                      <Dialog>
                      <DialogTrigger asChild>
                      <button className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                          <HelpCircle className="w-4 h-4" />
                          시청기록 자동 선택 기준 안내
                      </button>
                      </DialogTrigger>

                      <DialogContent className="w-[80vw] justify-center max-w-4xl p-6 rounded-xl shadow-lg" >
                      <div className="space-y-4" ref={guideRef}>
                      <h3 className="text-lg font-semibold flex items-center gap-2 
                      text-gray-800 pb-2 border-b text-center mx-auto">
                          시청기록 자동 선택 기준 안내
                      </h3>
                      <div className="grid grid-cols-2 gap-6 py-4">
                        {/* 왼쪽: 일주일 간격 */}
                        <div className="flex flex-col items-center bg-gray-50 rounded-lg p-4">
                          <span className="text-3xl mb-2">📅</span>
                          <span className="font-bold text-gray-800">일주일 간격</span>
                          <span className="text-xs text-gray-500 mt-1 text-center">
                            최근 날짜부터<br />7일마다 기록 선택
                          </span>
                        </div>
                        {/* 오른쪽: 하루 30개 랜덤 */}
                        <div className="flex flex-col items-center bg-gray-50 rounded-lg p-4">
                          <span className="text-3xl mb-2">🎬</span>
                          <span className="font-bold text-gray-800">하루 30개 랜덤</span>
                          <span className="text-xs text-gray-500 mt-1 text-center">
                            하루에 30개의<br />영상을 무작위 추출
                          </span>
                        </div>
                      </div>
                      {/* 아래 요약 문장 */}
                      <div className="mt-2 text-sm text-gray-700 text-center">
                        <span className="font-semibold text-gray-800">최근 일주일</span> 동안, <span className="font-semibold text-gray-800">하루당 30개씩</span> <br />
                        영상을 <span className="font-semibold">무작위</span>로 골라 분석합니다.
                      </div>
                      </div>
                      </DialogContent>
                      </Dialog>
                  </div>
                  
                    <button
                      onClick={() => {
                        setScrollToGuide(true);
                        console.log("분석 시작");
                        router.push('/upload/page_user');
                      }}
                      style={{
                        position: "relative",
                        marginTop: 140,
                        marginBottom: 200,
                        background: "#fff",
                        color: "#181818",
                        fontWeight: 700,
                        fontSize: 20,
                        border: "none",
                        borderRadius: 32,
                        padding: "16px 40px",
                        cursor: "pointer",
                        transition: "opacity 0.8s",
                        boxShadow: "2.63px 2.63px 87.73px #ffffff66",
                        opacity: showButton ? 1 : 0.4,  
                      }}
                    >
                      나의 알고리즘 자화상 보기
                    </button>
                  )
                </>
              ) : (
                <>
                  {/* 1-1-2 로그인O, 업데이트 O, 파일 업로드 X => 파일 업로드 버튼 */}
                  <div
                      onClick={e => {
                        // 초기 사용자는 reflection 불필요, 바로 업로드 진행
                        if (upload_check === -1) {
                          console.log('🔵 초기 사용자: 바로 업로드 진행');
                          fileInputRef.current?.click();
                          return;
                        }
                        
                        // 기존 사용자만 reflection 체크
                        if (isReflection2) {  // 리플렉션 2 여부 확인
                          setPendingUploadAction(() => () => fileInputRef.current?.click());
                          pendingUploadAction?.();
                          setShowOverlayQuestion(false);
                        } else {
                          setShowOverlayQuestion(true);
                        }
                      }}
                      className={`max-w-[700px] mx-auto cursor-pointer backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 ${
                      isDragging 
                          ? 'border-2 border-blue-500 bg-blue-50/30 scale-[1.02] shadow-lg' 
                          : 'border-2 border-gray-200/60 hover:border-blue-400/60 shadow-sm hover:shadow-md bg-white/70'
                      }`}
                      onDragEnter={e => handleDragEnter(e, setIsDragging)}
                      onDragOver={handleDragOver}
                      onDragLeave={e => handleDragLeave(e, setIsDragging)}
                      onDrop={e => {
                        e.preventDefault();
                        setPendingUploadAction(() => () => handleDrop(e, {
                          setIsDragging,
                          setIsLoading,
                          setError,
                          setSuccessCount,
                          dateRange,
                          maxVideosPerDay,
                          fetchVideoInfo,
                          openai,
                          undefined, // OpenAILogger 제거 (서버 사이드 에러 방지)
                          parseWatchHistory
                        }));
                        
                        // 초기 사용자는 reflection 불필요
                        if (upload_check !== -1) {
                          setShowOverlayQuestion(true);
                        }
                      }}
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
                          undefined, // OpenAILogger 제거 (서버 사이드 에러 방지)
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
                {/* 1-2 로그인O, 업데이트 X */}
                <div className="mt-10 max-w-[700px] h-[200px] mx-auto cursor-pointer backdrop-blur-sm rounded-2xl p-8 
                transition-all duration-300 hover:border-blue-400/60 
                shadow-sm hover:shadow-md bg-[#292B2E]/70 flex items-center justify-center">  
                    <div className="text-center items-center mx-auto">
                        <p className="text-lg font-semibold text-gray-200 mb-2">
                        유튜브 알고리즘이 본 당신의 모습이 바뀌었을지 궁금하신가요?
                        <br/>
                        <span className="text-blue-500">{7-upload_check}일 후</span> 
                        다시 시도해보세요.
                        </p>
                    </div> 
                </div>
              </>
            )}
          </> 
        ) : (
          <>
            {/* 1-2 로그인X => 로그인 버튼 */}
            <div className="mt-20 flex flex-col gap-4 w-[400px] mx-auto items-center">
              {/* 구글 로그인 */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center w-full h-12 rounded-lg bg-white text-gray-900 font-medium text-base shadow transition hover:bg-gray-100 disabled:opacity-60"
              >
                <Image src="/images/google.png" alt="Google" width={22} height={22} className="mr-2" />
                Google 로 시작하기
              </button>
              {/* 깃헙 로그인 */}
              <button
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="flex items-center justify-center w-full h-12 rounded-lg bg-white text-gray-900 font-medium text-base shadow transition hover:bg-gray-100 disabled:opacity-60"
              >
                <Image src="/images/github.png" alt="GitHub" width={22} height={22} className="mr-2" />
                GitHub로 시작하기
                </button>
                {/*
                <button onClick={() => {
                  createUserData(); 
                  const temp: any = {};

                  saveProfileData(temp);
                  const result = saveClusterHistory(temp, localStorage); 
                  console.log('result', result);
                }}
                style={{
                  marginTop: 10, 
                  color: 'white',
                  backgroundColor: 'black',
                  border: '1px solid white',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 16,
                }}
                >
                  userdata 생성 테스트용
                </button>
                */}
            </div>
            
          </>
        )}
      </div>
      </div>
      {isLoggedIn && showOverlayQuestion && (
        <OverlayQuestion2
          onLeftClick={() => setShowOverlayQuestion(false)}
          onRightClick={() => {
            setShowOverlayQuestion(false);
            router.push('/reflection/reflection2');
          }}
        />
      )}
    </main>
  );

} 