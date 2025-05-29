import { useCallback } from "react";
import { DragEndEvent } from '@dnd-kit/core';

export function useDragEnd(isEditing: boolean, setPositions: any) {
  return useCallback((event: DragEndEvent) => {
    if (!isEditing) return;
    const { active, delta } = event;
    setPositions((prev: any) => {
      const oldPosition = prev[active.id] || { x: 0, y: 0 };
      const newPosition = {
        x: oldPosition.x + delta.x,
        y: oldPosition.y + delta.y,
      };
      const updatedPositions = {
        ...prev,
        [active.id]: newPosition,
      };
      console.log(`Dragged image ID: ${active.id}, New X: ${newPosition.x}, New Y: ${newPosition.y}`);
      return updatedPositions;
    });
  }, [isEditing, setPositions]);
} 