import { ImageData } from '../types/profile';

// DraggableImage 컴포넌트의 크기 계산 로직과 동일해야 합니다.
const getRenderedSize = (image: ImageData): { width: number; height: number } => {
  const baseWidth = image.width || 100;
  const baseHeight = image.height || 100;
  const sizeWeight = image.sizeWeight || 0.1;

  if (image.desired_self) {
    const multiplier = image.sizeWeight || 0.7;
    return {
      width: baseWidth * multiplier,
      height: (baseHeight + 80) * multiplier,
    };
  } else {
    return {
      width: baseWidth * (sizeWeight * 10),
      height: (baseHeight + 80) * (sizeWeight * 10),
    };
  }
};


interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export const arrangeImagesInCenter = (
  images: ImageData[],
  containerWidth: number,
  containerHeight: number,
  topMargin: number = 0
): Record<string, { x: number; y: number }> => {
  if (!images.length) return {};

  const centerX = containerWidth / 2;
  const availableHeight = containerHeight - topMargin;
  const centerY = topMargin + availableHeight / 2;

  // 1. 시뮬레이션을 위한 사각형 초기화
  const rectangles: Rectangle[] = images.map(image => {
    const { width, height } = getRenderedSize(image);
    return {
      id: image.id,
      x: centerX - width / 2 + (Math.random() - 0.5) * 50,
      y: centerY - height / 2 + (Math.random() - 0.5) * 50,
      width,
      height,
      vx: 0,
      vy: 0,
    };
  });

  // 2. 시뮬레이션 실행 (물리 기반)
  const iterations = 120;
  const repulsionForce = 0.8;
  const gravityForce = 0.015;
  const spacing = 20; // 이미지 간 최소 간격

  for (let i = 0; i < iterations; i++) {
    // 중력 (중앙으로 끌어당기는 힘)
    rectangles.forEach(rect => {
      const dx = centerX - (rect.x + rect.width / 2);
      const dy = centerY - (rect.y + rect.height / 2);
      rect.vx += dx * gravityForce;
      rect.vy += dy * gravityForce;
    });
    
    // 반발력 (서로 밀어내는 힘)
    for (let j = 0; j < rectangles.length; j++) {
      for (let k = j + 1; k < rectangles.length; k++) {
        const rect1 = rectangles[j];
        const rect2 = rectangles[k];

        const halfWidth1 = (rect1.width + spacing) / 2;
        const halfHeight1 = (rect1.height + spacing) / 2;
        const halfWidth2 = (rect2.width + spacing) / 2;
        const halfHeight2 = (rect2.height + spacing) / 2;

        const cx1 = rect1.x + rect1.width / 2;
        const cy1 = rect1.y + rect1.height / 2;
        const cx2 = rect2.x + rect2.width / 2;
        const cy2 = rect2.y + rect2.height / 2;

        const dx = cx2 - cx1;
        const dy = cy2 - cy1;

        const overlapX = (halfWidth1 + halfWidth2) - Math.abs(dx);
        const overlapY = (halfHeight1 + halfHeight2) - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          const force = repulsionForce * Math.min(overlapX, overlapY);
          const angle = Math.atan2(dy, dx);
          
          const moveX = Math.cos(angle) * force;
          const moveY = Math.sin(angle) * force;

          rect1.vx -= moveX;
          rect1.vy -= moveY;
          rect2.vx += moveX;
          rect2.vy += moveY;
        }
      }
    }

    // 위치 업데이트 및 감속
    rectangles.forEach(rect => {
        rect.x += rect.vx;
        rect.y += rect.vy;
        rect.vx *= 0.85; // Damping
        rect.vy *= 0.85; // Damping
    });
  }

  // 3. 최종 위치 계산 및 경계 제한
  const newPositions: Record<string, { x: number; y: number }> = {};
  rectangles.forEach(rect => {
    const finalX = Math.max(0, Math.min(rect.x, containerWidth - rect.width));
    const finalY = Math.max(topMargin, Math.min(rect.y, containerHeight - rect.height));
    newPositions[rect.id] = { x: finalX, y: finalY };
  });

  return newPositions;
}; 