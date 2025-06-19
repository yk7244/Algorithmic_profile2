import { useState, useEffect } from "react";
import { getBgColor, saveProfileData, getCurrentUserId, ensureUserExists, getProfileData } from '@/lib/database';

export function useBgColor(defaultColor: string = 'bg-[#F2F2F2]') {
  const [bgColor, setBgColor] = useState(defaultColor);

  useEffect(() => {
    const loadBgColor = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('[useBgColor] 로그인되지 않음, localStorage fallback');
          loadFromLocalStorage();
          return;
        }

        const savedBgColor = await getBgColor(userId);
        if (savedBgColor) {
          setBgColor(savedBgColor);
          console.log('[useBgColor] DB에서 배경색 로드:', savedBgColor);
          localStorage.setItem('moodboard-bg-color', savedBgColor);
        } else {
          console.log('[useBgColor] DB에 배경색 없음, localStorage 확인');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('[useBgColor] DB 로드 실패, localStorage fallback:', error);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
    const savedBgColor = localStorage.getItem('moodboard-bg-color');
      if (savedBgColor) {
        setBgColor(savedBgColor);
        console.log('[useBgColor] localStorage에서 배경색 로드:', savedBgColor);
      }
    };

    loadBgColor();
  }, []);

  const handleBgColorChange = async (colorClass: string) => {
    setBgColor(colorClass);
    
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        await ensureUserExists();
        
        const existingProfile = await getProfileData(userId);
        
        await saveProfileData(userId, { 
          nickname: existingProfile?.nickname || '알고리즘 탐험가',
          description: existingProfile?.description || '프로필 설명이 없습니다',
          bg_color: colorClass,
          open_to_connect: existingProfile?.open_to_connect ?? true,
          profileImage: existingProfile?.profile_image
        });
        console.log('[useBgColor] DB에 배경색 저장 완료:', colorClass);
      } else {
        console.log('[useBgColor] 로그인되지 않음, localStorage만 저장');
      }
      
      localStorage.setItem('moodboard-bg-color', colorClass);
      
    } catch (error) {
      console.error('[useBgColor] DB 저장 실패, localStorage fallback:', error);
    localStorage.setItem('moodboard-bg-color', colorClass);
    }
  };

  return { bgColor, handleBgColorChange };
} 