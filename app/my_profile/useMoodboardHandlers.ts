import { useFrameStyleChange } from './Draggable/Hooks/Frame/useFrameStyleChange';
import { useHistorySave } from './HistorySlider/Hooks/useHistorySave';
import { useDragEnd } from './Draggable/Hooks/Drag/useDragHandlers';
import { useImageChange } from './Draggable/Hooks/Image/useImageChange';
import { useGenerateUserProfile } from './Nickname/Hooks/useGenerateUserProfile';
import { 
  Position, 
  ImageData,
  MoodboardImageData,
  HistoryData 
} from '../types/profile';
import { Dispatch, SetStateAction } from 'react';

export function useMoodboardHandlers(params: {
  setFrameStyles: Dispatch<SetStateAction<Record<string, string>>>;
  positions: Record<string, Position>;
  frameStyles: Record<string, string>;
  images: ImageData[];   
  setCurrentHistoryIndex: Dispatch<SetStateAction<number>>;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  setPositions: Dispatch<SetStateAction<Record<string, Position>>>;
  setImages: Dispatch<SetStateAction<ImageData[]>>;  
  openai: any;
  setShowGeneratingDialog: Dispatch<SetStateAction<boolean>>;
  setGeneratingStep: Dispatch<SetStateAction<number>>;
  setProfile: Dispatch<SetStateAction<{ nickname: string; description: string }>>;
  histories: HistoryData[];
  setHistories: Dispatch<SetStateAction<HistoryData[]>>;
  }) {
  const handleFrameStyleChange = useFrameStyleChange(params.setFrameStyles);

  const handleSave = useHistorySave({
    positions: params.positions,
    frameStyles: params.frameStyles,
    images: params.images as MoodboardImageData[],
    histories: params.histories,
    setHistories: params.setHistories,
    setCurrentHistoryIndex: params.setCurrentHistoryIndex,
    setIsEditing: params.setIsEditing,
  });

  const handleDragEnd = useDragEnd(
    params.isEditing, 
    params.images as ImageData[], 
    params.setImages, 
    params.setPositions);
    
  const handleImageChange = useImageChange(
    params.images as MoodboardImageData[],
    params.setImages,
    params.positions,
    params.frameStyles,
    params.histories,
    params.setHistories,
    params.setCurrentHistoryIndex
  );
  
  // useGenerateUserProfile 훅에서 generateProfile 함수 가져오기
  const { generateProfile } = useGenerateUserProfile({
    openai: params.openai,
    setShowGeneratingDialog: params.setShowGeneratingDialog,
    setGeneratingStep: params.setGeneratingStep,
    setProfile: params.setProfile,
  });

  return {
    handleFrameStyleChange,
    handleSave,
    handleDragEnd,
    handleImageChange,
    generateProfile, // 함수 반환
  };
} 