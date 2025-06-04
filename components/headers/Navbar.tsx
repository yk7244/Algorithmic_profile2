"use client";

import { useState } from 'react';
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

export function Navbar() {
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  const { isLoggedIn, logout } = useAuth();
  const [language, setLanguage] = useState("KO");

  const handleLanguageToggle = () => {
    setLanguage(prevLang => prevLang === "KO" ? "EN" : "KO");
  };

  const userName = "daisy";

  return (
      <header
        className={`sticky top-0 z-50 w-full ${
          pathname === "/my_profile"
            ? "bg-white/30 text-black backdrop-blur-lg"
            : "bg-black text-white"
        }`}
      >
        <div className="w-full flex h-12 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-5 w-5 flex items-center justify-center">
                <Image src="/images/logo.png" alt="TubeLens Logo" width={18} height={18} />
              </div>
              <span className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-lg font-bold tracking-[-0.4px] leading-snug whitespace-nowrap`}>
                TubeLens
              </span>
            </Link>
            {isMainPage && (
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger className="hidden md:flex items-center gap-1 text-gray-300 hover:text-white transition-colors ml-3">
                  <span className="text-xs font-medium">TubeReframe이 궁금하신가요?</span>
                  <HelpCircle className="w-4 h-4" />
                </HoverCardTrigger>
                <HoverCardContent 
                  className="w-[500px] p-6 bg-black border border-gray-700 shadow-2xl text-white"
                  style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '10px',
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-700 pb-3">
                      <Image src="/images/logo.png" alt="TubeLens Info" width={24} height={24} />
                      <h4 className="text-xl font-bold text-white">
                        TubeReframe이란?
                      </h4>
                    </div>
                    <div className="space-y-4 px-1">
                      <p className="text-base leading-relaxed text-gray-300">
                        유튜브 시청 기록을 기반으로 사용자의 관심사와 성향을 분석하여 
                        새로운 관점의 프로필을 제공하는 서비스입니다.
                      </p>
                      <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <Sparkles className="w-5 h-5 text-white" />
                        <p className="text-base font-medium text-white">
                          당신의 시청 기록이 말해주는 숨겨진 이야기를 발견해보세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-x-4 md:pr-0">
            {isLoggedIn ? (
              <>
                
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" ? "text-black " : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}>
                  <Link href="/my_profile">나의 튜브렌즈</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}>
                  <Link href="/search_map">관심사 탐색</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}>
                  <Link href="/watch-history">시청기록</Link>
                </Button>
                {/* 언어 선택 버튼 
                <Button variant="ghost" size="sm" onClick={handleLanguageToggle} className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium flex items-center px-6 hover: rounded-[20px]`}>
                  {language === "KO" ? "KO" : "EN"} 
                </Button>
                */}
                <Button asChild variant="ghost" size="sm" className={`flex items-center gap-1.5 ${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium px-6 py-1.5 rounded-md hover:bg-white hover:text-black hover: rounded-[20px]`}>
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
                */}
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 rounded-[20px]`}>
                  <Link href="/login">로그인</Link>
                </Button>
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
                <Button variant="ghost" size="icon" className={pathname === "/my_profile" ? "text-black" : "text-white"}>
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
                        <Link href="/my_profile">나의 튜브렌즈</Link>
                      </Button>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/search_map">관심사 탐색</Link>
                      </Button>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start  hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/watch-history">시청기록</Link>
                      </Button>
                      
                      <Button variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`} onClick={logout}>
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/login">로그인</Link>
                      </Button>
                      {isMainPage && (
                        <div className="px-4 pt-5 flex items-center gap-1.5 text-gray-400 border-t border-gray-700 mt-1.5 rounded-[20px]">
                          <HelpCircle className="w-5 h-5" />
                          <span className="text-base">TubeReframe이 궁금하신가요?</span>
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
  );
} 