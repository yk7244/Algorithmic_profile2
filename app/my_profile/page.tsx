"use client";
import OpenAI from "openai";
import { useState, useEffect } from 'react';
import {DndContext} from '@dnd-kit/core';

//Refactoring
import DraggableImage from './Draggable/DraggableImage';
import ColorPaletteBoard from './CustomEdit/ColorPaletteBoard';
import { useBgColor } from './CustomEdit/hooks/useBgColor';
import HistorySlider from './HistorySlider/HistorySlider';
import GeneratingDialog from './GeneratingDialog/GeneratingDialog';
import { useHistorySlider } from './HistorySlider/Hooks/useHistorySlider';
import { colorOptions } from './CustomEdit/hooks/colorOptions';
import SearchModeUI from './SearchMode/SearchModeUI';
import { useSearchMode } from './SearchMode/Hooks/useSearchMode';
import ProfileHeader from './Nickname/ProfileHeader';
import SearchFloatingButton from './SearchMode/SearchFloatingButton';
import { useMoodboardHandlers } from './useMoodboardHandlers';
import { useImageDelete } from "./Draggable/Hooks/useImageDelete";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

type Position = {
  x: number;
  y: number;
};

type VideoData = {
  title: string;
  embedId: string;
};

interface ImportedImageData {
  id: string;
  src: string;
  main_keyword: string;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  keywords: string[];
  sizeWeight: number;
  relatedVideos: VideoData[];
  category: string;
  mood_keyword: string;
  sub_keyword: string;
  description: string;
  desired_self: boolean;
  desired_self_profile: string | null;
  color?: string;
}

type ImageData = Required<ImportedImageData>;

type HistoryData = {
  timestamp: number;
  positions: Record<string, Position>;
  frameStyles: Record<string, string>;
  images: ImageData[];
};

export default function MyProfilePage() {
  // --- 상태 선언 ---
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState({ nickname: '', description: '' });
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const { bgColor, handleBgColorChange } = useBgColor();
  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23666666'%3E이미지를 찾을 수 없습니다%3C/text%3E%3C/svg%3E";

  const historySlider = useHistorySlider({
    images,
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
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
    generateUserProfile,
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
    setIsGeneratingProfile,
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
  } = useSearchMode(images);

  const handleImageDelete = useImageDelete({
    images,
    setImages,
    positions,
    frameStyles,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setVisibleImageIds,
  });

  // --- 데이터 마이그레이션 및 초기화 이펙트 ---
  useEffect(() => {
    // 로컬 스토리지에서 기존 데이터 마이그레이션
    const migrateLocalStorageData = () => {
      try {
        // 무드보드 히스토리 마이그레이션
        const storedHistories = localStorage.getItem('moodboardHistories');
        if (storedHistories) {
          const parsedHistories = JSON.parse(storedHistories);
          
          // 각 히스토리의 이미지 데이터 마이그레이션
          const migratedHistories = parsedHistories.map((history: any) => {
            // 이미지 배열 마이그레이션
            const migratedImages = history.images?.map((img: any) => {
              // alt 필드가 있고 main_keyword 필드가 없는 경우에만 마이그레이션
              if (img.alt && !img.main_keyword) {
                return {
                  ...img,
                  main_keyword: img.alt, // alt 값을 main_keyword로 복사
                };
              }
              return img;
            });
            
            return {
              ...history,
              images: migratedImages || history.images,
            };
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('moodboardHistories', JSON.stringify(migratedHistories));
          console.log('무드보드 히스토리 데이터 마이그레이션 완료');
        }
        
        // 클러스터 이미지 마이그레이션
        const storedClusterImages = localStorage.getItem('clusterImages');
        if (storedClusterImages) {
          const parsedClusterImages = JSON.parse(storedClusterImages);
          
          // 각 클러스터 이미지 마이그레이션
          const migratedClusterImages: Record<string, any> = {};
          
          Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
            migratedClusterImages[key] = {
              ...value,
              main_keyword: key, // 키를 main_keyword로 사용
            };
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
          console.log('클러스터 이미지 데이터 마이그레이션 완료');
        }
        
        // 마이그레이션 완료 표시
        localStorage.setItem('dataMigrationCompleted', 'true');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
      }
    };
    
    // 마이그레이션이 이미 완료되었는지 확인
    const migrationCompleted = localStorage.getItem('dataMigrationCompleted');
    if (migrationCompleted !== 'true') {
      migrateLocalStorageData();
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시 저장된 히스토리 불러오기 및 최근 위치 설정
    const savedHistories = localStorage.getItem('moodboardHistories');
    if (savedHistories) {
      const parsedHistories = JSON.parse(savedHistories);
      // 기존 히스토리 데이터 마이그레이션
      const migratedHistories = parsedHistories.map((history: any) => ({
        ...history,
        images: history.images || images // 이미지 배열이 없으면 현재 이미지 사용
      }));
      
      setHistories(migratedHistories);
      
      if (migratedHistories.length > 0) {
        const latestHistory = migratedHistories[migratedHistories.length - 1];
        setPositions(latestHistory.positions);
        setCurrentHistoryIndex(migratedHistories.length - 1);
        setFrameStyles(latestHistory.frameStyles || {});
        if (latestHistory.images && latestHistory.images.length > 0) {
          setImages(latestHistory.images);
          // 최신 히스토리의 모든 이미지 ID를 visibleImageIds에 추가
          setVisibleImageIds(new Set(latestHistory.images.map((img: ImageData) => img.id)));
        }
      }
      // 마이그레이션된 데이터 저장
      localStorage.setItem('moodboardHistories', JSON.stringify(migratedHistories));
    } else {
      // 초기 히스토리 생성
      const initialHistory: HistoryData = {
        timestamp: Date.now(),
        positions: positions,
        frameStyles: frameStyles,
        images: images
      };
      setHistories([initialHistory]);
      localStorage.setItem('moodboardHistories', JSON.stringify([initialHistory]));
      setCurrentHistoryIndex(0);
      // 초기 히스토리의 모든 이미지 ID를 visibleImageIds에 추가
      setVisibleImageIds(new Set(images.map(img => img.id)));
    }
  }, []);

  useEffect(() => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      const imageIdSet = new Set(images.map(img => img.id));

      // images 배열에 있는 각 이미지에 대해
      images.forEach(image => {
        // positions에 해당 이미지가 없으면 초기 위치 설정
        if (!newPositions[image.id]) {
          newPositions[image.id] = {
            x: Number(image.left?.replace('px', '') || 0),
            y: Number(image.top?.replace('px', '') || 0),
          };
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

  //별명생성
  useEffect(() => {
    generateUserProfile();
  }, []);

  // 클라이언트에서만 localStorage에서 이미지 불러오기 (hydration mismatch 방지)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfileImages = localStorage.getItem('profileImages');
      if (savedProfileImages) {
        const parsedImages = JSON.parse(savedProfileImages) as ImportedImageData[];
        setImages(parsedImages.map(img => ({
          ...img,
          src: img.src || placeholderImage,
          color: img.color || 'gray',
          desired_self_profile: img.desired_self_profile || null
        })));
      }
    }
  }, []);

  return (
    <main className={`fixed inset-0 overflow-y-auto transition-colors duration-500 ${bgColor}`}>
      {/* 생성 중 다이얼로그 -> GeneratingDialog.tsx */}
      <GeneratingDialog
        open={showGeneratingDialog}
        onOpenChange={setShowGeneratingDialog}
        generatingStep={generatingStep}
      />

      {/* 검색 모드 UI -> SearchModeUI.tsx */}
      <SearchModeUI
        isSearchMode={isSearchMode}
        selectedImage={selectedImage}
        selectedImages={selectedImages}
        handleSearch={handleSearch}
      />

      {/* My_profile 페이지 레이아웃 */}
      <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto">

          {/* 닉넴/설명/버튼 헤더 분리 -> ProfileHeader.tsx */}
          {!isSearchMode && (
            <ProfileHeader
              profile={profile}
              isEditing={isEditing}
              isGeneratingProfile={isGeneratingProfile}
              onEditClick={() => setIsEditing(true)}
              onSaveClick={handleSave}
              onGenerateProfile={generateUserProfile}
            />
          )}

          {/* DraggableImage 컴포넌트 렌더링 -> DraggableImage.tsx */}
          <div className="relative w-[1000px] h-[800px] mx-auto mt-8">
            <DndContext onDragEnd={handleDragEnd}>
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`transition-all duration-500 ${
                    isEditing || visibleImageIds.has(image.id)
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <DraggableImage
                    image={image}
                    position={positions[image.id]}
                    isEditing={isEditing && !isSearchMode}
                    positions={positions}
                    frameStyle={image.desired_self ? 'star' : (frameStyles[image.id] || 'healing')}
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
          <SearchFloatingButton
            isSearchMode={isSearchMode}
            toggleSearchMode={toggleSearchMode}
          />

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

    </main>
  );
} 