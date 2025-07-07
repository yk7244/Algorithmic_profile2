import { UserData } from "@/app/types/profile";
import { getUserData } from "../get/getUserData";

export function createUserData() {
    const newUserData = {
        id: '0',
        email: '0',
        background_color: '#000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        open_to_connect: false
    }
    localStorage.setItem('UserData', JSON.stringify(newUserData));
}

// user profile의 background_color를 저장하는 함수
export function saveUserBackgroundColor(userId: string, backgroundColor: string) {
  // 실제 서비스라면 서버에 PATCH/PUT 요청을 보내야 함
  // 여기서는 localStorage에 저장 (예시)
  const key = `user-profile-background-color-${userId}`;
  localStorage.setItem(key, backgroundColor);
}

export function handleToggleOpenToConnect(userId: string) {
    if (!userId) return;
    if (typeof window === 'undefined') return;
    // localStorage에서 UserData 불러오기
    const raw = localStorage.getItem('UserData');
    if (!raw) return;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return;
    }
    // UserData가 배열이 아니라 객체일 경우도 처리
    if (Array.isArray(parsed)) {
        const updatedArr = parsed.map((u: UserData) =>
        u.id === userId ? { ...u, open_to_connect: !u.open_to_connect } : u
    );
        localStorage.setItem('UserData', JSON.stringify(updatedArr));
    } else {
      // 단일 객체일 경우
        const updated = { ...parsed, open_to_connect: !parsed.open_to_connect };
        localStorage.setItem('UserData', JSON.stringify(updated));
    }
}