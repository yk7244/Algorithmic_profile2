import { UserData } from "@/app/types/profile";
import { createUser, updateUser, updateUserBackgroundColor, toggleUserOpenToConnect, getUser } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 사용자 데이터 생성 (localStorage 대체) - 중복 방지
export async function createUserData(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user');
            return false;
        }

        // ✅ 먼저 사용자가 이미 존재하는지 확인
        const existingUser = await getUser(user.id);
        
        if (existingUser) {
            console.log('✅ 사용자가 이미 존재합니다:', user.id);
            return true; // 이미 존재하므로 성공으로 처리
        }

        // 사용자가 존재하지 않는 경우에만 생성
        const newUserData = {
            id: user.id,
            email: user.email!,
            nickname: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || 'unknown',
            background_color: '#000000',  
            open_to_connect: true  // ✅ 기본값을 true로 변경
        };

        console.log('🔄 새 사용자 생성 중:', user.id);
        const result = await createUser(newUserData);
        return result !== null;
    } catch (error) {
        console.error('Error creating user data:', error);
        return false;
    }
}

// DB에 사용자 배경색 저장 (localStorage 대체)
export async function saveUserBackgroundColor(userId: string, backgroundColor: string): Promise<boolean> {
    try {
        return await updateUserBackgroundColor(userId, backgroundColor);
    } catch (error) {
        console.error('Error saving user background color:', error);
        return false;
    }
}

// DB에서 사용자 공개 설정 토글 (localStorage 대체)
export async function handleToggleOpenToConnect(userId: string): Promise<boolean> {
    try {
        return await toggleUserOpenToConnect(userId);
    } catch (error) {
        console.error('Error toggling open to connect:', error);
        return false;
    }
}

// 기존 localStorage 호환성을 위한 동기 함수들 (deprecated)
export function createUserDataSync() {
    console.warn('createUserDataSync is deprecated. Use createUserData() instead.');
    const newUserData = {
        id: '0',
        email: '0',
        background_color: '#000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        open_to_connect: false
    }
    localStorage.setItem('UserData', JSON.stringify(newUserData));
    
    // 비동기로 DB에도 저장 시도
    createUserData().catch(console.error);
}

export function saveUserBackgroundColorSync(userId: string, backgroundColor: string) {
    console.warn('saveUserBackgroundColorSync is deprecated. Use saveUserBackgroundColor() instead.');
    const key = `user-profile-background-color-${userId}`;
    localStorage.setItem(key, backgroundColor);
    
    // 비동기로 DB에도 저장 시도
    saveUserBackgroundColor(userId, backgroundColor).catch(console.error);
}

export function handleToggleOpenToConnectSync(userId: string) {
    console.warn('handleToggleOpenToConnectSync is deprecated. Use handleToggleOpenToConnect() instead.');
    if (!userId) return;
    if (typeof window === 'undefined') return;
    
    const raw = localStorage.getItem('UserData');
    if (!raw) return;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return;
    }
    
    if (Array.isArray(parsed)) {
        const updatedArr = parsed.map((u: UserData) =>
        u.id === userId ? { ...u, open_to_connect: !u.open_to_connect } : u
    );
        localStorage.setItem('UserData', JSON.stringify(updatedArr));
    } else {
        const updated = { ...parsed, open_to_connect: !parsed.open_to_connect };
        localStorage.setItem('UserData', JSON.stringify(updated));
    }
    
    // 비동기로 DB에도 저장 시도
    handleToggleOpenToConnect(userId).catch(console.error);
}