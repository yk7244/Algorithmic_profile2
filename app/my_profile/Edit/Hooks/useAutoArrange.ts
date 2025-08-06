import { useCallback } from 'react';

interface UseAutoArrangeProps {
  boardRef: React.RefObject<HTMLDivElement>;
  images: any[];
  setPositions: (positions: any) => void;
  arrangeImagesInCenter: (
    images: any[],
    containerWidth: number,
    containerHeight: number,
    topMargin: number,
    bottomMargin: number
  ) => any;
}

const useAutoArrange = ({ boardRef, images, setPositions, arrangeImagesInCenter }: UseAutoArrangeProps) => {
  return useCallback(() => {
    //console.log('=== useAutoArrange 시작 ===');
    //console.log('전달받은 props:', { boardRef, images, setPositions, arrangeImagesInCenter });
    
    if (!boardRef.current) {
      console.log('boardRef.current가 없음');
      return;
    }
    
    const containerWidth = boardRef.current.offsetWidth;
    const containerHeight = boardRef.current.offsetHeight;
    const topMargin = 50; // 제목 영역을 위한 상단 여백
    const bottomMargin = 300; // 하단 여백
    
    //console.log('컨테이너 크기:', { containerWidth, containerHeight, topMargin });
    
    // ✅ 해상도에 따른 반응형 배치 개선
    const isWideScreen = containerWidth > 1400;
    const isMediumScreen = containerWidth > 1000;
    
    let rightShiftedWidth, leftOffset;
    
    if (isWideScreen) {
      // 와이드 스크린: 더 중앙에 가깝게
      rightShiftedWidth = containerWidth * 0.85;
      leftOffset = containerWidth * 0.10;
    } else if (isMediumScreen) {
      // 중간 스크린: 기존 설정 유지
      rightShiftedWidth = containerWidth * 0.90;
      leftOffset = containerWidth * 0.14;
    } else {
      // 작은 스크린: 거의 중앙 배치
      rightShiftedWidth = containerWidth * 0.95;
      leftOffset = containerWidth * 0.05;
    }
    
    console.log(`📱 화면 크기: ${containerWidth}px, 배치 모드: ${isWideScreen ? 'Wide' : isMediumScreen ? 'Medium' : 'Small'}`);
    
    //console.log('계산된 값들:', { rightShiftedWidth, leftOffset });
    //console.log('images 배열:', images);
    
    const newPositions = arrangeImagesInCenter(images, rightShiftedWidth, containerHeight, topMargin, bottomMargin);
    //console.log('arrangeImagesInCenter 결과:', newPositions);
    
    // 각 이미지 위치에 leftOffset을 더해서 오른쪽으로 이동
    const adjustedPositions: Record<string, {x: number, y: number}> = {};
    Object.keys(newPositions).forEach(imageId => {
      adjustedPositions[imageId] = {
        x: newPositions[imageId].x + leftOffset,
        y: newPositions[imageId].y ,
      };
    });
    
    //console.log('최종 조정된 위치들:', adjustedPositions);
    //console.log('=== useAutoArrange 완료 ===');
    
    setPositions(adjustedPositions);
  }, [boardRef, images, setPositions, arrangeImagesInCenter]);
};

export default useAutoArrange;
