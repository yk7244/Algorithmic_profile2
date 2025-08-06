"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, Dispatch, SetStateAction, useMemo, useCallback, Suspense } from 'react';
import {DndContext} from '@dnd-kit/core';
import { restrictToContainer } from './Draggable/Hooks/Drag/useDragConstraints';
import { useSearchParams } from 'next/navigation';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
//Refactoring
import DraggableImage from './Draggable/DraggableImage';
import ColorPaletteBoard from './Edit/ColorPaletteBoard';
  import { useBgColor } from './Edit/Hooks/useBgColor';
import HistorySlider from './HistorySlider/HistorySlider';
import { useHistorySlider } from './HistorySlider/Hooks/useHistorySlider';
import { colorOptions } from './Edit/Hooks/colorOptions';
import SearchModeUI from '../search/SearchMode/SearchModeUI';
import { useSearchMode } from '../search/SearchMode/Hooks/useSearchMode';
import ProfileHeader from './Nickname/ProfileHeader';
import BottomActionBar from './Edit/BottomActionBar';
import { useMoodboardHandlers } from './useMoodboardHandlers';
import { useImageDelete } from "./Edit/Hooks/Image/useImageDelete";
import { useProfileImagesLoad } from '../utils/get/getImageData';     
import { arrangeImagesInCenter } from '../utils/autoArrange';
import { 
  ImageData,
  HistoryData,
  ProfileData,
} from '../types/profile';
import useAutoArrange from './Edit/Hooks/useAutoArrange';
import AutoArrangeButton from './Edit/AutoArrangeButton';
import SearchHeader from "../search/SearchMode/SearchHeader";
import { savePositions } from "./Edit/Hooks/savePosition";
import { getLatestProfileData } from "../utils/get/getProfileData";
import { Bell, ChevronDownIcon, ChevronUpIcon, EditIcon, Pen, SearchIcon, SparklesIcon } from "lucide-react";
import { AutoAwesome } from "@mui/icons-material";
import TaskGuide from "./Guide/TaskGuide";
import Tutorial from "./Tutorial/Tutorial";
import DragNotice from "./Guide/DragNotice";
import { getReflectionData } from "../utils/get/getReflectionData";
import { getUserData } from "../utils/get/getUserData";
import { supabase } from '@/lib/supabase-clean';
import { updateUserBackgroundColor } from '@/lib/database-clean';
// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function MyProfilePageContent() {
  const searchParams = useSearchParams();
  const [exploreAnimation, setExploreAnimation] = useState(false);
  // --- 상태 선언 ---
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);  
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const placeholderImage = "../../../public/images/default_image.png"
  const [showTutorial, setShowTutorial] = useState(false);
  const [reflectionData, setReflectionData] = useState<any>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  
  // 🎯 showTutorial 로직: 튜토리얼 완료 여부에 따라 결정
  useEffect(() => {
    const loadReflectionData = async () => {
      try {
        const data = await getReflectionData();
        setReflectionData(data);
        
        // ✅ 튜토리얼 완료된 경우: 튜토리얼 숨김
        // ❌ 튜토리얼 미완료 또는 null/undefined: 튜토리얼 표시
        const isTutorialCompleted = data?.tutorial === true;
        setShowTutorial(!isTutorialCompleted);
        
        console.log('🎯 튜토리얼 상태:', {
          tutorial: data?.tutorial,
          showTutorial: !isTutorialCompleted
        });
      } catch (error) {
        console.error('❌ Reflection 데이터 로드 오류:', error);
        // 에러 시 기본값: 튜토리얼 표시 (신규 사용자 가정)
        setShowTutorial(true);
      }
    };

    loadReflectionData();
  }, []);

    // 프로필 상태 - DB에서 비동기로 로드
  const [profile, setProfile] = useState({
    nickname: '',
    description: ''
  });
  // changeProfile 함수는 setProfile을 호출
  const changeProfile = (nickname: string, description: string) => {
    setProfile({ nickname, description });
    console.log('🔵profile',profile);
  };
  // 프로필 및 사용자 데이터 로드
  const [bgColor, setBgColor] = useState('#000000');
  
  // [새로고침시] refreshTrigger 설정
  const refreshTrigger = searchParams?.get('refresh') || searchParams?.get('upload_completed');
  
  // 프로필 데이터 로딩 (refreshTrigger 반응 + 무한루프 방지)
  useEffect(() => {
    const loadProfileAndUserData = async () => {
      try {
        console.log('🎯 프로필 데이터 로드 트리거:', refreshTrigger ? `새로고침(${refreshTrigger})` : '초기 로드');
        
        // DB에서 프로필 데이터 로드
        const latestProfile = await getLatestProfileData();
        if (latestProfile) {
          const profileData = {
            nickname: latestProfile.nickname || '',
            description: latestProfile.main_description || ''
          };
          setProfile(profileData);
          console.log('✅ 프로필 데이터 로드 완료:', {
            nickname: profileData.nickname,
            description: profileData.description,
            hasDescription: !!profileData.description
          });
        } else {
          console.warn('⚠️ 프로필 데이터를 찾을 수 없음, 빈 상태로 설정');
          setProfile({ nickname: '', description: '' });
        }

        // DB에서 사용자 데이터 로드 (배경색 포함)
        const userData = await getUserData();
        if (userData?.background_color) {
          setBgColor(userData.background_color);
          console.log('✅ 사용자 배경색 로드 완료:', userData.background_color);
        } else {
          console.warn('⚠️ 사용자 배경색을 찾을 수 없음, 기본값 유지');
        }

        // ✅ 데이터 로드 완료 후 refresh 파라미터 제거 (무한루프 방지)
        if (refreshTrigger) {
          console.log('🧹 refresh 파라미터 제거하여 무한루프 방지');
          const url = new URL(window.location.href);
          url.searchParams.delete('refresh');
          url.searchParams.delete('upload_completed');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (error) {
        console.error('❌ 프로필/사용자 데이터 로드 오류:', error);
        // 에러 시 기본값 설정
        setProfile({ nickname: '', description: '' });
        setBgColor('#000000');
      }
    };

    loadProfileAndUserData();
  }, [refreshTrigger]); // refreshTrigger 의존성 추가

  useEffect(() => {
    console.log('🔥 최신 profile 상태:', profile);
  }, [profile]);

  useEffect(() => {
    console.log('🔥 bgColor', bgColor);
  }, [bgColor]);

  // DB 연결된 배경색 변경 함수
  const handleBgColorChange = async (newBgColor: string) => {
    try {
      // DB에서 배경색 업데이트
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const success = await updateUserBackgroundColor(user.id, newBgColor);
        if (success) {
          setBgColor(newBgColor);
          console.log('✅ 배경색 DB 업데이트 완료:', newBgColor);
        } else {
          console.error('❌ 배경색 DB 업데이트 실패');
        }
      }
    } catch (error) {
      console.error('❌ 배경색 변경 오류:', error);
    }
  };

  // 히스토리 클릭 시 배경색 변경 콜백
  const handleHistoryBgColorChange = (bgColor: string) => setBgColor(bgColor);

  // [새로고침시] ProfileImages 로드 훅 사용
  useProfileImagesLoad({
    setImages: setImages as Dispatch<SetStateAction<ImageData[]>>,
    setVisibleImageIds,
    setFrameStyles,
    setPositions,
    placeholderImage,
    refreshTrigger: refreshTrigger || undefined,
  });

  // ✅ 업로드 완료 파라미터 감지해서 강제 새로고침
  useEffect(() => {
    const uploadCompleted = searchParams?.get('upload_completed');
    if (uploadCompleted === 'true') {
      console.log('🎯 업로드 완료 감지! 즉시 이미지 강제 새로고침 실행');
      
      // URL에서 파라미터 제거 (중복 실행 방지)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // 즉시 전체 데이터 강제 새로고침 (3초 간격으로 10번 시도)
      let refreshCount = 0;
      const forceRefresh = async () => {
        refreshCount++;
        console.log(`🔄 업로드 완료 후 전체 데이터 강제 새로고침 ${refreshCount}/10`);
        
        try {
          // ✅ 1. 프로필 정보 새로고침
          console.log('🔄 프로필 정보 새로고침 시도...');
          const { getActiveProfile } = await import('@/lib/database-clean');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const freshProfile = await getActiveProfile(user.id);
            if (freshProfile && freshProfile.nickname) {
              console.log('✅ 프로필 정보 새로고침 성공:', freshProfile.nickname);
              // ✅ main_description을 description으로 매핑
              setProfile({
                nickname: freshProfile.nickname,
                description: freshProfile.main_description || ''
              });
            } else {
              console.log('⚠️ 프로필 정보 아직 없음, 계속 시도...');
            }
          }
          
          // ✅ 2. 이미지 데이터 새로고침
          console.log('🔄 이미지 데이터 새로고침 시도...');
          const { getProfileImages } = await import('../utils/get/getImageData');
          const profileImages = await getProfileImages();
          
          if (profileImages && profileImages.length > 0) {
            console.log('✅ 업로드 완료 후 이미지 로드 성공!', profileImages.length, '개');
            setImages(profileImages);
            setIsLoadingImages(false);
            
            const visibleIds = new Set(profileImages.map(img => img.id).filter(Boolean));
            setVisibleImageIds(visibleIds);
            
            const frameStylesObj: Record<string, string> = {};
            profileImages.forEach(img => {
              if (img.id && img.frame_style) {
                frameStylesObj[img.id] = img.frame_style;
              }
            });
            setFrameStyles(frameStylesObj);
            
            const positionsObj: Record<string, {x: number, y: number}> = {};
            profileImages.forEach(img => {
              if (img.id && img.position) {
                positionsObj[img.id] = img.position;
              }
            });
            setPositions(positionsObj);
            
            console.log('🎉 업로드 완료 후 전체 데이터 로드 성공! 새로고침 종료');
            return; // 이미지 로드 성공하면 종료
          } else {
            console.log(`⚠️ 이미지 데이터 아직 없음 (${refreshCount}/10), 계속 시도...`);
          }
          
          // ✅ 최대 재시도 횟수 체크
          if (refreshCount < 10) {
            console.log(`🔄 ${refreshCount}/10 시도 완료, 3초 후 재시도...`);
            setTimeout(forceRefresh, 3000);
          } else {
            console.warn('⚠️ 업로드 완료 후 데이터 로드 최대 재시도 횟수 도달. 수동 새로고침이 필요할 수 있습니다.');
          }
        } catch (error) {
          console.error(`❌ 업로드 완료 후 강제 새로고침 실패 (${refreshCount}/10):`, error);
          if (refreshCount < 10) {
            console.log(`🔄 에러 발생, 3초 후 재시도... (${refreshCount}/10)`);
            setTimeout(forceRefresh, 3000);
          }
        }
      };
      
      // 즉시 첫 번째 시도
      forceRefresh();
    }
  }, [searchParams, setImages, setVisibleImageIds, setFrameStyles, setPositions]);

  // 이미지 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (images.length > 0) {
        setIsLoadingImages(false);
      }
    }, 1000); // 1초 후 체크

    return () => clearTimeout(timer);
  }, [images]);

  // 이미지가 로드되면 로딩 상태 해제
  useEffect(() => {
    if (images.length > 0) {
      setIsLoadingImages(false);
    } else {
      // 6초 후에도 이미지가 없으면 로딩 해제 (실제로 데이터가 없는 것으로 간주)
      const timeout = setTimeout(() => {
        setIsLoadingImages(false);
      }, 6000);
      
      return () => clearTimeout(timeout);
    }
  }, [images]);

  const historySlider = useHistorySlider({
    images: images as ImageData[],
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
    placeholderImage,
    onHistoryBgColorChange: handleHistoryBgColorChange,
    originalBgColor: bgColor || 'bg-[#F2F2F2]',
    changeProfile, // changeProfile을 넘김
  });
  const {
    histories: sliderHistories,
    setHistories: setSliderHistories,
    currentHistoryIndex: sliderCurrentHistoryIndex,
    setCurrentHistoryIndex: setSliderCurrentHistoryIndex,
    isPlaying: sliderIsPlaying,
    setIsPlaying: setSliderIsPlaying,
    handleHistoryClick,
    handlePlayHistory,
  } = historySlider;

  const {
    handleFrameStyleChange,
    handleSave,
    handleDragEnd,
    handleImageChange,
    generateProfile,
  } = useMoodboardHandlers({
    setFrameStyles,
    positions,
    frameStyles,
    images,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setIsEditing,
    isEditing,
    setPositions,
    setImages,
    openai,
    setShowGeneratingDialog,
    setGeneratingStep,
    setProfile,
    // changeProfile은 넘기지 않음 (setProfile만 넘김)
  });

  const {
    isSearchMode,
    selectedImage,
    selectedImages,
    handleImageSelect,
    toggleSearchMode,
    handleSearch,
    setSelectedImage,
    setSelectedImages,
    setIsSearchMode,
  } = useSearchMode(images as ImageData[]); 

  const handleImageDelete = useImageDelete({
    images,
    setImages: setImages as Dispatch<SetStateAction<ImageData[]>>,
    positions,
    frameStyles,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setVisibleImageIds,
  });

  const boardRef = useRef<HTMLDivElement>(null);

  const handleAutoArrange = useAutoArrange({
    boardRef,
    images,
    setPositions,
    arrangeImagesInCenter,
  });


  // 초기 위치 설정
  useEffect(() => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      const imageIdSet = new Set(images.map(img => img.id).filter(id => id)); // undefined 제거

      // images 배열에 있는 각 이미지에 대해
      images.forEach(image => {
        // id가 없으면 건너뛰기
        if (!image.id) return;
        
        // positions에 해당 이미지가 없으면 초기 위치 설정
        if (!newPositions[image.id]) {
          newPositions[image.id] = {
            x: Number(image.left?.replace('px', '') || 0),
            y: Number(image.top?.replace('px', '') || 0),
          };
          //console.log('newPositions', newPositions);
        }
      });

      // positions에 있지만 현재 images 배열에는 없는 이미지 정보 삭제
      for (const id in newPositions) {
        if (!imageIdSet.has(id)) {
          delete newPositions[id];
        }
      }
      return newPositions;
    });
  }, [images]);

  // explore=1 쿼리 감지 시 5초간 탐색모드 애니메이션
  useEffect(() => {
    if (searchParams.get('explore') === '1') {
      setIsSearchMode(true);
      setExploreAnimation(true);

      const timer = setTimeout(() => {
        setExploreAnimation(false);
        // setIsSearchMode(false); // 필요시 탐색모드 해제
      }, 10000);
      return () => clearTimeout(timer);
    }else{
      setIsSearchMode(false);
    }
  }, [searchParams]);

  //새로고침 시 배경 색 변경
  
useEffect(() => {
  console.log(bgColor);
}, [bgColor]);

  return (
    <div className={`relative ${!isSearchMode ? 'bg-white' : ''}`}>
      {/* 검색 모드일 때 배경 그라데이션 추가 */}
      {!isSearchMode && (
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[10%] left-[10%] w-[40%] h-[30%] rounded-full blur-[130px] animate-blob"
          style={{
            backgroundColor: bgColor,
          }}
          />
          <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full blur-[130px] animate-blob animation-delay-20"
          style={{
            backgroundColor: bgColor,
          }} />
          
        </div>
      )}
      
      <div className={`z-20 grid grid-cols-[minmax(300px,360px)_1fr] w-screen h-screen overflow-y-hidden transform transition-all duration-1000 ease-in-out`}>
        
        
        {/* 왼쪽: 프로필/설명/닉네임 등 */}
        <div className={`z-30`}>
          {!isSearchMode ? ( 
            <ProfileHeader
              profile={profile}
              changeProfile={changeProfile}
              isEditing={isEditing}
              isGeneratingProfile={showGeneratingDialog}
              onEditClick={() => setIsEditing(true)}
              onSaveClick={() => savePositions(images, positions)}
              onGenerateProfile={generateProfile}
              isSearchMode={isSearchMode}
            />
          ):(
              <>
              <SearchHeader onBack={() => setIsSearchMode(false)} />
              </>
          )}
        </div>
        {/* 오른쪽: 무드보드/이미지/카드 등 */}
        <div className={`relative flex flex-col h-full w-full } ${exploreAnimation ? 'animate-fadeIn' : ''}`} ref={boardRef}>
          {/* 튜토리얼 영역 */}
          <Tutorial 
            show={showTutorial} 
            onClose={async () => {
              console.log('🎯 튜토리얼 완료 - 상태 업데이트 중...');
              setShowTutorial(false);
              // 튜토리얼 완료 후 reflectionData 새로고침
              const updatedData = await getReflectionData();
              setReflectionData(updatedData);
              console.log('✅ 튜토리얼 완료 - 상태 업데이트 완료');
            }}
          />  
          {/* 나머지 메인 UI는 튜토리얼이 닫혔을 때만 렌더링 */}

            <>
              
              {!showTutorial && !isSearchMode && (
                <>
                  {/* 가이드 안내 영역 */}
                    <TaskGuide 
                    isSearchMode={isSearchMode} 
                  />
                </>

              )}

              

              {/* 검색 모드 UI -> SearchModeUI.tsx */}
              <SearchModeUI
                isSearchMode={isSearchMode}
                selectedImage={selectedImage}
                selectedImages={selectedImages}
                handleSearch={handleSearch}
                toggleSearchMode={toggleSearchMode}
                setIsSearchMode={setIsSearchMode}
              />

              {/* My_profile 페이지 이미지레이아웃 */}
              <div className="flex-1 flex flex-col items-center justify-start w-full">
                <div className="fixed w-full h-full mx-auto mt-8">
                  {images.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        {isLoadingImages ? (
                          <>
                            <div className="mb-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
                            </div>
                            <p className="text-sm">프로필을 불러오는 중...</p>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                                <span className="text-2xl">🎨</span>
                              </div>
                            </div>
                            <p className="text-lg font-medium mb-2 text-gray-600">아직 프로필이 생성되지 않았습니다</p>
                            <p className="text-sm text-gray-500">업로드를 통해 나만의 알고리즘 자화상을 만들어보세요</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <DndContext
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToContainer]}
                    >
                      {images.map((image) => (
                      <div
                        key={image.id || Math.random().toString()}
                        className={`transition-all duration-500 ${
                          isEditing || (image.id && visibleImageIds.has(image.id))
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                      >
                        <DraggableImage
                          image={image}
                          position={positions[image.id] || image.position}
                          isEditing={isEditing && !isSearchMode}
                          frameStyle={image.desired_self ? 'cokie' : (frameStyles[image.id] || 'normal')}
                          onFrameStyleChange={handleFrameStyleChange}
                          onImageChange={handleImageChange}
                          onImageSelect={handleImageSelect}
                          isSelected={selectedImages.some(img => img.id === image.id)}
                          isSearchMode={isSearchMode}
                          onImageDelete={handleImageDelete}
                          profile={profile}
                        />
                      </div>
                    ))}
                    </DndContext>
                  )}
                </div>
                {/* 자동 정렬 버튼 (편집 모드일 때만 표시) */}
                <AutoArrangeButton 
                  isEditing={isEditing}
                  onAutoArrange={handleAutoArrange}
                />
                <DragNotice 
                  showDragNotice={!showTutorial}
                  isEditing={isEditing}
                  isSearchMode={isSearchMode}
                />
              </div>
              {/* 히스토리 슬라이더 (검색 모드가 아닐 때만 표시)->HistorySlider.tsx */}
              {!isEditing && !isSearchMode && (
                <div className="w-full">
                  <HistorySlider
                    histories={sliderHistories}
                    currentHistoryIndex={sliderCurrentHistoryIndex}
                    isPlaying={sliderIsPlaying}
                    handlePlayHistory={handlePlayHistory}
                    handleHistoryClick={handleHistoryClick}
                    changeProfile={changeProfile}
                  />
                </div>
              )}
              {/* 컬러 팔레트 보드 (편집 모드일 때만 표시)->ColorPaletteBoard.tsx */}
              {isEditing && !isSearchMode && (
                <ColorPaletteBoard
                  bgColor={bgColor}
                  onChange={handleBgColorChange}
                />
              )}
              {/* 액션 버튼들 - 검색 모드가 아닐 때만 표시 */}
              {!isSearchMode && !showTutorial && (
                <BottomActionBar
                  isEditing={isEditing}
                  isGeneratingProfile={showGeneratingDialog}
                  onEditClick={() => setIsEditing(true)}
                  images={images}
                  positions={positions}
                  onGenerateProfile={generateProfile}
                  sliderCurrentHistoryIndex={sliderCurrentHistoryIndex}
                  isSearchMode={isSearchMode}
                  toggleSearchMode={toggleSearchMode}
                  offEditClick={() => setIsEditing(false)}
                />
              )}
            </>
          
        </div>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <MyProfilePageContent />
    </Suspense>
  );
} 