"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";


import { ImageData } from '@/app/types/profile';
import CardStack3D from './SearchMode/showCard';      
import { useAuth } from '@/context/AuthContext';
import { getAllPublicImages, searchImagesByKeyword, getActiveUserImages, convertDBImagesToLocalStorage } from '@/lib/database-clean';
import { addSimilarityScores } from '@/lib/similarity';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keywordsBySize, setKeywordsBySize] = useState<{ big: string[], mid: string[], small: string[], ds: string[] }>({ big: [], mid: [], small: [], ds: [] });
  // 유상님✅ 더미 데이터로 가져온 이미지들 그냥 검색 결과에 다 ImageData[] 형태로 저장
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(true);
  const [show, setShow] = useState(true); // 안내 문구 표시 여부
  const [isKeywordPanelOpen, setIsKeywordPanelOpen] = useState(true); // 키워드 패널 열림/닫힘
    
  useEffect(() => {
    (async () => {
      if (!isLoggedIn || !user?.id) {
        setIsLoading(false);
        return;
      }
      // 1. 내 이미지 + 선택 클러스터 (keywords[0] 기준)
      const { userImages, selectedCluster } = await getUserImageData(
        user.id,
        keywords[0] || ''    // 없으면 '' 전달됨
      );
  
      // 2 영향도별 키워드 묶기
      const kbs = getKeywordsBySize(userImages);
      setKeywordsBySize(kbs);

      //3. 전체 이미지 데이터 받아오기
      const filteredUniqueImages = await getAllImages();
  
      // 4. 키워드가 있으면 검색
      if (keywords.length > 0) {
        await KeywordSearch(selectedCluster, filteredUniqueImages ); // 기존 함수 그대로 호출
      } else {
        setIsLoading(false);
      }
    })();
    // keywords가 바뀔 때 재실행 (※ 필요에 따라 디바운스/최신요청 가드 추가 가능)
  }, [isLoggedIn, user?.id, keywords.join(',')]);
  
  // 1. 현재 사용자 이미지 + 선택 클러스터 추출
  const getUserImageData = async (

    currentUserId: string,
    selectedKeyword: string
  ): Promise<{ userImages: ImageData[]; selectedCluster: ImageData | null }> => {
    // ❗ try 바깥에서 먼저 선언/초기화
    let userImages: ImageData[] = [];
    let selectedCluster: ImageData | null = null;

    if (!currentUserId) {
      return { userImages, selectedCluster };
    }

    try {
      const activeRows = await getActiveUserImages(currentUserId); // DB rows

      // rows → ImageData 매핑
      userImages = activeRows.map((r) => ({
        id: r.id,
        src: r.image_url || '',
        main_keyword: r.main_keyword || '',
        keywords: r.keywords || [],
        mood_keyword: r.mood_keyword || '',
        description: r.description || '',
        category: r.category || '',
        user_id: r.user_id,
        sizeWeight: r.size_weight || 1,
        frameStyle: r.frame_style || 'normal',
        left: r.css_left || '0px',
        top: r.css_top || '0px',
        position: { x: r.position_x || 0, y: r.position_y || 0 },
        relatedVideos: r.related_videos || [],
        desired_self: r.desired_self || false,
        desired_self_profile: r.desired_self_profile || null,
        metadata: r.metadata || {},
        rotate: r.rotate || 0,
        width: r.width || 200,
        height: r.height || 200,
        created_at: r.created_at,
      }));

      console.log('🔍 현재 사용자 이미지 데이터:', userImages);

      // 키워드 매칭 (빈 키워드 방지 + 해시 제거)
      const key = (selectedKeyword || '').replace(/^#/, '').trim().toLowerCase();
      if (key.length > 0) {
        const matched = userImages.find(
          (img) =>
            (img.main_keyword || '').toLowerCase().includes(key) ||
            (img.keywords || []).some((k) => (k || '').toLowerCase().includes(key))
        );
        selectedCluster = matched ?? null;
      } else {
        selectedCluster = null;
      }

      console.log('🔍 선택된 클러스터:', selectedCluster);
    } catch (e) {
      console.error('getUserImageData error:', e);
      // activeImgs는 [] 유지, selectedCluster는 null 유지
    }

    return { userImages, selectedCluster };
  };
  // 2 sizeWeight별 키워드 분류
  const getKeywordsBySize = (userImageData: ImageData[]) => {
    const big: string[] = [];
    const mid: string[] = [];
    const small: string[] = [];
    const ds: string[] = [];

    if(userImageData.length > 0) {
      userImageData.forEach(img => {
        if(img.desired_self) {
          ds.push(img.main_keyword);
        }else{
          if (img.sizeWeight > 0.027) {
            big.push(img.main_keyword);
          } else if (img.sizeWeight > 0.02) {
            mid.push(img.main_keyword);
          } else {
            small.push(img.main_keyword);
          }
        }
      });
    }

    return {
      big,   // 큰 영향 키워드 배열
      mid,   // 중간 영향 키워드 배열
      small,  // 작은 영향 키워드 배열
      ds,     // 원하는 자신 키워드 배열
    };
  };
  // 3. 전체 이미지 데이터 받아오기 (DB → ImageData[])
  const getAllImages = async (): Promise<ImageData[]> => {
    const currentUserId = user?.id; // ✅ 현재 사용자 ID

    // 여기에 최종적으로 반환할 이미지 배열 선언
    let allPublicImages: ImageData[] = [];

    // 🔍 전체 공개 이미지 (필터 없이)
    const baseImagesRaw = await getAllPublicImages(100); 
    console.log('🔍 전체 공개 이미지 수 (필터 없음):', baseImagesRaw.length);

    if (keywords.length > 0) {
      // 키워드별로 검색 (현재 사용자 제외)
      for (const keyword of keywords) {
        console.log(`🔍 키워드 "${keyword}" 검색 중...`);
        const keywordImagesRaw = await searchImagesByKeyword(keyword.trim(), 20, currentUserId);
        console.log(`🔍 키워드 "${keyword}" 검색 결과:`, keywordImagesRaw.length, '개');
        
        const keywordImages = convertDBImagesToLocalStorage(keywordImagesRaw);
        allPublicImages = [...allPublicImages, ...keywordImages];
      }

      // ✅ 키워드 검색 결과가 없으면 전체 공개 이미지 가져오기 (fallback)
      if (allPublicImages.length === 0) {
        console.log('⚠️ 키워드 검색 결과가 없어 전체 공개 이미지를 가져옵니다.');
        const fallbackImagesRaw = await getAllPublicImages(50, currentUserId);
        allPublicImages = convertDBImagesToLocalStorage(fallbackImagesRaw);
        console.log(`🔍 Fallback: 전체 공개 이미지 ${allPublicImages.length}개 조회됨`);
      }
    } else {
      // 키워드가 없으면 모든 공개 이미지 가져오기 (현재 사용자 제외)
      const allImagesRaw = await getAllPublicImages(50, currentUserId);
      allPublicImages = convertDBImagesToLocalStorage(allImagesRaw);
    }

    console.log('🔍 중복 제거 전 총 이미지 수:', allPublicImages.length);

    // 3. 중복 이미지 제거
    const uniqueImages = allPublicImages.filter(
      (image, index, self) => index === self.findIndex(i => i.id === image.id)
    );
    console.log('🔍 중복 제거 후 총 이미지 수:', uniqueImages.length);

    // 4. ✅ 현재 사용자 클러스터 제거
    const filteredUniqueImages = uniqueImages.filter(img => {
      const isOwnCluster = img.user_id === currentUserId;
      if (isOwnCluster) {
        console.log(`⚠️ 현재 사용자의 클러스터 제거: ${img.main_keyword} (${img.user_id})`);
      }
      return !isOwnCluster;
    });
    console.log(`🔍 현재 사용자 제외 후: ${uniqueImages.length}개 → ${filteredUniqueImages.length}개`);

    return filteredUniqueImages;
  };
  // 4. 검색 로직 구현
  const KeywordSearch = async (seletedCluster: ImageData | null, filteredUniqueImages: ImageData[]) => {
    try {
      let searchResultsWithSimilarity: ImageData[] = [];
      if (seletedCluster && filteredUniqueImages.length > 0) {
        try {
            // 다른 사람들 꺼
            const convertedResults = filteredUniqueImages;
            // 5-4. 유사도 계산 및 정렬
            console.log('🔍 유사도 계산 시작...');
            setIsLoading(true);
            searchResultsWithSimilarity = await addSimilarityScores(seletedCluster, convertedResults);

            console.log('✅ 유사도 계산 완료. 상위 결과들:', 
              searchResultsWithSimilarity.slice(0, 3).map(r => ({
                keyword: r.main_keyword,
                similarity: (r.similarity || 0).toFixed(3)
              }))
            );
        } catch (error) {
          console.error('❌ 유사도 계산 중 오류:', error);
          // filteredUniqueImages는 이미 ImageData[] 형식으로 변환됨
          searchResultsWithSimilarity = filteredUniqueImages;
        }
      } else {
        searchResultsWithSimilarity = filteredUniqueImages;
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
  }

  // (원래 함수)DB에서 공개 사용자 프로필 검색 - 인증된 사용자만 검색 결과 표시
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

      // 1. DB에서 공개된 사용자 이미지들 검색 (현재 사용자 제외)
      let allPublicImages: ImageData[] = [];
      const currentUserId = user?.id; // ✅ 현재 사용자 ID
      const allImagesWithoutFilter = await getAllPublicImages(100); // 필터 없이
      console.log('🔍 전체 공개 이미지 수 (필터 없음):', allImagesWithoutFilter.length);
      
      //2. 키워드별로 검색
      if (searchKeywords.length > 0) {
        // 키워드별로 검색 (현재 사용자 제외)
        for (const keyword of searchKeywords) {
          console.log(`🔍 키워드 "${keyword}" 검색 중...`);
          const keywordImagesRaw = await searchImagesByKeyword(keyword.trim(), 20, currentUserId);
          console.log(`🔍 키워드 "${keyword}" 검색 결과:`, keywordImagesRaw.length, '개');
          // ImageRow[]를 ImageData[]로 변환
          const keywordImages = convertDBImagesToLocalStorage(keywordImagesRaw);
          allPublicImages = [...allPublicImages, ...keywordImages];
        }
        
        // ✅ 키워드 검색 결과가 없으면 전체 공개 이미지 가져오기 (fallback)
        if (allPublicImages.length === 0) {
          console.log('⚠️ 키워드 검색 결과가 없어 전체 공개 이미지를 가져옵니다.');
          const fallbackImagesRaw = await getAllPublicImages(50, currentUserId);
          allPublicImages = convertDBImagesToLocalStorage(fallbackImagesRaw);
          console.log(`🔍 Fallback: 전체 공개 이미지 ${allPublicImages.length}개 조회됨`);
        }
      } else {
        // 키워드가 없으면 모든 공개 이미지 가져오기 (현재 사용자 제외)
        const allImagesRaw = await getAllPublicImages(50, currentUserId); // 최대 50개
        allPublicImages = convertDBImagesToLocalStorage(allImagesRaw);
      }
      console.log('🔍 중복 제거 전 총 이미지 수:', allPublicImages.length);

      // 3. 중복 이미지 제거
      const uniqueImages = allPublicImages.filter((image, index, self) => 
        index === self.findIndex(i => i.id === image.id)
      );
      console.log('🔍 중복 제거 후 총 이미지 수:', uniqueImages.length);
      console.log('🔍 검색 결과 사용자 ID들:', uniqueImages.map(img => ({
        id: img.id,
        user_id: img.user_id,
        main_keyword: img.main_keyword
      })));
     // 4. ✅ 추가 안전장치: 현재 사용자의 클러스터 강제 제거
      const filteredUniqueImages = uniqueImages.filter(img => {
        const isOwnCluster = img.user_id === currentUserId;
        if (isOwnCluster) {
          console.log(`⚠️ 현재 사용자의 클러스터 제거: ${img.main_keyword} (${img.user_id})`);
        }
        return !isOwnCluster;
      });
      console.log(`🔍 현재 사용자 제외 후: ${uniqueImages.length}개 → ${filteredUniqueImages.length}개`);

      // 5. ✅ 유사도 계산: 사용자가 선택한 클러스터 찾기
      let searchResultsWithSimilarity: ImageData[] = [];
      
      if (searchKeywords.length > 0 && filteredUniqueImages.length > 0) {
        try {
          // 5-1.사용자의 현재 활성 이미지들에서 선택한 클러스터 찾기
          console.log('🔍 사용자의 클러스터 찾는 중...');
          const userImages = await getActiveUserImages(currentUserId || '');
          console.log('🔍 사용자의 활성 이미지 수:', userImages.length);
          
          // 5-2. 검색 키워드와 일치하는 사용자의 클러스터 찾기
          const selectedKeyword = searchKeywords[0]; // 첫 번째 키워드 사용
          const selectedCluster = userImages.find(img => 
            img.main_keyword?.toLowerCase().includes(selectedKeyword.toLowerCase()) ||
            (img.keywords && img.keywords.some(k => k.toLowerCase().includes(selectedKeyword.toLowerCase())))
          );

          if (selectedCluster) {
            console.log('✅ 선택된 클러스터 찾음:', selectedCluster.main_keyword);
            
            // 5-3. DB 형식을 ImageData 형식으로 변환
            const selectedClusterData: ImageData = {
              id: selectedCluster.id,
              src: selectedCluster.image_url || '',
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
              position: { 
                x: selectedCluster.position_x || 0, 
                y: selectedCluster.position_y || 0 
              },
              relatedVideos: selectedCluster.related_videos || [],
              desired_self: selectedCluster.desired_self || false,
              desired_self_profile: selectedCluster.desired_self_profile || null,
              metadata: selectedCluster.metadata || {},
              rotate: selectedCluster.rotate || 0,
              width: selectedCluster.width || 200,
              height: selectedCluster.height || 200,
              created_at: selectedCluster.created_at
            };

            // filteredUniqueImages는 이미 ImageData[] 형식으로 변환됨
            // 다른 사람들 꺼
            const convertedResults = filteredUniqueImages;

            // 5-4. 유사도 계산 및 정렬
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
            // filteredUniqueImages는 이미 ImageData[] 형식으로 변환됨
            searchResultsWithSimilarity = filteredUniqueImages;
          }
        } catch (error) {
          console.error('❌ 유사도 계산 중 오류:', error);
          // filteredUniqueImages는 이미 ImageData[] 형식으로 변환됨
          searchResultsWithSimilarity = filteredUniqueImages;
        }
      } else {
        // uniqueImages는 이미 ImageData[] 형식으로 변환됨
        searchResultsWithSimilarity = uniqueImages;
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
        {/* 헤더 
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
        */}
        {/* 키워드 선택 패널 */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/60 via-slate-800/40 to-slate-900/40 shadow-xl backdrop-blur-xl p-5 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center justify-between gap-2 mb-2">
            <span>내 키워드 선택</span>
            <button
              onClick={() => setIsKeywordPanelOpen((prev) => !prev)}
              className="text-xs px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 transition"
              type="button"
            >
              {isKeywordPanelOpen ? "접기 ▲" : "펼치기 ▼"}
            </button>
          </h2>
          {/* 패널 내용 토글 */}
          {isKeywordPanelOpen && (
            <>
              <p className="text-md text-slate-300 mb-6">
              💡 키워드를 선택하면, 나와 유사한 익명의 알고리즘을 확인할 수 있어요.
              </p>

              <div className="flex flex-row items-left gap-6">
                {/* 큰 영향 */}
                <div className="mb-4">
                  {/* 큰 영향 키워드 설명 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold mr-1">큰 영향</span>
                      <span className="text-slate-400">·</span>
                      <span className="ml-2 text-slate-300">누적 시청 비중 높음</span>
                    </p>
                  </div>
                  {/* 큰 영향 키워드 목록 */}
                  <div className="flex flex-wrap gap-2.5">
                    {keywordsBySize.big.map((kw, idx) => {
                      const isSelected = keywords.includes(kw);
                      return (
                        <div
                          key={kw + idx}
                          className={
                            "px-3 py-2 rounded-full text-sm font-medium cursor-pointer hover:shadow transition " +
                            (isSelected
                              ? "bg-black text-white"
                              : "bg-white/90 text-slate-900")
                          }
                          onClick={() => setKeywords([kw])}
                        >
                          {kw}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 중간 영향 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold mr-1">중간 영향</span>
                      <span className="text-slate-400">·</span>
                      <span className="ml-2 text-slate-300">누적 시청 비중 보통</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {keywordsBySize.mid.map((kw, idx) => {
                      const isSelected = keywords.includes(kw);
                      return (
                        <div
                          key={kw + idx}
                          className={
                            "px-3 py-2 rounded-full text-sm font-medium cursor-pointer hover:shadow transition " +
                            (isSelected
                              ? "bg-black text-white"
                              : "bg-white/90 text-slate-900")
                          }
                          onClick={() => setKeywords([kw])}
                        >
                          {kw}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 작은 영향 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold mr-1">작은 영향</span>
                      <span className="text-slate-400">·</span>
                      <span className="ml-2 text-slate-300">누적 시청 비중 적음</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {keywordsBySize.small.map((kw, idx) => {
                      const isSelected = keywords.includes(kw);
                      return (
                        <div
                          key={kw + idx}
                          className={
                            "px-3 py-2 rounded-full text-sm font-medium cursor-pointer hover:shadow transition " +
                            (isSelected
                              ? "bg-black text-white"
                              : "bg-white/90 text-slate-900")
                          }
                          onClick={() => setKeywords([kw])}
                        >
                          {kw}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-left gap-1 mt-4">
                <div className="  flex items-center gap-2 mb-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold mr-1">추가한 키워드</span>
                    <span className="text-slate-400">·</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                {keywordsBySize.ds.map((kw, idx) => {
                  const isSelected = keywords.includes(kw);
                  return (
                    <div key={kw + idx} className={
                      "px-3 py-2 rounded-full text-sm font-medium cursor-pointer hover:shadow transition " +
                      (isSelected
                        ? "bg-black text-white"
                        : "bg-white/90 text-slate-900")
                    }
                    onClick={() => setKeywords([kw])}
                    >
                      {kw}
                    </div>
                  );
                })}
                </div>  
              </div>
            </>
          )}
        </div>


        {/* 안내 문구 */}
        {show && searchResults.length > 0 && (
        <div className="fixed top-22 right-10 bg-white/90 backdrop-blur-lg text-black px-7 py-3 rounded-full shadow-xl flex items-center min-w-[420px] max-w-[600px] z-50 animate-fadeIn">
          <span className="text-base flex items-center p-2 pr-3 pl-3">
            <img src="/images/cokieIcon.svg" alt="click" className="w-4 h-4 mr-4" />
            더 궁금하다면 이미지를 클릭해 시각화 전체를 구경할 수 있어요.
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
              <p className="text-black text-xl"> 당신과 비슷한 취향의 알고리즘 키워드를 찾고 있어요...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
            <h2 className="text-lg text-black/80  font-bold mb-1 flex flex-row items-center gap-2 ">
            
            
            다른 사람들의 알고리즘에서 
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
            과 유사한 키워드들을 
            <span className="text-blue-500 font-bold">{searchResults.length}개</span> 찾았어요. <br/>

            </h2>
            <h2 className="text-lg text-black/80 font-bold mb-4 flex flex-row items-center gap-1 ">
            비슷한 취향을 가진 사람들의 알고리즘을 확인하고, 나와 닮은 점이나 새로운 컨텐츠들을 발견해보세요.
            </h2>
            
            <CardStack3D 
            cards={searchResults}
            searchKeyword={keywords[0] || ''} // 첫번째 키워드만 사용
            />
            </> 
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-black/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black mb-2">탐색할 키워드를 선택해주세요</h3>
              <p className="text-black/70">키워드를 선택하면, 나와 유사한 익명의 알고리즘을 확인할 수 있어요.</p>
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
