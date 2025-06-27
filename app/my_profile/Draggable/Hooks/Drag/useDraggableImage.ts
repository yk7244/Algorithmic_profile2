import { useDraggable } from '@dnd-kit/core';

export function useDraggableImage(
    id: string,
    isEditing: boolean,
    position?: { x: number; y: number },
    rotate?: number
    ) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
        disabled: !isEditing,
    });

    const style = (() => {
        if (transform) {
            const newY = (position?.y || 0) + transform.y;
            // y 위치가 0 미만으로 가지 않도록 제한 (상단 경계)
            const constrainedY = Math.max(newY, 0);
            const deltaY = constrainedY - (position?.y || 0);

            return {
                transform: `translate3d(${(position?.x || 0) + transform.x}px, ${constrainedY}px, 0) rotate(${rotate || 0}deg)`,
            transition: isEditing ? 'none' : 'transform 0.1s ease-in-out',
            };
        }
        return {
            transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) rotate(${rotate || 0}deg)`,
            transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
        };
    })();
    
    return { attributes, listeners, setNodeRef, style };
} 