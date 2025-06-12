"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { ProfileData, ImageData } from '@/app/types/profile';
import SearchCard from '@/components/searchCard/SearchCard';
import { getAllPublicProfiles, getClusterImages, getClusterHistory, getPublicClusterHistory, getPublicClusterImages, getCurrentUserId, getProfileData, saveProfileData } from '@/lib/database';

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
      // 🆕 키워드가 없어도 모든 공개 프로필 표시
      console.log('[Search] 키워드 없음, 모든 공개 프로필 표시');
      performSearch([]);
    }
  }, [searchParams]);

  // 검색 로직 수정 - DB에서 공개된 프로필들 가져오기
  const performSearch = async (searchKeywords: string[]) => {
    setIsLoading(true);
    try {
      // 🆕 현재 사용자 ID 가져오기 (본인 제외용)
      const currentUserId = await getCurrentUserId();
      
      // DB에서 공개된 프로필들 가져오기
      const publicProfiles = await getAllPublicProfiles();
      
      if (publicProfiles && publicProfiles.length > 0) {
        // 🆕 현재 사용자 제외 필터링
        const otherUserProfiles = publicProfiles.filter(profile => 
          profile.user_id !== currentUserId
        );
        
        console.log(`[Search] 전체 공개 프로필: ${publicProfiles.length}, 본인 제외 후: ${otherUserProfiles.length}`);
        
        // 각 프로필에 대해 클러스터 이미지들도 가져오기
        const profilesWithImages = await Promise.all(
          otherUserProfiles.map(async (profile) => {
            try {
              console.log(`[Search] 🔍 사용자 ${profile.user_id} 클러스터 로드 시작`);
              
              // 🆕 cluster_images를 우선으로 시도 (현재 프로필 상태)
              let clusterImages = await getPublicClusterImages(profile.user_id);
              
              if (clusterImages && clusterImages.length > 0) {
                console.log(`[Search] ✅ 사용자 ${profile.user_id}의 공개 cluster_images에서 ${clusterImages.length}개 클러스터 로드`);
              } else {
                // fallback: 공개 cluster_history에서 시도 (저장된 상태)
                clusterImages = await getPublicClusterHistory(profile.user_id);
                console.log(`[Search] 사용자 ${profile.user_id}의 공개 cluster_history에서 ${clusterImages?.length || 0}개 클러스터 로드`);
              }
              
              // DB 데이터를 ImageData 형식으로 변환
              const formattedImages: ImageData[] = clusterImages?.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                main_keyword: item.main_keyword,
                keywords: item.keywords || [],
                mood_keyword: item.mood_keyword || '',
                description: item.description || '',
                category: item.category || '',
                sizeWeight: item.size_weight || 1,
                src: item.src,
                relatedVideos: item.related_videos || [],
                desired_self: false,
                desired_self_profile: item.desired_self_profile,
                metadata: item.metadata || {},
                rotate: item.rotate || 0,
                width: item.width || 300,
                height: item.height || 200,
                left: item.left_position || '0px',
                top: item.top_position || '0px',
                position: { x: item.position_x || 0, y: item.position_y || 0 },
                frameStyle: item.frame_style || 'normal',
                created_at: item.created_at || new Date().toISOString()
              })) || [];

              return {
                id: profile.user_id,
                nickname: profile.nickname,
                description: profile.description,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                images: formattedImages
              };
            } catch (error) {
              console.error(`사용자 ${profile.user_id}의 이미지 로드 실패:`, error);
              return {
                id: profile.user_id,
                nickname: profile.nickname,
                description: profile.description,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                images: []
              };
            }
          })
        );

        // 키워드 필터링 (선택적)
        const filteredProfiles = profilesWithImages.filter(profile => {
          if (searchKeywords.length === 0) return true;
          
          // 프로필의 모든 이미지에서 키워드 추출
          const profileKeywords = profile.images.flatMap(img => 
            [img.main_keyword, ...img.keywords, img.category]
          );
          
          // 검색 키워드 중 하나라도 프로필 키워드에 포함되면 결과에 추가
          return searchKeywords.some(keyword => 
            profileKeywords.some(profileKeyword => 
              profileKeyword?.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        });

        setSearchResults(filteredProfiles);
        console.log('[Search] DB에서 프로필 검색 완료:', filteredProfiles.length);
        console.log('[Search] 검색 결과:', filteredProfiles.map(p => ({ id: p.id, nickname: p.nickname, imageCount: p.images.length })));
      } else {
        console.log('[Search] 공개된 프로필이 없습니다.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[Search] 검색 오류:', error);
      setSearchResults([]);
    } finally {
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
          {keywords.length > 0 ? (
            <>
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
            </>
          ) : (
            <>
              <h2 className="text-xl text-white/80 mb-4">연결 가능한 모든 프로필을 탐색해보세요:</h2>
              <p className="text-white/60 text-sm">
                공개 설정을 허용한 사용자들의 프로필을 확인할 수 있습니다.
              </p>
            </>
          )}
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
