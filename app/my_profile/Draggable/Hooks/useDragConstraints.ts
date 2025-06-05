export const restrictToContainer = ({ transform, draggingNodeRect, overlayNodeRect }: any) => {
  if (!draggingNodeRect || !overlayNodeRect) {
    return transform;
  }

  // 컨테이너 크기 (1000x680) - 이 값들은 하드코딩되어 있거나, prop으로 받아야 할 수 있습니다.
  const containerWidth = 1000;
  const containerHeight = 680;
  
  // 이미지 크기
  const imageWidth = draggingNodeRect.width;
  const imageHeight = draggingNodeRect.height;
  
  // 제한된 위치 계산
  const minX = 0;
  const maxX = containerWidth - imageWidth;
  const minY = 0;
  const maxY = containerHeight - imageHeight;
  
  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX - draggingNodeRect.left), maxX - draggingNodeRect.left),
    y: Math.min(Math.max(transform.y, minY - draggingNodeRect.top), maxY - draggingNodeRect.top),
  };
}; 