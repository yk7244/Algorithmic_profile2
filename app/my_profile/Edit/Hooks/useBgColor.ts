import { useState, useEffect } from "react";
import { getUserBackgroundColor } from '@/app/utils/get/getUserData';
import { saveUserBackgroundColor } from '@/app/utils/save/saveUserData';

// 오른쪽 색상에 대응하는 왼쪽 색상 매핑
const getLeftColorFromRight = (rightColor: string): string => {
  const colorMapping: Record<string, string> = {
    'bg-[#F2F2F2]': 'bg-[#f5f5f5]',     // 기본 회색 -> 약간 더 밝은 회색
    'bg-white': 'bg-gray-50',             // 흰색 -> 매우 연한 회색
    'bg-gray-100': 'bg-gray-50',          // 연한 회색 -> 더 연한 회색
    'bg-gray-200': 'bg-gray-100',         // 회색 -> 연한 회색
    'bg-blue-50': 'bg-blue-25',           // 연한 파랑 -> 더 연한 파랑
    'bg-blue-100': 'bg-blue-50',          // 파랑 -> 연한 파랑
    'bg-green-50': 'bg-green-25',         // 연한 초록 -> 더 연한 초록
    'bg-green-100': 'bg-green-50',        // 초록 -> 연한 초록
    'bg-pink-50': 'bg-pink-25',           // 연한 분홍 -> 더 연한 분홍
    'bg-pink-100': 'bg-pink-50',          // 분홍 -> 연한 분홍
    'bg-purple-50': 'bg-purple-25',       // 연한 보라 -> 더 연한 보라
    'bg-purple-100': 'bg-purple-50',      // 보라 -> 연한 보라
    'bg-yellow-50': 'bg-yellow-25',       // 연한 노랑 -> 더 연한 노랑
    'bg-yellow-100': 'bg-yellow-50',      // 노랑 -> 연한 노랑
    'bg-red-50': 'bg-red-25',             // 연한 빨강 -> 더 연한 빨강
    'bg-red-100': 'bg-red-50',            // 빨강 -> 연한 빨강
    'bg-orange-50': 'bg-orange-25',       // 연한 주황 -> 더 연한 주황
    'bg-orange-100': 'bg-orange-50',      // 주황 -> 연한 주황
  };
  
  return colorMapping[rightColor] || 'bg-gray-50'; // 매핑되지 않은 색상은 기본값
};

export function useBgColor(defaultRightColor: string = 'bg-[#F2F2F2]') {
  const [bgColor, setBgColor] = useState(defaultRightColor);
  
  useEffect(() => {
    // userId는 실제 환경에 맞게 전달 필요
    const userId = 'user1';
    const savedRightBgColor = getUserBackgroundColor(userId);
    if (savedRightBgColor) {
      setBgColor(savedRightBgColor);
    }
  }, []);

  const handleColorChange = (colorClass: string) => {
    const bgColor = getLeftColorFromRight(colorClass);
    
    setBgColor(bgColor);
    // userId는 실제 환경에 맞게 전달 필요
    const userId = 'user1';
    saveUserBackgroundColor(userId, bgColor);
  };

  return { 
    bgColor, 
    handleColorChange,
    // 하위 호환성을 위해 기존 API도 유지
    handleBgColorChange: handleColorChange
  };
} 