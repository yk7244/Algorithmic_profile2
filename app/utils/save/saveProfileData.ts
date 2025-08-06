import { ProfileData } from "@/app/types/profile";
import { createActiveProfile, updateActiveProfile } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 프로필 저장 (localStorage 대체)
export async function saveProfileData(
  profileData: ProfileData | ProfileData[]
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    // 단일 프로필 데이터인 경우
    if (!Array.isArray(profileData)) {
      const result = await createActiveProfile({
        user_id: user.id,
        nickname: profileData.nickname,
        main_description: profileData.description,
        background_color: '#ffffff'
      });
      
      if (result) {
        console.log("프로필 저장 완료", result);
        return true;
      }
      return false;
    }

    // 배열인 경우 마지막 항목만 저장 (활성 프로필은 하나만)
    const latestProfile = profileData[profileData.length - 1];
    const result = await createActiveProfile({
      user_id: user.id,
      nickname: latestProfile.nickname,
      main_description: latestProfile.description,
      background_color: '#ffffff'
    });

    if (result) {
      console.log("프로필 저장 완료", result);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving profile data:', error);
    return false;
  }
}

// 기존 localStorage 호환성을 위한 동기 함수 (deprecated)
export function saveProfileDataSync(
  profileData: ProfileData | ProfileData[],
  localStorageObj: Storage = localStorage
) {
  console.warn('saveProfileDataSync is deprecated. Use saveProfileData() instead.');
  
  // 임시로 localStorage에 저장하되, DB 저장도 시도
  const prev = JSON.parse(localStorageObj.getItem("profileData") || "[]");

  if (Array.isArray(profileData)) {
    prev.push(...profileData);
  } else {
    prev.push(profileData);
  }

  localStorageObj.setItem("profileData", JSON.stringify(prev));
  console.log("profileData 저장 완료 (sync)", profileData);
  
  // 비동기로 DB에도 저장 시도
  saveProfileData(profileData).catch(console.error);
}

