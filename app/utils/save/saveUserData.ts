// user profile의 background_color를 저장하는 함수
export function saveUserBackgroundColor(userId: string, backgroundColor: string) {
  // 실제 서비스라면 서버에 PATCH/PUT 요청을 보내야 함
  // 여기서는 localStorage에 저장 (예시)
  const key = `user-profile-background-color-${userId}`;
  localStorage.setItem(key, backgroundColor);
}
