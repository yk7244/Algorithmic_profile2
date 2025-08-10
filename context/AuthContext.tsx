'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-clean';
import { getUser, createUser } from '@/lib/database-clean';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: any | null; // DB의 users 테이블 데이터
  isLoggedIn: boolean;
  isLoading: boolean;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>; // 사용자 데이터 새로고침
  ensureValidSession: () => Promise<boolean>; // 세션 유효성 확인 및 갱신
  
  // 기존 인터페이스 호환성 유지
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DB에서 사용자 데이터 가져오기
  const refreshUserData = async () => {
    if (!user?.id) {
      setUserData(null);
      return;
    }

    try {
      const dbUser = await getUser(user.id);
      setUserData(dbUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    }
  };

  // 세션 유효성 확인 및 갱신
  const ensureValidSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 확인 중 오류:', error);
        return false;
      }

      if (!session) {
        console.warn('세션이 없습니다');
        return false;
      }

      // 세션 만료 10분 전에 갱신 (더 안전한 임계값)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 600) { // 10분 미만 남았을 때
        console.log('🔄 세션 만료 임박, 갱신 시도');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('세션 갱신 실패:', refreshError);
          return false;
        }
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          console.log('✅ 세션 갱신 성공');
          return true;
        }
      }
      
      return true;
    } catch (error) {
      console.error('세션 유효성 확인 중 오류:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let activityInterval: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        // 현재 세션 가져오기
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        // 세션 상태 업데이트
        setSession(session);
        setUser(session?.user ?? null);
        
        // 사용자 데이터 로드
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUserData(null);
        }
        
        setIsLoading(false);

        // 인증 상태 변경 리스너 설정 (한 번만)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state changed:', event, session?.user?.id);
            
            // 상태 업데이트를 debounce하여 중복 호출 방지
            setSession(session);
            setUser(session?.user ?? null);

            // 사용자 데이터 업데이트 (INITIAL_SESSION은 이미 처리했으므로 스킵)
            if (event !== 'INITIAL_SESSION') {
              if (session?.user) {
                await loadUserData(session.user, event);
              } else {
                setUserData(null);
              }
            }
          }
        );

        authSubscription = subscription;
        
        // 브라우저 활동 감지를 통한 세션 유지 (5분마다 체크)
        if (typeof window !== 'undefined') {
          activityInterval = setInterval(async () => {
            if (mounted) {
              await ensureValidSession();
            }
          }, 300000); // 5분마다 체크
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // 사용자 데이터 로드 함수
    const loadUserData = async (user: any, event?: string) => {
      try {
        let dbUser = await getUser(user.id);
        
        // 새 사용자인 경우 DB에 생성
        if (!dbUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log('🔄 사용자가 DB에 없습니다. 생성 시도:', user.id);
          await createUserProfile(user);
          
          // 생성 후 다시 조회 (최대 3번 재시도)
          let retryCount = 0;
          while (!dbUser && retryCount < 3 && mounted) {
            console.log(`🔄 사용자 조회 재시도 ${retryCount + 1}/3`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            dbUser = await getUser(user.id);
            retryCount++;
          }
          
          if (!dbUser) {
            console.error('❌ 사용자 생성/조회 최종 실패:', user.id);
          } else {
            console.log('✅ 사용자 조회 성공:', dbUser.id);
          }
        }
        
        if (mounted) {
          setUserData(dbUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) {
          setUserData(null);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (activityInterval) {
        clearInterval(activityInterval);
      }
    };
  }, []);

  // 사용자 프로필 생성 (새 사용자인 경우)
  const createUserProfile = async (user: User) => {
    try {
      const userData = {
        id: user.id,
        email: user.email!,
        nickname: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || 'unknown',
        background_color: '#ffffff',
        open_to_connect: true // ✅ 기본값을 true로 변경
      };

      const newUser = await createUser(userData);
      if (newUser) {
        console.log('User profile created successfully:', newUser);
      } else {
        console.error('Failed to create user profile');
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  // OAuth 로그인
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error(`Error signing in with ${provider}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`OAuth ${provider} login failed:`, error);
      throw error;
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  // 기존 인터페이스 호환성 유지
  const login = () => {
    console.warn('Deprecated: Use signInWithOAuth instead');
  };

  const logout = async () => {
    try {
      await signOut();
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userData,
      isLoggedIn,
      isLoading,
      signInWithOAuth,
      signOut,
      refreshUserData,
      ensureValidSession,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 