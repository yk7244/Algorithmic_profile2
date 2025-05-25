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

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${rotate || 0}deg)`,
            transition: isEditing ? 'none' : 'transform 0.1s ease-in-out',
        }
        : {
            transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) rotate(${rotate || 0}deg)`,
            transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
        };

    return { attributes, listeners, setNodeRef, style };
} 