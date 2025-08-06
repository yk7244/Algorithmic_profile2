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

  useEffect(() => {
    // 현재 세션 가져오기
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // 사용자가 있으면 DB에서 추가 정보 가져오기
        if (session?.user) {
          const dbUser = await getUser(session.user.id);
          setUserData(dbUser);
        } else {
          setUserData(null);
        }
      }
      setIsLoading(false);
    };

    getSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // 사용자 데이터 업데이트
        if (session?.user) {
          let dbUser = await getUser(session.user.id);
          if (!dbUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            // 새 사용자인 경우 DB에 생성
            console.log('🔄 사용자가 DB에 없습니다. 생성 시도:', session.user.id);
            await createUserProfile(session.user);
            
            // 생성 후 다시 조회 (최대 3번 재시도)
            let retryCount = 0;
            while (!dbUser && retryCount < 3) {
              console.log(`🔄 사용자 조회 재시도 ${retryCount + 1}/3`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
              dbUser = await getUser(session.user.id);
              retryCount++;
            }
            
            if (!dbUser) {
              console.error('❌ 사용자 생성/조회 최종 실패:', session.user.id);
            } else {
              console.log('✅ 사용자 조회 성공:', dbUser.id);
            }
          }
          setUserData(dbUser);
        } else {
          setUserData(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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