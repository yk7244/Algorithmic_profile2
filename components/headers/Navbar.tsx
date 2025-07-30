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
  const { isLoggedIn, logout } = useAuth();
  const [language, setLanguage] = useState("KO");
  const router = useRouter();
  const [showOverlayQuestion1, setShowOverlayQuestion1] = useState(false);
  const [showOverlayQuestion2, setShowOverlayQuestion2] = useState(false);
  
  const reflectionData = getReflectionData();
  const isReflection1 = reflectionData?.reflection1 !== false;
  const isReflection2 = reflectionData?.reflection2 !== false;
  const handleLanguageToggle = () => {
    setLanguage(prevLang => prevLang === "KO" ? "EN" : "KO");
  };
  const [isLocked, setIsLocked] = useState(false);
  
  useEffect(() => {
    if(isOneWeekPassed()==-2){  //업데이트 날짜 지난 경우, 두번째 업데이트 유저
      
      console.log('두번째 업데이트 유저 메뉴바 락 되었습니다. 업데이트 후, 사용가능합니다.');

      if(isReflection2){
        setShowOverlayQuestion2(false); //리플랙션2 했으면 안보여줌.
      }else{ 
        setShowOverlayQuestion2(true); //리플랙션1 안했으면 보여줌.
      }

      if(isReflection1){
        setIsLocked(false); //업데이트 하면 리플랙션 테이블 초기화되니까 락 해제
      }else{ 
        setIsLocked(true); // 락 걸림
      }
    }else if(isOneWeekPassed()==-1){  //업데이트 날짜 지난 경우, 첫번째 업데이트 유저
      console.log('첫번째 업데이트 유저 메뉴바 락 해제되었습니다. 업데이트 후, 사용가능합니다.');
      setIsLocked(false); // 락 걸림
    }else{
      setIsLocked(false); 
    }
  }, []);



  const userName = "daisy";

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
              <span className={`${pathname === "/" ? "text-white" : pathname === "/upload" ? "text-black" : "text-black"} text-lg font-bold tracking-[-0.4px] leading-snug whitespace-nowrap`}>
                TubeLens
              </span>
            </Link>
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Link href="/introduction" className={`hidden md:flex items-center gap-1 transition-colors ml-3 
                  ${pathname === "/" ? "text-gray-300 hover:text-white" : pathname === "/upload" ? "text-gray-700 hover:text-black" : "text-gray-300 hover:text-black"}`}>
                  <span className="text-xs font-medium">TubeLens 프로젝트가 궁금하신가요?</span>
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </HoverCardTrigger>
              
            </HoverCard>
          </div>

          <nav className="hidden md:flex items-center gap-x-4 md:pr-0">
            {isLoggedIn && !isLocked ? (
              <>
                
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/" ? "text-white " : "text-black"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`
              
              }>
                  <Link href="/my_profile">나의 알고리즘 자화상 </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/" ? "text-white" : "text-black"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}
                onClick={() => {
                  if (isReflection1) {
                    router.replace('/my_profile?explore=1');
                  } else {
                    setShowOverlayQuestion1(true);
                  }
                }}
                >
                  <span>다른 사람의 알고리즘 자화상 탐색</span>
                </Button>
                
                {/* 언어 선택 버튼 
                <Button variant="ghost" size="sm" onClick={handleLanguageToggle} className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium flex items-center px-6 hover: rounded-[20px]`}>
                  {language === "KO" ? "KO" : "EN"} 
                </Button>
                */}
                <Button asChild variant="ghost" size="sm" className={`flex items-center gap-1.5 ${pathname === "/" ? "text-white" : "text-black"} text-sm font-medium px-6 py-1.5 rounded-md hover:bg-white hover:text-black hover: rounded-[20px]`}>
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

                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/my_profile">나의 알고리즘 자화상</Link>    
                      </Button>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/my_profile?explore=1">다른 사람의 알고리즘 자화상 탐색</Link>
                      </Button>
                      
                      
                      <Button variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`} onClick={logout}>
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      
                      {isMainPage && (
                        <div className="px-4 pt-5 flex items-center gap-1.5 text-gray-400 border-t border-gray-700 mt-1.5 rounded-[20px]">
                          <HelpCircle className="w-5 h-5" />
                          <span className="text-base">TubeLens가 궁금하신가요?</span>
                        </div>
                      )}
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