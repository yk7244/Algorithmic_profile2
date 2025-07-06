import { ProfileData } from "@/app/types/profile";
import { getProfileData } from "../get/getProfileData";

export function saveProfileData(profileData: ProfileData | ProfileData[], localStorageObj: Storage = localStorage) {
  // 기존 데이터 불러오기 (배열)
  const prev = getProfileData();
  
  if (Array.isArray(profileData)) {
    prev.push(...profileData); // 여러 개 한 번에 추가
  } else {
    prev.push(profileData);
  }
  localStorageObj.setItem('profileData', JSON.stringify(prev));
  console.log('profileData 저장 완료', profileData);
}

