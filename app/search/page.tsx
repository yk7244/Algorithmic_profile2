"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";


import { ImageData } from '@/app/types/profile';
import CardStack3D from './SearchMode/showCard';      
import { useAuth } from '@/context/AuthContext';
import { getAllPublicImages, searchImagesByKeyword, getActiveUserImages } from '@/lib/database-clean';
import { addSimilarityScores } from '@/lib/similarity';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 유상님✅ 더미 데이터로 가져온 이미지들 그냥 검색 결과에 다 ImageData[] 형태로 저장
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(true);
  const [show, setShow] = useState(true); // 안내 문구 표시 여부
    
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

  // DB에서 공개 사용자 프로필 검색 - 인증된 사용자만 검색 결과 표시
  const performSearch = async (searchKeywords: string[]) => {
    setIsLoading(true);
    try {
      if (!isLoggedIn) {
        // 로그인하지 않은 사용자는 빈 결과
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      console.log('🔍 검색 키워드:', searchKeywords);
      console.log('🔍 현재 사용자 ID:', user?.id);
      console.log('🔍 현재 사용자 정보:', {
        id: user?.id,
        email: user?.email,
        isLoggedIn
      });

      // DB에서 공개된 사용자 이미지들 검색 (현재 사용자 제외)
      let allPublicImages: ImageData[] = [];
      const currentUserId = user?.id; // ✅ 현재 사용자 ID

      // 🔍 디버깅: 전체 공개 이미지 수 먼저 확인
      const allImagesWithoutFilter = await getAllPublicImages(100); // 필터 없이
      console.log('🔍 전체 공개 이미지 수 (필터 없음):', allImagesWithoutFilter.length);
      
      if (searchKeywords.length > 0) {
        // 키워드별로 검색 (현재 사용자 제외)
        for (const keyword of searchKeywords) {
          console.log(`🔍 키워드 "${keyword}" 검색 중...`);
          const keywordImages = await searchImagesByKeyword(keyword.trim(), 20, currentUserId);
          console.log(`🔍 키워드 "${keyword}" 검색 결과:`, keywordImages.length, '개');
          allPublicImages = [...allPublicImages, ...keywordImages];
        }
        
        // ✅ 키워드 검색 결과가 없으면 전체 공개 이미지 가져오기 (fallback)
        if (allPublicImages.length === 0) {
          console.log('⚠️ 키워드 검색 결과가 없어 전체 공개 이미지를 가져옵니다.');
          allPublicImages = await getAllPublicImages(50, currentUserId);
          console.log(`🔍 Fallback: 전체 공개 이미지 ${allPublicImages.length}개 조회됨`);
        }
      } else {
        // 키워드가 없으면 모든 공개 이미지 가져오기 (현재 사용자 제외)
        allPublicImages = await getAllPublicImages(50, currentUserId); // 최대 50개
      }

      console.log('🔍 중복 제거 전 총 이미지 수:', allPublicImages.length);

      // 중복 제거 (같은 이미지 ID로)
      const uniqueImages = allPublicImages.filter((image, index, self) => 
        index === self.findIndex(i => i.id === image.id)
      );

      console.log('🔍 중복 제거 후 총 이미지 수:', uniqueImages.length);
      console.log('🔍 검색 결과 사용자 ID들:', uniqueImages.map(img => ({
        id: img.id,
        user_id: img.user_id,
        main_keyword: img.main_keyword
      })));

      // ✅ 추가 안전장치: 현재 사용자의 클러스터 강제 제거
      const filteredUniqueImages = uniqueImages.filter(img => {
        const isOwnCluster = img.user_id === currentUserId;
        if (isOwnCluster) {
          console.log(`⚠️ 현재 사용자의 클러스터 제거: ${img.main_keyword} (${img.user_id})`);
        }
        return !isOwnCluster;
      });

      console.log(`🔍 현재 사용자 제외 후: ${uniqueImages.length}개 → ${filteredUniqueImages.length}개`);

      // ✅ 유사도 계산: 사용자가 선택한 클러스터 찾기
      let searchResultsWithSimilarity: ImageData[] = [];
      
      if (searchKeywords.length > 0 && filteredUniqueImages.length > 0) {
        try {
          // 사용자의 현재 활성 이미지들에서 선택한 클러스터 찾기
          console.log('🔍 사용자의 클러스터 찾는 중...');
          const userImages = await getActiveUserImages(currentUserId || '');
          console.log('🔍 사용자의 활성 이미지 수:', userImages.length);
          
          // 검색 키워드와 일치하는 사용자의 클러스터 찾기
          const selectedKeyword = searchKeywords[0]; // 첫 번째 키워드 사용
          const selectedCluster = userImages.find(img => 
            img.main_keyword?.toLowerCase().includes(selectedKeyword.toLowerCase()) ||
            (img.keywords && img.keywords.some(k => k.toLowerCase().includes(selectedKeyword.toLowerCase())))
          );

          if (selectedCluster) {
            console.log('✅ 선택된 클러스터 찾음:', selectedCluster.main_keyword);
            
            // DB 형식을 ImageData 형식으로 변환
            const selectedClusterData: ImageData = {
              id: selectedCluster.id,
              src: selectedCluster.image_url || selectedCluster.src || '',
              main_keyword: selectedCluster.main_keyword || '',
              keywords: selectedCluster.keywords || [],
              mood_keyword: selectedCluster.mood_keyword || '',
              description: selectedCluster.description || '',
              category: selectedCluster.category || '',
              user_id: selectedCluster.user_id,
              sizeWeight: selectedCluster.size_weight || 1,
              frameStyle: selectedCluster.frame_style || 'normal',
              left: selectedCluster.css_left || '0px',
              top: selectedCluster.css_top || '0px',
              position: selectedCluster.position || { x: 0, y: 0 },
              relatedVideos: selectedCluster.related_videos || [],
              desired_self: selectedCluster.desired_self || false,
              desired_self_profile: selectedCluster.desired_self_profile || null,
              metadata: selectedCluster.metadata || {},
              rotate: selectedCluster.rotate || 0,
              width: selectedCluster.width || 200,
              height: selectedCluster.height || 200,
              created_at: selectedCluster.created_at
            };

            // DB 형식을 ImageData 형식으로 먼저 변환
            const convertedResults = filteredUniqueImages.map(dbImage => ({
              id: dbImage.id,
              src: dbImage.src || dbImage.image_url || '', 
              main_keyword: dbImage.main_keyword || 'Unknown',
              keywords: dbImage.keywords || [], 
              mood_keyword: dbImage.mood_keyword || '', 
              description: dbImage.description || '', 
              category: dbImage.category || 'general', 
              user_id: dbImage.user_id,
              sizeWeight: dbImage.size_weight || dbImage.sizeWeight || 1,
              frameStyle: dbImage.frame_style || dbImage.frameStyle || 'normal',
              left: dbImage.css_left || dbImage.left || '0px',
              top: dbImage.css_top || dbImage.top || '0px',
              position: dbImage.position || { x: 0, y: 0 },
              relatedVideos: dbImage.related_videos || dbImage.relatedVideos || [],
              desired_self: dbImage.desired_self || false, 
              desired_self_profile: dbImage.desired_self_profile || null, 
              metadata: dbImage.metadata || {}, 
              rotate: dbImage.rotate || 0, 
              width: dbImage.width || 200, 
              height: dbImage.height || 200, 
              created_at: dbImage.created_at
            }));

            // 유사도 계산 및 정렬
            console.log('🔍 유사도 계산 시작...');
            searchResultsWithSimilarity = await addSimilarityScores(selectedClusterData, convertedResults);
            console.log('✅ 유사도 계산 완료. 상위 결과들:', 
              searchResultsWithSimilarity.slice(0, 3).map(r => ({
                keyword: r.main_keyword,
                similarity: (r.similarity || 0).toFixed(3)
              }))
            );
          } else {
            console.log('⚠️ 선택된 클러스터를 찾을 수 없어 유사도 없이 결과 반환');
            // DB 형식을 ImageData 형식으로 변환
            searchResultsWithSimilarity = filteredUniqueImages.map(dbImage => ({
              id: dbImage.id,
              src: dbImage.src || dbImage.image_url || '', 
              main_keyword: dbImage.main_keyword || 'Unknown',
              keywords: dbImage.keywords || [], 
              mood_keyword: dbImage.mood_keyword || '', 
              description: dbImage.description || '', 
              category: dbImage.category || 'general', 
              user_id: dbImage.user_id,
              sizeWeight: dbImage.size_weight || dbImage.sizeWeight || 1,
              frameStyle: dbImage.frame_style || dbImage.frameStyle || 'normal',
              left: dbImage.css_left || dbImage.left || '0px',
              top: dbImage.css_top || dbImage.top || '0px',
              position: dbImage.position || { x: 0, y: 0 },
              relatedVideos: dbImage.related_videos || dbImage.relatedVideos || [],
              desired_self: dbImage.desired_self || false, 
              desired_self_profile: dbImage.desired_self_profile || null, 
              metadata: dbImage.metadata || {}, 
              rotate: dbImage.rotate || 0, 
              width: dbImage.width || 200, 
              height: dbImage.height || 200, 
              created_at: dbImage.created_at
            }));
          }
        } catch (error) {
          console.error('❌ 유사도 계산 중 오류:', error);
          // DB 형식을 ImageData 형식으로 변환
          searchResultsWithSimilarity = filteredUniqueImages.map(dbImage => ({
            id: dbImage.id,
            src: dbImage.src || dbImage.image_url || '', 
            main_keyword: dbImage.main_keyword || 'Unknown',
            keywords: dbImage.keywords || [], 
            mood_keyword: dbImage.mood_keyword || '', 
            description: dbImage.description || '', 
            category: dbImage.category || 'general', 
            user_id: dbImage.user_id,
            sizeWeight: dbImage.size_weight || dbImage.sizeWeight || 1,
            frameStyle: dbImage.frame_style || dbImage.frameStyle || 'normal',
            left: dbImage.css_left || dbImage.left || '0px',
            top: dbImage.css_top || dbImage.top || '0px',
            position: dbImage.position || { x: 0, y: 0 },
            relatedVideos: dbImage.related_videos || dbImage.relatedVideos || [],
            desired_self: dbImage.desired_self || false, 
            desired_self_profile: dbImage.desired_self_profile || null, 
            metadata: dbImage.metadata || {}, 
            rotate: dbImage.rotate || 0, 
            width: dbImage.width || 200, 
            height: dbImage.height || 200, 
            created_at: dbImage.created_at
          }));
        }
      } else {
        // DB 형식을 ImageData 형식으로 변환
        searchResultsWithSimilarity = uniqueImages.map(dbImage => ({
          id: dbImage.id,
          src: dbImage.src || dbImage.image_url || '', 
          main_keyword: dbImage.main_keyword || 'Unknown',
          keywords: dbImage.keywords || [], 
          mood_keyword: dbImage.mood_keyword || '', 
          description: dbImage.description || '', 
          category: dbImage.category || 'general', 
          user_id: dbImage.user_id,
          sizeWeight: dbImage.size_weight || dbImage.sizeWeight || 1,
          frameStyle: dbImage.frame_style || dbImage.frameStyle || 'normal',
          left: dbImage.css_left || dbImage.left || '0px',
          top: dbImage.css_top || dbImage.top || '0px',
          position: dbImage.position || { x: 0, y: 0 },
          relatedVideos: dbImage.related_videos || dbImage.relatedVideos || [],
          desired_self: dbImage.desired_self || false, 
          desired_self_profile: dbImage.desired_self_profile || null, 
          metadata: dbImage.metadata || {}, 
          rotate: dbImage.rotate || 0, 
          width: dbImage.width || 200, 
          height: dbImage.height || 200, 
          created_at: dbImage.created_at
        }));
      }

      console.log('✅ DB에서 검색 결과 조회 완료:', searchResultsWithSimilarity.length, '개');
      
      // ✅ 클러스터 유사도 30% 이상만 필터링
      const filteredResults = searchResultsWithSimilarity.filter(result => {
        const similarity = result.similarity || 0;
        return similarity >= 0.3; // 30% 이상
      });
      
      console.log(`🔍 유사도 30% 이상 필터링: ${searchResultsWithSimilarity.length}개 → ${filteredResults.length}개`);
      
      // ✅ 30% 이상 결과가 없으면 상위 결과들을 표시 (최소 3개)
      let finalResults = filteredResults;
      if (filteredResults.length === 0 && searchResultsWithSimilarity.length > 0) {
        console.log('⚠️ 30% 이상 유사도 결과가 없습니다. 상위 3개 결과를 표시합니다.');
        finalResults = searchResultsWithSimilarity.slice(0, 3);
      } else if (filteredResults.length === 0) {
        console.log('⚠️ 검색 결과가 전혀 없습니다.');
      }
      
      setSearchResults(finalResults);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ DB 검색 오류:', error);
      
      // 오류 시 빈 결과 표시
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  // 인증 로딩 중일 때
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </main>
    );
  }

  // 로그인하지 않은 사용자
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-white">
        <div className="min-h-full fixed inset-0 overflow-hidden -z-10 bg-white">
          <div className="absolute -bottom-[10%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />
          <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
        </div>
        
        <div className="ml-24 mr-20 mx-auto p-4 mt-20">
          <div className="flex items-center mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-black hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-black">탐색하기</h1>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-md">
              <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
              <p className="text-gray-600 mb-6">
                다른 사용자들의 알고리즘 프로필을 탐색하려면 먼저 로그인해주세요.
              </p>
              <Button 
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                로그인하러 가기
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-y-hidden">
      {isSearchMode && (
        <div className="min-h-full fixed inset-0 overflow-hidden -z-10 bg-white">
          <div className="absolute -bottom-[10%] -left-[10%] w-[90%] h-[60%] rounded-full bg-[#B3D4FF] blur-[120px] animate-blob" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[60%] rounded-full bg-[#6B7F99] blur-[120px] animate-blob animation-delay-20" />
          <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#6179A7] blur-[120px] animate-blob animation-delay-200" />
        </div>
      )}

      <div className="ml-24 mr-20 mx-auto p-4 mt-20">
        {/* 헤더 */}
        <div className="flex items-center mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
                className="text-black hover:bg-white/10"
              >
              <ArrowLeft className="h-4 w-4" />
              
            </Button>
          <h1 className="text-2xl font-bold text-black"> 탐색 결과: {searchResults.length}개</h1>
        </div>
        {show && (
        <div className="fixed top-22 right-10 bg-white/90 backdrop-blur-lg text-black px-7 py-3 rounded-full shadow-xl flex items-center min-w-[420px] max-w-[600px] z-50 animate-fadeIn">
          <span className="text-base flex items-center p-2 pr-3 pl-3">
            <img src="/images/cokieIcon.svg" alt="click" className="w-4 h-4 mr-4" />
            더 궁금하다면 이미지를 클릭해 자화상 전체를 구경할 수 있어요.
          </span>
          <button
            className="flex items-center justify-center top-2 right-3 text-black font-bold text-lg hover:text-blue-400 transition  
            rounded-full w-8 h-8 flex p-2" 
            onClick={() => setShow(false)}
            aria-label="안내 닫기"
            type="button"
          >
            ×
          </button>
        </div>
        )}
        {/* 검색 키워드 표시 */}
        <div className="mb-4 flex flex-row items-center gap-2">
          <div className="flex flex-wrap gap-3">
            
          </div>
          
        </div>
        
        {/* 검색 결과 */}
        <div className="mt-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
              <p className="text-black text-xl"> 당신과 비슷한 취향의 알고리즘 정체성 키워드를 찾고 있어요...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
            <h2 className="text-lg text-black/80  font-bold mb-1 flex flex-row items-center gap-2 ">
            
            
            다른 사람들의 자화상에서 
            {keywords.map((keyword, index) => (
              <div 
                key={index}
                className="bg-black/80 backdrop-blur-md px-4 py-1 rounded-full text-xs"
              >
                
                <span className="text-sm font-bold text-white">
                  #{keyword}
                </span>
              </div>
            ))}
            과 유사한 면모들을 찾았어요. <br/>

            </h2>
            <h2 className="text-lg text-black/80 font-bold mb-4 flex flex-row items-center gap-1 ">
            비슷한 취향을 가진 사람들의 페이지에 방문하여, 나와 닮은 점이나 새로운 관점을 발견해보세요.
            </h2>
            
            <CardStack3D 
            cards={searchResults}
            searchKeyword={keywords[0] || ''} // 첫번째 키워드만 사용
            />
            </> 
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-black/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black mb-2">아쉽게도 비슷한 취향을 가진 유저가 없습니다.</h3>
              <p className="text-black/70">다른 관심사를 선택해보거나 나중에 다시 시도해보세요</p>
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
