import { ProfileData } from "@/app/types/profile";
import { getProfileData } from "../get/getProfileData";

export function saveProfileData(
  profileData: ProfileData | ProfileData[],
  localStorageObj: Storage = localStorage
) {
  const prev = getProfileData() ?? []; // null이면 빈 배열로 대체

  if (Array.isArray(profileData)) {
    prev.push(...profileData);
  } else {
    prev.push(profileData);
  }

  localStorageObj.setItem("profileData", JSON.stringify(prev));
  console.log("profileData 저장 완료", profileData);
}

