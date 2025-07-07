import { userImages } from '@/app/others_profile/dummy-data';
import { ImageData } from "@/app/types/profile";

// 모든 더미 이미지 객체를 하나의 배열로 반환하는 함수
export function getAllDummyImages(): ImageData[] {
    return Object.values(userImages).flat();
  } 