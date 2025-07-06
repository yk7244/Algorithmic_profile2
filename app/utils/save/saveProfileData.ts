import { ProfileData } from "../types/profile";

export function saveProfileData(profileData: ProfileData, localStorageObj: Storage = localStorage) {
  // 기존 데이터 불러오기 (배열)
  const prev = localStorageObj.getItem('profileData');
  const arr = prev ? JSON.parse(prev) : [];
  arr.push(profileData);
  localStorageObj.setItem('profileData', JSON.stringify(arr));
}