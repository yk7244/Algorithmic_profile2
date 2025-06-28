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
        className={`absolute top-0 z-50 w-full ${
          pathname === "/my_profile" || pathname === "/search"
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
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Link href="/introduction" className="hidden md:flex items-center gap-1 text-gray-300 hover:text-white transition-colors ml-3">
                  <span className="text-xs font-medium">TubeLens 프로젝트가 궁금하신가요?</span>
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </HoverCardTrigger>
              
            </HoverCard>
          </div>

          <nav className="hidden md:flex items-center gap-x-4 md:pr-0">
            {isLoggedIn ? (
              <>
                
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" || pathname === "/search" ? "text-black " : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}>
                  <Link href="/my_profile">나의 알고리즘 프로필</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={`${pathname === "/my_profile" || pathname === "/search" ? "text-black" : "text-white"} text-sm font-medium hover:bg-white hover:text-black px-6 hover: rounded-[20px]`}>
                  <Link href="/search">다른 알고리즘 탐색</Link>
                </Button>
                
                {/* 언어 선택 버튼 
                <Button variant="ghost" size="sm" onClick={handleLanguageToggle} className={`${pathname === "/my_profile" ? "text-black" : "text-white"} text-sm font-medium flex items-center px-6 hover: rounded-[20px]`}>
                  {language === "KO" ? "KO" : "EN"} 
                </Button>
                */}
                <Button asChild variant="ghost" size="sm" className={`flex items-center gap-1.5 ${pathname === "/my_profile" || pathname === "/search" ? "text-black" : "text-white"} text-sm font-medium px-6 py-1.5 rounded-md hover:bg-white hover:text-black hover: rounded-[20px]`}>
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
                <Button variant="ghost" size="icon" className={pathname === "/my_profile" || pathname === "/search" ? "text-black" : "text-white"}>
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
                        <Link href="/my_profile">나의 알고리즘 프로필</Link>
                      </Button>
                      <Button asChild variant="ghost" size="lg" className={`w-full h-auto py-6 text-lg font-medium justify-start hover:bg-white hover:text-black rounded-[20px]`}>
                        <Link href="/search">다른 알고리즘 탐색</Link>
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