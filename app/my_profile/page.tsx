"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, Dispatch, SetStateAction, useMemo, useCallback } from 'react';
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
import TaskGuide from "./Guide/TaskGuide";  
import Tutorial from "./Tutorial/Tutorial";
import DragNotice from "./Guide/DragNotice";
import { getReflectionData } from "../utils/get/getReflectionData";
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
  const reflectionData = getReflectionData();
  useEffect(() => {
    if(reflectionData?.tutorial){
      setShowTutorial(false);
    }else{
      setShowTutorial(true);
    }
  }, [reflectionData]);
  console.log('🔵showTutorial',showTutorial);

  //  const [profile, setProfile] = useState({ nickname: "기본 닉네임", description: "기본 설명" });
  const [profile, setProfile] = useState(() => {
    const latestProfile = getLatestProfileData();
    return {
      nickname: latestProfile?.nickname || '',
      description: latestProfile?.description || '',
    };
  });
  // changeProfile 함수는 setProfile을 호출
  const changeProfile = (nickname: string, description: string) => {
    setProfile({ nickname, description });
    console.log('🔵profile',profile);
  };
  useEffect(() => {
    console.log('🔥 최신 profile 상태:', profile);
  }, [profile]);
  // 임시: 실제 환경에서는 로그인 유저 id를 동적으로 받아야 함
  // const user = getUserData();
  // const bgColor = getUserBackgroundColor(user || '#F2F2F2') || 'bg-[#F2F2F2]';

  // 배경색 상태 및 변경 함수
  const { bgColor, setBgColor, handleBgColorChange } = useBgColor();

  // 히스토리 클릭 시 배경색 변경 콜백
  const handleHistoryBgColorChange = (color: string) => setBgColor(color);

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
  


  return (
    <div className={`grid grid-cols-[minmax(320px,380px)_1fr] w-100wh h-screen overflow-y-hidden ${!isSearchMode ? 'bg-gray-100' : bgColor} transform transition-all duration-1000 ease-in-out`}>
      {/* 왼쪽: 프로필/설명/닉네임 등 */}
      <div className={`z-30  shadow-2xl flex flex-col px-4 py-12 backdrop-blur-lg z-10 justify-center pb-18 ${isSearchMode ? 'bg-[#0a1833]/80' : 'bg-white/70'}`}>
        {!isSearchMode ? ( 
          <ProfileHeader
            profile={profile}
            changeProfile={changeProfile}
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
        {/* 튜토리얼 영역 */}
        <Tutorial show={showTutorial} onClose={() => setShowTutorial(false)}/>  
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
                colorOptions={colorOptions}
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
  );
} 