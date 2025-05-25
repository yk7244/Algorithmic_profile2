import { Dispatch, SetStateAction, useCallback } from "react";

export function useFrameStyleChange(setFrameStyles: Dispatch<SetStateAction<Record<string, string>>>) {
  return useCallback((id: string, style: string) => {
    setFrameStyles(prev => ({
      ...prev,
      [id]: style
    }));
  }, [setFrameStyles]);
} 