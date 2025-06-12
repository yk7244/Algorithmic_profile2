'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: () => void; // 호환성을 위해 유지
  logout: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github' | 'apple') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Supabase가 설정되지 않았으면 로딩 완료
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 현재 세션 가져오기
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 호환성을 위한 더미 login 함수 유지
  const login = () => {
    console.log('Use signInWithProvider instead');
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      console.error('Supabase가 설정되지 않았습니다.');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      console.log('User logged out');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'apple') => {
    // 환경변수 검증
    if (!isSupabaseConfigured) {
      const errorMessage = '❌ Supabase 환경변수가 설정되지 않았습니다.\n\n.env.local 파일에 다음 환경변수를 추가해주세요:\n• NEXT_PUBLIC_SUPABASE_URL\n• NEXT_PUBLIC_SUPABASE_ANON_KEY';
      console.error(errorMessage);
      alert(errorMessage);
      throw new Error('Supabase configuration missing');
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/upload/page_user`
        }
      });

      if (error) {
        console.error(`Error signing in with ${provider}:`, error);
        throw error;
      }

      console.log(`Signing in with ${provider}...`);
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isLoggedIn: !!user,
    login, // 호환성을 위해 유지
    logout,
    signInWithProvider,
  };

  return (
    <AuthContext.Provider value={value}>
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