import { useFrameStyleChange } from './Draggable/Hooks/useFrameStyleChange';
import { useHistorySave } from './HistorySlider/Hooks/useHistorySave';
import { useDragEnd } from './Draggable/Hooks/useDragHandlers';
import { useImageChange } from './Draggable/Hooks/useImageChange';
import { useGenerateUserProfile } from './Nickname/Hooks/useGenerateUserProfile';

export function useMoodboardHandlers(params: {
  setFrameStyles: any;
  positions: any;
  frameStyles: any;
  images: any[];
  histories: any[];
  setHistories: any;
  setCurrentHistoryIndex: any;
  setIsEditing: any;
  isEditing: boolean;
  setPositions: any;
  setImages: any;
  openai: any;
  setIsGeneratingProfile: any;
  setShowGeneratingDialog: any;
  setGeneratingStep: any;
  setProfile: any;
}) {
  const handleFrameStyleChange = useFrameStyleChange(params.setFrameStyles);
  const handleSave = useHistorySave({
    positions: params.positions,
    frameStyles: params.frameStyles,
    images: params.images,
    histories: params.histories,
    setHistories: params.setHistories,
    setCurrentHistoryIndex: params.setCurrentHistoryIndex,
    setIsEditing: params.setIsEditing,
  });
  const handleDragEnd = useDragEnd(params.isEditing, params.setPositions);
  const handleImageChange = useImageChange(
    params.images,
    params.setImages,
    params.positions,
    params.frameStyles,
    params.histories,
    params.setHistories,
    params.setCurrentHistoryIndex
  );
  const generateUserProfile = useGenerateUserProfile({
    openai: params.openai,
    setIsGeneratingProfile: params.setIsGeneratingProfile,
    setShowGeneratingDialog: params.setShowGeneratingDialog,
    setGeneratingStep: params.setGeneratingStep,
    setProfile: params.setProfile,
  });

  return {
    handleFrameStyleChange,
    handleSave,
    handleDragEnd,
    handleImageChange,
    generateUserProfile,
  };
} 