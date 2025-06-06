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

  //새로고침시 별명 생성/로드 훅 사용
  useInitialProfileLoad({
    loadProfileFromStorage,
    isProfileExpired,
    generateProfile,
    setProfile,
  });

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
          console.log('newPositions', newPositions);
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
              {images.map((image, index) => (
                <div
                  key={image.id || Math.random().toString()}
                  className={`transition-all duration-500 ${
                    isEditing || (image.id && visibleImageIds.has(image.id))
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                  style={{
                    transitionDelay: isSearchMode ? `${0.5 + index * 0.1}s` : '0s'
                  }}
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
                  />
                </div>
              ))}
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