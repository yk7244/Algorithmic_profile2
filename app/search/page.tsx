"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { dummyUsers } from '@/app/others_profile/dummy-data';
import { ProfileData, ImageData } from '@/app/types/profile';
import SearchCard from '@/components/searchCard/SearchCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<(ProfileData & { images: ImageData[] })[]>([]);

  useEffect(() => {
    // URL에서 키워드 파라미터 가져오기
    const keywordParam = searchParams.get('keywords');
    if (keywordParam) {
      const keywordArray = keywordParam.split(',');
      setKeywords(keywordArray);
      
      // 여기서 검색 로직 구현
      performSearch(keywordArray);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  // 검색 로직 수정 - 필터링 없이 모든 프로필 표시
  const performSearch = async (searchKeywords: string[]) => {
    setIsLoading(true);
    try {
      // 필터링 로직 주석 처리하고 모든 더미 프로필 표시
      setTimeout(() => {
        // dummyUsers를 ProfileData 배열로 변환
        const profiles = Object.values(dummyUsers).map(user => ({
          ...user.profile,
          images: user.images
        }));
        setSearchResults(profiles);
        setIsLoading(false);
      }, 1500); // 로딩 효과를 위해 지연 시간 유지
      
      /* 원래 필터링 로직 (주석 처리)
      setTimeout(() => {
        // 키워드와 일치하는 프로필 찾기
        const results = dummyProfiles.filter(profile => {
          // 프로필의 모든 이미지에서 키워드 추출
          const profileKeywords = profile.images.flatMap(img => 
            [img.main_keyword, ...img.keywords]
          );
          
          // 검색 키워드 중 하나라도 프로필 키워드에 포함되면 결과에 추가
          return searchKeywords.some(keyword => 
            profileKeywords.some(profileKeyword => 
              profileKeyword.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        });
        
        setSearchResults(results);
        setIsLoading(false);
      }, 1500);
      */
    } catch (error) {
      console.error('검색 오류:', error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* 검색 모드일 때 배경 그라데이션 추가 */}
      <div className="min-h-full fixed inset-0 overflow-hidden -z-10 bg-[#333947]">
          <div className="absolute -top-[40%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
          {/*<div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />*/}
          <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
            
          </Button>
          <h1 className="text-3xl font-bold text-white"> 검색 결과 </h1>
        </div>
        
        {/* 검색 키워드 표시 */}
        <div className="mb-8">
          <h2 className="text-xl text-white/80 mb-4">다음 관심사를 가진 프로필을 찾고 있어요:</h2>
          <div className="flex flex-wrap gap-3">
            {keywords.map((keyword, index) => (
              <div 
                key={index}
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30"
              >
                <span className="text-md font-bold text-white">
                  #{keyword}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 검색 결과 */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white text-xl"> 당신과 비슷한 취향의 사람을 찾고 있어요...</p>
            </div>
          ) : searchResults.length > 0 ? (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((profile) => (
                <SearchCard
                  key={profile.id}
                  profile={profile}
                  onCardClick={(profileId) => router.push(`/others_profile/${profileId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">아쉽게도 비슷한 취향을 가진 유저가 없습니다.</h3>
              <p className="text-white/70">다른 관심사를 선택해보거나 나중에 다시 시도해보세요</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
