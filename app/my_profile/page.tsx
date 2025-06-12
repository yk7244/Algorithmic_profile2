"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {DndContext} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { restrictToContainer } from './Draggable/Hooks/Drag/useDragConstraints';

//Refactoring
import DraggableImage from './Draggable/DraggableImage';
import ColorPaletteBoard from './CustomEdit/ColorPaletteBoard';
import { useBgColor } from './CustomEdit/hooks/useBgColor';
import HistorySlider from './HistorySlider/HistorySlider';
import GeneratingDialog from './GeneratingDialog/GeneratingDialog';
import { useHistorySlider } from './HistorySlider/Hooks/useHistorySlider';
import { colorOptions } from './CustomEdit/hooks/colorOptions';
import SearchModeUI from '../search/SearchMode/SearchModeUI';
import { useSearchMode } from '../search/SearchMode/Hooks/useSearchMode';
import ProfileHeader from './Nickname/ProfileHeader';
import SearchFloatingButton from '../search/SearchMode/SearchFloatingButton';
import BottomActionBar from './Edit/BottomActionBar';
import { useMoodboardHandlers } from './useMoodboardHandlers';
import { useImageDelete } from "./Draggable/Hooks/Image/useImageDelete";
import { useProfileStorage } from './Nickname/Hooks/useProfileStorage';
import { useProfileImagesLoad } from './HistorySlider/Hooks/useProfileImagesLoad';
import { useInitialProfileLoad } from './Nickname/Hooks/useInitialProfileLoad';
import { 
  ImageData,
  HistoryData,
} from '../types/profile';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function MyProfilePage() {
  // --- 상태 선언 ---
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState({ nickname: '', description: '' });
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const { bgColor, handleBgColorChange } = useBgColor();
  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);  
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const placeholderImage = "../../../public/images/default_image.png"
  
  // [새로고침시] ProfileImages 로드 훅 사용
  useProfileImagesLoad({
    setImages: setImages as Dispatch<SetStateAction<ImageData[]>>,
    setVisibleImageIds,
    setFrameStyles,
    setPositions,
    placeholderImage,
  });

  const historySlider = useHistorySlider({
    images: images as ImageData[],
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
    placeholderImage,
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
    isTransitioning: sliderIsTransitioning,
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

  // localStorage 프로필 관리 훅 사용
  const { loadProfileFromStorage, isProfileExpired } = useProfileStorage();

  // 🆕 DB-first 프로필 데이터 로딩
  useEffect(() => {
    const loadLatestProfile = async () => {
      try {
        const latestProfile = await loadProfileFromStorage();
        if (latestProfile) {
          setProfile({
            nickname: latestProfile.nickname,
            description: latestProfile.description
          });
          console.log('[MyProfile] 최신 프로필 로드 완료:', latestProfile);
        }
      } catch (error) {
        console.error('[MyProfile] 프로필 로드 실패:', error);
      }
    };

    loadLatestProfile();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 🆕 개발용: localStorage 강제 정리 함수 (콘솔에서 호출 가능)
  useEffect(() => {
    // @ts-ignore - 개발용 전역 함수
    window.clearAllTubeLensData = async () => {
      console.log('🧹 TubeLens 모든 데이터 정리 시작...');
      
      // localStorage 모든 관련 키 정리
      const allKeys = Object.keys(localStorage);
      const tubeLensKeys = allKeys.filter(key => 
        key.includes('profileImages') || 
        key.includes('moodboardHistories') || 
        key.includes('SliderHistory') || 
        key.includes('exploreWatchHistory') || 
        key.includes('watchHistory') || 
        key.includes('ProfileData') ||
        key.includes('moodboard-bg-color')
      );
      
      tubeLensKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`삭제: ${key}`);
      });
      
      // 상태 초기화
      setImages([]);
      setVisibleImageIds(new Set());
      setFrameStyles({});
      setPositions({});
      setHistories([]);
      setCurrentHistoryIndex(-1);
      
      console.log('✅ TubeLens 모든 데이터 정리 완료!');
      console.log('새로고침하여 확인하세요.');
    };
    
    console.log('💡 개발용: window.clearAllTubeLensData() 함수가 등록되었습니다.');
  }, []);

  //새로고침시 별명 생성/로드 훅 사용
  useInitialProfileLoad({
    loadProfileFromStorage,
    isProfileExpired,
    generateProfile,
    setProfile,
  });

  // 🆕 frameStyles 상태 디버깅
  useEffect(() => {
    console.log('[MyProfile] frameStyles 상태 변경:', frameStyles);
  }, [frameStyles]);

  // 🆕 positions 동기화 최적화 - 중복 업데이트 방지
  useEffect(() => {
    if (images.length === 0) return; // 이미지가 없으면 스킵
    
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      let hasChanges = false;
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
          hasChanges = true;
        }
      });

      // positions에 있지만 현재 images 배열에는 없는 이미지 정보 삭제
      for (const id in newPositions) {
        if (!imageIdSet.has(id)) {
          delete newPositions[id];
          hasChanges = true;
        }
      }
      
      // 변경사항이 있을 때만 새 객체 반환
      return hasChanges ? newPositions : prevPositions;
    });
  }, [images]); // images가 변경될 때만 실행

  return (
    <main className={`fixed inset-0 overflow-y-auto transition-colors duration-500 ${bgColor}`}>
      {/* 생성 중 다이얼로그 -> GeneratingDialog.tsx 
      <GeneratingDialog
        open={showGeneratingDialog}
        onOpenChange={setShowGeneratingDialog}
        generatingStep={generatingStep}
      />
      */}

      {/* 검색 모드 UI -> SearchModeUI.tsx */}
      <SearchModeUI
        isSearchMode={isSearchMode}
        selectedImage={selectedImage}
        selectedImages={selectedImages}
        handleSearch={handleSearch}
        toggleSearchMode={toggleSearchMode}
        setIsSearchMode={setIsSearchMode}
      />

      {/* My_profile 페이지 레이아웃 */}
      <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto ">

          {/* 닉넴/설명/버튼 헤더 분리 -> ProfileHeader.tsx */}
          {!isSearchMode && (
            <ProfileHeader
              profile={profile}
              isEditing={isEditing}
              isGeneratingProfile={showGeneratingDialog}
              onEditClick={() => setIsEditing(true)}
              onSaveClick={handleSave}
              onGenerateProfile={generateProfile}
            />
          )}

          {/* DraggableImage 컴포넌트 렌더링 -> DraggableImage.tsx */}
          <div className="relative w-[1000px] h-[680px] mx-auto mt-8">
            <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToContainer]}>
              {images.map((image) => {
                // 🆕 DB에서 로드한 frameStyle을 우선적으로 사용
                const currentFrameStyle = image.desired_self 
                  ? 'cokie' 
                  : (image.frameStyle || frameStyles[image.id] || 'normal');
                
                console.log(`[MyProfile] 이미지 ${image.id} frameStyle 전달:`, {
                  'image.frameStyle': image.frameStyle,
                  'frameStyles[image.id]': frameStyles[image.id],
                  'currentFrameStyle': currentFrameStyle
                });
                
                return (
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
                    frameStyle={currentFrameStyle}
                    onFrameStyleChange={handleFrameStyleChange}
                    onImageChange={handleImageChange}
                    onImageSelect={handleImageSelect}
                    isSelected={selectedImages.some(img => img.id === image.id)}
                    isSearchMode={isSearchMode}
                    onImageDelete={handleImageDelete}
                    isTransitioning={sliderIsTransitioning}
                  />
                </div>
                )
              })}
            </DndContext>
          </div>

          {/* 플로팅 검색 버튼 분리 */}
          {!isEditing && !isSearchMode &&(
            <SearchFloatingButton
            isSearchMode={isSearchMode}
            toggleSearchMode={toggleSearchMode}
          />
          )}
          

          {/* 히스토리 슬라이더 (검색 모드가 아닐 때만 표시)->HistorySlider.tsx */}
          {!isEditing && !isSearchMode && (
            <HistorySlider
              histories={sliderHistories}
              currentHistoryIndex={sliderCurrentHistoryIndex}
              isPlaying={sliderIsPlaying}
              handlePlayHistory={handlePlayHistory}
              handleHistoryClick={handleHistoryClick}
              isTransitioning={sliderIsTransitioning}
            />
          )}
        </div>
      </div>

      {/* 컬러 팔레트 보드 (편집 모드일 때만 표시)->ColorPaletteBoard.tsx */}
      {isEditing && !isSearchMode && (
        <ColorPaletteBoard
          colorOptions={colorOptions}
          bgColor={bgColor}
          onChange={handleBgColorChange}
        />
      )}

      {/* 하단 액션 버튼들 - 검색 모드가 아닐 때만 표시 */}
      {!isSearchMode && (
      <BottomActionBar
        isEditing={isEditing}
          isGeneratingProfile={showGeneratingDialog}
        onEditClick={() => setIsEditing(true)}
        onSaveClick={handleSave}
          onGenerateProfile={generateProfile}
          sliderCurrentHistoryIndex={sliderCurrentHistoryIndex}
      />
      )}

    </main>
  );
} 