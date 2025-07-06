"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {DndContext} from '@dnd-kit/core';
import { restrictToContainer } from './Draggable/Hooks/Drag/useDragConstraints';
import { useSearchParams } from 'next/navigation';

//Refactoring
import DraggableImage from './Draggable/DraggableImage';
import ColorPaletteBoard from './Edit/ColorPaletteBoard';
import { useBgColor } from './Edit/Hooks/useBgColor';
import HistorySlider from './HistorySlider/HistorySlider';
import GeneratingDialog from './GeneratingDialog/GeneratingDialog';
import { useHistorySlider } from './HistorySlider/Hooks/useHistorySlider';
import { colorOptions } from './Edit/Hooks/colorOptions';
import SearchModeUI from '../search/SearchMode/SearchModeUI';
import { useSearchMode } from '../search/SearchMode/Hooks/useSearchMode';
import ProfileHeader from './Nickname/ProfileHeader';
import SearchFloatingButton from '../search/SearchMode/SearchFloatingButton';
import BottomActionBar from './Edit/BottomActionBar';
import { useMoodboardHandlers } from './useMoodboardHandlers';
import { useImageDelete } from "./Edit/Hooks/Image/useImageDelete";
import { useProfileStorage } from './Nickname/Hooks/useProfileStorage';
import { useProfileImagesLoad } from '../utils/get/getImageData';     
import { arrangeImagesInCenter } from '../utils/autoArrange';
import { 
  ImageData,
  HistoryData,
} from '../types/profile';
import useAutoArrange from './Edit/Hooks/useAutoArrange';
import AutoArrangeButton from './Edit/AutoArrangeButton';
import SearchHeader from "../search/SearchMode/SearchHeader";
import { users } from '../others_profile/dummy-data';
import { savePositions } from "./Edit/Hooks/savePosition";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function MyProfilePage() {
  const searchParams = useSearchParams();
  const [exploreAnimation, setExploreAnimation] = useState(false);
  // --- 상태 선언 ---
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState({ nickname: '', description: '' });
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);  
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const placeholderImage = "../../../public/images/default_image.png"
  
  // 임시: 실제 환경에서는 로그인 유저 id를 동적으로 받아야 함
  const userId = 'user1';
  const user = users.find(u => u.id === userId);
  const { handleColorChange, bgColor, handleBgColorChange } = useBgColor(user?.background_color || 'bg-[#F2F2F2]');

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
    handleBgColorChange,
    originalBgColor: bgColor,
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

  

  const boardRef = useRef<HTMLDivElement>(null);

  const handleAutoArrange = useAutoArrange({
    boardRef,
    images,
    setPositions,
    arrangeImagesInCenter,
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

  return (
    <div className={`grid grid-cols-[minmax(320px,380px)_1fr] w-full h-screen overflow-y-hidden ${!isSearchMode ? bgColor : ''} transform transition-all duration-1000 ease-in-out`}>
      {/* 왼쪽: 프로필/설명/닉네임 등 */}
      <div className={`flex flex-col px-4 py-12 backdrop-blur-lg z-10 ${isSearchMode ? 'bg-[#0a1833]/80' : 'bg-white/70'}`}>
        {!isSearchMode ? ( 
          <ProfileHeader
            profile={profile}
            isEditing={isEditing}
            isGeneratingProfile={showGeneratingDialog}
            onEditClick={() => setIsEditing(true)}
            onSaveClick={() => savePositions(images, positions)}
            onGenerateProfile={generateProfile}
          />
        ):(
            <>
            <SearchHeader onBack={() => setIsSearchMode(false)} />
            </>
        )}
      </div>
      {/* 오른쪽: 무드보드/이미지/카드 등 */}
      <div className={`relative flex flex-col h-full w-full ${!isSearchMode ? bgColor : ''} ${exploreAnimation ? 'animate-fadeIn' : ''}`} ref={boardRef}>
        {/* 프로필 무드보드 텍스트 */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-24 text-center text-black text-md font-bold bg-gradient-to-r 
            bg-[length:200%_100%] 
            bg-clip-text text-transparent animate-gradient-move 
            transition-all duration-1000 ease-in-out
            transform transition-transform duration-1000 ease-in-out
            ${!isSearchMode ? 'from-gray-700 via-gray-200 to-gray-700' : 'from-white via-[#3B71FE] to-white bg-[length:200%_100%] '}`}
        >
          {profile.nickname ? `${profile.nickname}` : 'My 무드보드'} 
          {isSearchMode ? '알고리즘 프로필 무드보드에서 궁금한 키워드를 선택해주세요' : '의 알고리즘 프로필 무드보드'}
        </div>

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
                  />
                </div>
              ))}
            </DndContext>
          </div>
          {/* 자동 정렬 버튼 (편집 모드일 때만 표시) */}
          <AutoArrangeButton 
            isEditing={isEditing}
            onAutoArrange={handleAutoArrange}
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
            />
          </div>
        )}
        {/* 컬러 팔레트 보드 (편집 모드일 때만 표시)->ColorPaletteBoard.tsx */}
        {isEditing && !isSearchMode && (
          <ColorPaletteBoard
            colorOptions={colorOptions}
            bgColor={bgColor}
            onColorChange={handleColorChange}
          />
        )}
        {/* 액션 버튼들 - 검색 모드가 아닐 때만 표시 */}
        {!isSearchMode && (
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
      </div>
    </div>
  );
} 