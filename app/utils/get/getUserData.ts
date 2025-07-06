import { users, profiles, userImages } from '@/app/others_profile/dummy-data';
import { UserData, ProfileData, ImageData } from '@/app/types/profile';

// user profile의 background_color를 불러오는 함수
export function getUserBackgroundColor(userId: string): string | null {
    const key = `user-profile-background-color-${userId}`;
    return localStorage.getItem(key);
}

// userId로 users, profiles, userImages를 조인해서 한 번에 반환하는 함수
export function getUserFullProfileById(userId: string): {
  user: UserData | undefined,
  profile: ProfileData | undefined,
  images: ImageData[]
} {
  const user = users.find((u) => u.id === userId);
  const profile = profiles.find((p) => p.id === userId);
  const images = userImages[userId] || [];
  return { user, profile, images };
}

export function getUserData() {
  const raw = localStorage.getItem('UserData');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  }
}