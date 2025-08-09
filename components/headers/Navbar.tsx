"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Menu, HelpCircle, Youtube, Sparkles, UserCircle2, ChevronDown } from "lucide-react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useRouter } from 'next/navigation';
import { getReflectionData } from '@/app/utils/get/getReflectionData';
import OverlayQuestion1 from '@/app/reflection/reflection1/overlay/OverlayQuestion1';
import OverlayQuestion2 from '@/app/reflection/reflection2/overlay/OverlayQuestion2';
import { isOneWeekPassed } from '@/app/utils/uploadCheck';

export function Navbar() {
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  const { isLoggedIn, logout, user, userData, isLoading: authLoading } = useAuth();
  const [language, setLanguage] = useState("KO");
  const router = useRouter();
  const [showOverlayQuestion1, setShowOverlayQuestion1] = useState(false);
  const [showOverlayQuestion2, setShowOverlayQuestion2] = useState(false);
  const [reflectionData, setReflectionData] = useState<any>(null);
  const [isReflection1, setIsReflection1] = useState(false);
  const [isReflection2, setIsReflection2] = useState(false);
  const handleLanguageToggle = () => {
    setLanguage(prevLang => prevLang === "KO" ? "EN" : "KO");
  };
  const [isLocked, setIsLocked] = useState(false);
  
  // 기존 reflection 로드는 아래의 통합된 함수로 대체됨
  
  useEffect(() => {
    // 인증이 로딩 중이거나 로그인되지 않은 경우 실행하지 않음
    if (authLoading || !isLoggedIn) {
      return;
    }

    const loadUploadCheckAndSetLockAndReflection = async () => {
      try {
        const uploadCheck = await isOneWeekPassed();
        console.log('🔍 Navbar Upload Check 결과:', uploadCheck);

        // 리플렉션 데이터도 함께 로드
        const reflectionResult = await getReflectionData();
        setReflectionData(reflectionResult);

        // 초기 사용자는 reflection 불필요
        if (uploadCheck === -1) {
          console.log('🔵 초기 사용자: navbar reflection 불필요');
          setIsReflection1(false);
          setIsReflection2(false);
          setIsLocked(false); // 락 해제
        } else {
          // 업로드 기록이 있는 사용자만 reflection 체크
          // ✅ 수정: reflection1 완료 시 탐색 활성화
          setIsReflection1(reflectionResult?.reflection1 === true);
          setIsReflection2(reflectionResult?.reflection1 === true && reflectionResult?.reflection2 !== true);

          if(uploadCheck === -2){  //업데이트 날짜 지난 경우, 두번째 업데이트 유저
            console.log('두번째 업데이트 유저 메뉴바 락 되었습니다. 업데이트 후, 사용가능합니다.');

            if(reflectionResult?.reflection1 === true && reflectionResult?.reflection2 !== true){
              setShowOverlayQuestion2(true); //리플랙션2 안했으면 보여줌.
            }else{ 
              setShowOverlayQuestion2(false); //리플랙션2 했으면 안보여줌.
            }

            if(reflectionResult?.reflection1 !== true){
              setIsLocked(true); // 락 걸림
            }else{ 
              setIsLocked(false); //업데이트 하면 리플랙션 테이블 초기화되니까 락 해제
            }
          }else{
            console.log('📅', uploadCheck, '일 지남 - 업데이트 대기');
            setIsLocked(false); 
          }
        }
        
        console.log('✅ Navbar: 업로드 체크 및 리플렉션 데이터 로드 완료');
      } catch (error) {
        console.error('❌ Navbar: 업로드 체크 및 리플렉션 데이터 로드 오류:', error);
        setIsLocked(false); // 오류 시 락 해제
        setIsReflection1(false);
        setIsReflection2(false);
      }
    };

    loadUploadCheckAndSetLockAndReflection();
  }, [authLoading, isLoggedIn]); // 인증 상태가 변경될 때만 실행

  // 사용자 이름 가져오기 (DB에서 가져온 실제 사용자 데이터 사용)
  const userName = userData?.nickname || 
                   user?.user_metadata?.full_name || 
                   user?.email?.split('@')[0] || 
                   "사용자";

  return (
    <>
        <header
        className={`absolute top-0 z-50 w-full ${
          pathname === "/" || pathname === "/upload"
            ? "bg-black text-white"
            : "bg-white/30 text-black backdrop-blur-lg"
        }`}
      >
        <div className="w-full flex h-12 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-5 w-5 flex items-center justify-center">
                <Image src="/images/logo.png" alt="TubeLens Logo" width={18} height={18} />
              </div>
              <span className={`${pathname === "/" ? "text-white bg-shadow-lg shadow-white  " : pathname === "/upload" ? "text-black" : "text-black"} text-lg font-bold tracking-[-0.4px] leading-snug whitespace-nowrap`}>
                TubeLens
              </span>
            </Link>
            {/*
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Link href="/introduction" className={`hidden md:flex items-center gap-1 transition-colors ml-3 
                  ${pathname === "/" ? "text-gray-300 hover:text-white" : pathname === "/upload" ? "text-gray-700 hover:text-black" : "text-gray-300 hover:text-black"}`}>
                  <span className="text-xs font-medium">TubeLens 프로젝트가 궁금하신가요?</span>
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </HoverCardTrigger>
                          
            </HoverCard>
            */}
          </div>

          <nav className="hidden md:flex items-center gap-x-4 md:pr-0">
            {isLoggedIn && !isLocked ? (
              <>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${pathname === "/" ? "text-white " : pathname === "/my_profile" ? "bg-black text-white" : "text-black"} text-sm font-medium px-6 rounded-[20px]`}
                  onClick={() => {
                    // 페이지 이동 시 강제로 새로고침 파라미터 추가 (중복 클릭 방지)
                    if (window.location.pathname === '/my_profile') {
                      // 이미 my_profile 페이지에 있으면 새로고침 파라미터만 추가
                      const timestamp = Date.now();
                      router.replace(`/my_profile?refresh=${timestamp}`);
                    } else {
                      // 다른 페이지에서 온 경우 정상적인 이동
                      const timestamp = Date.now();
                      router.push(`/my_profile?refresh=${timestamp}`);
                    }
                  }}
                >
                  나의 알고리즘
                </Button>
                  <Button asChild variant="ghost" size="sm" className={`${pathname === "/" ? "text-white" : pathname === "/search" ? "bg-black text-white" : "text-black"} text-sm font-medium rounded-[20px]`}
                onClick={() => {
                  if (reflectionData?.reflection1 === true) {
                    router.replace('/my_profile?explore=1');
                  } else {
                    setShowOverlayQuestion1(true);
                  }
                }}
                >
                  <span>다른 사람의 알고리즘 탐색</span>
                </Button>
                
                {/* 언어 선택 버튼 
                <Button variant="ghost" size="sm" onClick={handleLanguageToggle} className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium flex items-center px-6 hover: rounded-[20px]`}>
                  {language === "KO" ? "KO" : "EN"} 
                </Button>
                */}
                <Button asChild variant="ghost" size="sm" className={`flex items-center gap-1.5 ${pathname === "/" ? "text-white" : pathname === "/my_page" ? "bg-black text-white" : "text-black"} text-sm font-medium px-6 py-1.5 rounded-full`}>
                  <Link href="/my_page" className="flex items-center gap-1.5">
                    <UserCircle2 className="w-4 h-4" />
                    <span>{userName}</span>
                  </Link>
                </Button>
                
              </>
            ) : (
              <>
                {/* 언어 선택 버튼 
                <Button variant="ghost" size="sm" onClick={handleLanguageToggle} className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium flex items-center px-6 rounded-[20px]`}>
                  {language === "KO" ? "KO" : "EN"} 
                </Button>
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" || pathname === "/search" ? "text-black" : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 rounded-[20px]`}>
                  <Link href="/login">로그인</Link>
                </Button>
                */}
                
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-x-1 pr-0">
            { (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLanguageToggle} 
                className={`text-sm font-medium flex items-center px-2`}
              >
                {/*
                {language === "KO" ? "KO" : "EN"}
                */}
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={pathname === "/" ? "text-white" : "text-black"}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] bg-black border-l border-gray-700 text-white">
                <nav className="flex flex-col space-y-1 mt-6">
                  {isLoggedIn ? (
                    
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className={`w-full h-auto py-6 text-lg font-medium justify-start  hover:bg-white hover:text-black border-b border-gray-700 mb-2`}
                      >
                        <Link href="/my_page" className="flex items-center gap-2">
                          <UserCircle2 className="w-5 h-5 mr-2" />
                          {userName}님 페이지
                        </Link>
                      </Button>

                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black  hover:bg-shadow-lg rounded-[20px]`}>
                        <Link href="/my_profile">나의 알고리즘</Link>    
                      </Button>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black  hover:bg-shadow-lg rounded-[20px]`}>
                        {reflectionData?.reflection1 === true ? (
                          <Link href="/my_profile?explore=1">다른 사람의 알고리즘 탐색</Link>
                        ) : (
                          <div onClick={() => setShowOverlayQuestion1(true)}>다른 사람의 알고리즘 탐색</div>
                        )}
                      </Button>
                      
                      
                      <Button variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`} onClick={logout}>
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      {/*
                      {isMainPage && (
                        <div className="px-4 pt-5 flex items-center gap-1.5 text-gray-400 border-t border-gray-700 mt-1.5 rounded-[20px]">
                          <HelpCircle className="w-5 h-5" />
                          <span className="text-base">TubeLens가 궁금하신가요?</span>
                        </div>
                      )}
                      */}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      {showOverlayQuestion1 && (
        <OverlayQuestion1
          onLeftClick={() => setShowOverlayQuestion1(false)}
          onRightClick={() => {
            router.replace('/reflection/reflection1');
            setShowOverlayQuestion1(false);
          }}
        />
      )}
      {showOverlayQuestion2 && (
        <OverlayQuestion2
          onLeftClick={() => setShowOverlayQuestion2(false)}
          onRightClick={() => {
            router.replace('/reflection/reflection2');
            setShowOverlayQuestion2(false);
          }}
        />
      )}
    </>
  );
} 